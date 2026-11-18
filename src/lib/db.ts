import Dexie, { type Table } from 'dexie';

export interface CropRecord {
  id?: string;
  local_id: string;
  name: string;
  variety?: string;
  area_acres?: number;
  notes?: string;
  active: boolean;
  created_at: number;
  updated_at: number;
  synced?: number;
}

export interface LaborRecord {
  id?: string;
  local_id: string;
  date: string;
  male_count: number;
  male_rate: number;
  female_count: number;
  female_rate: number;
  total: number;
  photo?: string;
  notes?: string;
  created_at: number;
  synced?: number;
}

export interface SprayRecord {
  id?: string;
  local_id: string;
  date: string;
  crop_local_id?: string;
  crop_name: string;
  medicine_name: string;
  quantity: string;
  notes?: string;
  created_at: number;
  synced?: number;
}

export interface ExpenseRecord {
  id?: string;
  local_id: string;
  date: string;
  category: string;
  amount: number;
  notes?: string;
  receipt_photo?: string;
  created_at: number;
  synced?: number;
}

export interface IncomeRecord {
  id?: string;
  local_id: string;
  date: string;
  crop_local_id?: string;
  crop_name: string;
  amount: number;
  bill_photo?: string;
  notes?: string;
  created_at: number;
  synced?: number;
}

export interface DoctorRecord {
  id?: string;
  local_id: string;
  date: string;
  question?: string;
  image?: string;
  answer?: string;
  status: 'pending' | 'answered' | 'saved_offline';
  created_at: number;
  synced?: number;
}

class FarmDB extends Dexie {
  crops!: Table<CropRecord, string>;
  labor!: Table<LaborRecord, string>;
  spray!: Table<SprayRecord, string>;
  expense!: Table<ExpenseRecord, string>;
  income!: Table<IncomeRecord, string>;
  doctor!: Table<DoctorRecord, string>;

  constructor() {
    super('farm_management_db');
    this.version(1).stores({
      crops: 'local_id, name, active, created_at',
      labor: 'local_id, date, created_at, synced',
      spray: 'local_id, date, crop_local_id, created_at, synced',
      expense: 'local_id, date, category, created_at, synced',
      doctor: 'local_id, date, status, created_at, synced',
    });
    this.version(2).stores({
      crops: 'local_id, name, active, created_at',
      labor: 'local_id, date, created_at, synced',
      spray: 'local_id, date, crop_local_id, created_at, synced',
      expense: 'local_id, date, category, created_at, synced',
      income: 'local_id, date, crop_local_id, crop_name, created_at, synced',
      doctor: 'local_id, date, status, created_at, synced',
    });
  }
}

export const db = new FarmDB();

export function genLocalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export type SyncableTable = 'crops' | 'labor' | 'spray' | 'expense' | 'income' | 'doctor';

export const TABLE_MAP: Record<SyncableTable, Table<any, string>> = {
  crops: db.crops,
  labor: db.labor,
  spray: db.spray,
  expense: db.expense,
  income: db.income,
  doctor: db.doctor,
};
