import { useState, useEffect } from 'react';
import { SprayCan, Save } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, genLocalId, type SprayRecord, type CropRecord } from '@/lib/db';
import { syncAll, isOnline } from '@/lib/sync';
import { todayISO } from '@/lib/image';
import { LargeButton, Input, Select, TextArea } from '@/components/ui';
import { SyncBadge } from '@/components/SyncBadge';

export function MedicineSprayingScreen() {
  const { t } = useApp();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [cropLocalId, setCropLocalId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState<SprayRecord | null>(null);

  useEffect(() => {
    db.crops.toArray().then((rows) => {
      const active = rows.filter((r) => r.active);
      setCrops(active);
      if (active.length && !cropLocalId) setCropLocalId(active[0].local_id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const crop = crops.find((c) => c.local_id === cropLocalId);
    const record: SprayRecord = {
      local_id: genLocalId('spray'),
      date: todayISO(),
      crop_local_id: cropLocalId || undefined,
      crop_name: crop?.name || 'Unknown',
      medicine_name: medicineName,
      quantity,
      notes: notes || undefined,
      created_at: Date.now(),
    };
    await db.spray.put(record);
    if (isOnline()) {
      await syncAll();
      const updated = await db.spray.get(record.local_id);
      setSaved(updated || record);
    } else {
      setSaved(record);
    }
    setMedicineName('');
    setQuantity('');
    setNotes('');
  };

  const canSave = cropLocalId && medicineName.trim() && quantity.trim();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-teal-100 p-3">
          <SprayCan className="text-teal-600" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('medicineSpraying')}</h2>
          <p className="text-sm text-gray-500">{t('medicineSprayingDesc')}</p>
        </div>
      </div>

      {crops.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-6 text-center">
          <p className="text-amber-800">{t('noCrops')}</p>
        </div>
      ) : (
        <>
          <Select label={t('selectCrop')} value={cropLocalId} onChange={(e) => setCropLocalId(e.target.value)}>
            {crops.map((c) => (
              <option key={c.local_id} value={c.local_id}>
                {c.name} {c.variety ? `(${c.variety})` : ''}
              </option>
            ))}
          </Select>

          <Input
            label={t('medicineName')}
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            placeholder="e.g. Chlorpyrifos"
          />

          <Input
            label={t('quantity')}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={t('quantityPlaceholder')}
          />

          <TextArea
            label={t('notes')}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

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
