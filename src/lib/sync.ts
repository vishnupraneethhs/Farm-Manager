import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { db, TABLE_MAP, type SyncableTable } from './db';
import { diagnoseLeaf, geminiConfigured } from './gemini';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

const SUPABASE_TABLE: Record<SyncableTable, string> = {
  crops: 'crops',
  labor: 'labor_logs',
  spray: 'spray_logs',
  expense: 'expense_logs',
  income: 'income_logs',
  doctor: 'crop_doctor_queries',
};

function toRow(record: any): any {
  const { id, local_id, synced, created_at, ...rest } = record;
  const row: any = { local_id, ...rest };
  if (typeof created_at === 'number') {
    row.created_at = new Date(created_at).toISOString();
  }
  if (record.date) row.date = record.date;
  return row;
}

async function pushTable(table: SyncableTable): Promise<number> {
  if (!supabase) return 0;
  const localTable = TABLE_MAP[table];
  const unsynced = await localTable.toArray();
  let pushed = 0;
  for (const record of unsynced) {
    if (record.synced) continue;
    const row = toRow(record);
    const supaTable = SUPABASE_TABLE[table];
    const { data, error } = await supabase
      .from(supaTable)
      .upsert(row, { onConflict: 'local_id' })
      .select('id')
      .maybeSingle();
    if (error || !data) continue;
    await localTable.update(record.local_id, {
      id: data.id,
      synced: Date.now(),
    });
    pushed++;
  }
  return pushed;
}

async function pullTable(table: SyncableTable): Promise<number> {
  if (!supabase) return 0;
  const supaTable = SUPABASE_TABLE[table];
  const { data, error } = await supabase.from(supaTable).select('*');
  if (error || !data) return 0;
  const localTable = TABLE_MAP[table];
  let pulled = 0;
  for (const remote of data) {
    const existing = await localTable.get(remote.local_id);
    if (existing) {
      await localTable.update(remote.local_id, {
        id: remote.id,
        synced: Date.now(),
      });
    } else {
      const { id, local_id, created_at, updated_at, synced_at, ...rest } = remote;
      await localTable.put({
        local_id,
        id,
        ...rest,
        created_at: created_at ? new Date(created_at).getTime() : Date.now(),
        synced: Date.now(),
      } as any);
      pulled++;
    }
  }
  return pulled;
}

export async function syncAll(): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 };
  const tables: SyncableTable[] = ['crops', 'labor', 'spray', 'expense', 'income', 'doctor'];
  let pushed = 0;
  let pulled = 0;
  for (const t of tables) {
    pushed += await pushTable(t);
    pulled += await pullTable(t);
  }
  return { pushed, pulled };
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function processPendingDoctorQueries(): Promise<void> {
  if (!isOnline() || !geminiConfigured) return;
  const pending = await db.doctor
    .where('status')
    .anyOf(['saved_offline', 'pending'])
    .filter((q) => !q.answer)
    .toArray();
  for (const q of pending) {
    if (!q.image) continue;
    try {
      const answer = await diagnoseLeaf(q.image, q.question);
      await db.doctor.update(q.local_id, { status: 'answered', answer });
    } catch {
      // leave as pending for next retry
    }
  }
  // Push any newly-answered records to Supabase
  if (supabase) await pushTable('doctor');
}
