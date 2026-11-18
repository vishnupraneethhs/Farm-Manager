import { useState } from 'react';
import { Users, Save, Calendar } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, genLocalId, type LaborRecord } from '@/lib/db';
import { syncAll, isOnline } from '@/lib/sync';
import { todayISO } from '@/lib/image';
import { LargeButton, Input, TextArea } from '@/components/ui';
import { CameraCapture } from '@/components/CameraCapture';
import { SyncBadge } from '@/components/SyncBadge';

export function DailyLaborScreen() {
  const { t } = useApp();
  const [date, setDate] = useState(todayISO());
  const [maleCount, setMaleCount] = useState(0);
  const [maleRate, setMaleRate] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [femaleRate, setFemaleRate] = useState(0);
  const [photo, setPhoto] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState<LaborRecord | null>(null);

  const total = maleCount * maleRate + femaleCount * femaleRate;

  const handleSave = async () => {
    const record: LaborRecord = {
      local_id: genLocalId('labor'),
      date,
      male_count: maleCount,
      male_rate: maleRate,
      female_count: femaleCount,
      female_rate: femaleRate,
      total,
      photo: photo || undefined,
      notes: notes || undefined,
      created_at: Date.now(),
    };
    await db.labor.put(record);
    if (isOnline()) {
      await syncAll();
      const updated = await db.labor.get(record.local_id);
      setSaved(updated || record);
    } else {
      setSaved(record);
    }
    setMaleCount(0);
    setMaleRate(0);
    setFemaleCount(0);
    setFemaleRate(0);
    setPhoto('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-orange-100 p-3">
          <Users className="text-orange-600" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('dailyLabor')}</h2>
          <p className="text-sm text-gray-500">{t('dailyLaborDesc')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Calendar size={20} className="text-gray-400" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="rounded-2xl bg-blue-50 p-4">
        <p className="mb-3 text-sm font-semibold text-blue-900">{t('maleWorkers')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            inputMode="numeric"
            label={t('maleCount')}
            value={maleCount || ''}
            onChange={(e) => setMaleCount(Math.max(0, Number(e.target.value)))}
            min={0}
          />
          <Input
            type="number"
            inputMode="numeric"
            label={t('maleRate')}
            value={maleRate || ''}
            onChange={(e) => setMaleRate(Math.max(0, Number(e.target.value)))}
            min={0}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-pink-50 p-4">
        <p className="mb-3 text-sm font-semibold text-pink-900">{t('femaleWorkers')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            inputMode="numeric"
            label={t('femaleCount')}
            value={femaleCount || ''}
            onChange={(e) => setFemaleCount(Math.max(0, Number(e.target.value)))}
            min={0}
          />
          <Input
            type="number"
            inputMode="numeric"
            label={t('femaleRate')}
            value={femaleRate || ''}
            onChange={(e) => setFemaleRate(Math.max(0, Number(e.target.value)))}
            min={0}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white">
        <p className="text-sm font-medium opacity-90">{t('total')}</p>
        <p className="text-3xl font-bold">₹{total.toLocaleString('en-IN')}</p>
      </div>

      <CameraCapture onCapture={setPhoto} />

      <TextArea
        label={t('notes')}
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <LargeButton onClick={handleSave} disabled={total === 0}>
        <Save size={22} /> {t('save')}
      </LargeButton>

      {saved && (
        <div className="flex justify-center">
          <SyncBadge synced={saved.synced} />
        </div>
      )}
    </div>
  );
}
