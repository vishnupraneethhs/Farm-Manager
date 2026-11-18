import { useState, useEffect } from 'react';
import { IndianRupee, Save, Calendar } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, genLocalId, type IncomeRecord, type CropRecord } from '@/lib/db';
import { syncAll, isOnline } from '@/lib/sync';
import { todayISO, formatCurrency } from '@/lib/image';
import { LargeButton, Input, Select, TextArea } from '@/components/ui';
import { CameraCapture } from '@/components/CameraCapture';
import { SyncBadge } from '@/components/SyncBadge';

export function DailyIncomeScreen() {
  const { t } = useApp();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [cropLocalId, setCropLocalId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(0);
  const [billPhoto, setBillPhoto] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState<IncomeRecord | null>(null);

  useEffect(() => {
    db.crops.toArray().then((rows) => {
      const active = rows.filter((r) => r.active);
      setCrops(active);
      if (active.length) setCropLocalId(active[0].local_id);
    });
  }, []);

  const handleSave = async () => {
    const crop = crops.find((c) => c.local_id === cropLocalId);
    const record: IncomeRecord = {
      local_id: genLocalId('income'),
      date,
      crop_local_id: cropLocalId || undefined,
      crop_name: crop?.name || 'Unknown',
      amount,
      bill_photo: billPhoto || undefined,
      notes: notes || undefined,
      created_at: Date.now(),
    };
    await db.income.put(record);
    if (isOnline()) {
      await syncAll();
      const updated = await db.income.get(record.local_id);
      setSaved(updated || record);
    } else {
      setSaved(record);
    }
    setAmount(0);
    setBillPhoto('');
    setNotes('');
  };

  const canSave = cropLocalId && amount > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3">
          <IndianRupee className="text-emerald-600" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('dailyIncome')}</h2>
          <p className="text-sm text-gray-500">{t('dailyIncomeDesc')}</p>
        </div>
      </div>

      {crops.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-6 text-center">
          <p className="text-amber-800">{t('noCrops')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Select label={t('selectCrop')} value={cropLocalId} onChange={(e) => setCropLocalId(e.target.value)}>
            {crops.map((c) => (
              <option key={c.local_id} value={c.local_id}>
                {c.name} {c.variety ? `(${c.variety})` : ''}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            inputMode="numeric"
            label={t('incomeAmount')}
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            min={0}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-600">{t('billPhoto')}</span>
            <CameraCapture onCapture={setBillPhoto} compact />
          </div>

          <TextArea
            label={t('notes')}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {amount > 0 && (
            <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white">
              <p className="text-sm opacity-90">{t('incomeAmount')}</p>
              <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
            </div>
          )}

          <LargeButton onClick={handleSave} disabled={!canSave}>
            <Save size={22} /> {t('save')}
          </LargeButton>

          {saved && (
            <div className="flex justify-center">
              <SyncBadge synced={saved.synced} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
