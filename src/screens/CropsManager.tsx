import { useState, useEffect } from 'react';
import { Plus, Sprout, Pencil, Trash2, Check, X } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, genLocalId, type CropRecord } from '@/lib/db';
import { syncAll, isOnline } from '@/lib/sync';
import { LargeButton, Input, TextArea, Modal, Card } from '@/components/ui';
import { SyncBadge } from '@/components/SyncBadge';

export function CropsManager() {
  const { t } = useApp();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [editing, setEditing] = useState<CropRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [area, setArea] = useState(0);
  const [notes, setNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CropRecord | null>(null);

  const loadCrops = () => {
    db.crops.orderBy('created_at').reverse().toArray().then(setCrops);
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setVariety('');
    setArea(0);
    setNotes('');
    setShowForm(true);
  };

  const openEdit = (crop: CropRecord) => {
    setEditing(crop);
    setName(crop.name);
    setVariety(crop.variety || '');
    setArea(crop.area_acres || 0);
    setNotes(crop.notes || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editing) {
      await db.crops.update(editing.local_id, {
        name,
        variety: variety || undefined,
        area_acres: area || undefined,
        notes: notes || undefined,
        updated_at: Date.now(),
        synced: undefined,
      });
    } else {
      const record: CropRecord = {
        local_id: genLocalId('crop'),
        name,
        variety: variety || undefined,
        area_acres: area || undefined,
        notes: notes || undefined,
        active: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      await db.crops.put(record);
    }
    if (isOnline()) await syncAll();
    setShowForm(false);
    loadCrops();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await db.crops.delete(deleteTarget.local_id);
    if (isOnline()) await syncAll();
    setDeleteTarget(null);
    loadCrops();
  };

  const toggleActive = async (crop: CropRecord) => {
    await db.crops.update(crop.local_id, { active: !crop.active, updated_at: Date.now(), synced: undefined });
    if (isOnline()) await syncAll();
    loadCrops();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('myCrops')}</h2>
        <LargeButton variant="primary" fullWidth={false} onClick={openAdd} className="!py-3 !px-4 !text-base">
          <Plus size={20} /> {t('addCrop')}
        </LargeButton>
      </div>

      {crops.length === 0 ? (
        <Card className="text-center py-10">
          <Sprout size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">{t('noData')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {crops.map((crop) => (
            <Card key={crop.local_id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{crop.name}</h3>
                    <button
                      onClick={() => toggleActive(crop)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${crop.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {crop.active ? t('active') : t('inactive')}
                    </button>
                  </div>
                  {crop.variety && <p className="text-sm text-gray-500">{t('variety')}: {crop.variety}</p>}
                  {crop.area_acres ? <p className="text-sm text-gray-500">{t('areaAcres')}: {crop.area_acres}</p> : null}
                  {crop.notes && <p className="mt-1 text-sm text-gray-600">{crop.notes}</p>}
                  <div className="mt-2">
                    <SyncBadge synced={crop.synced} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(crop)} className="rounded-xl bg-gray-50 p-2 text-gray-600 active:bg-gray-100">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => setDeleteTarget(crop)} className="rounded-xl bg-red-50 p-2 text-red-600 active:bg-red-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? t('editCrop') : t('addCrop')}>
        <div className="space-y-4">
          <Input label={t('cropName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('variety')} value={variety} onChange={(e) => setVariety(e.target.value)} />
          <Input
            type="number"
            inputMode="decimal"
            label={t('areaAcres')}
            value={area || ''}
            onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
            min={0}
          />
          <TextArea label={t('notes')} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-3">
            <LargeButton variant="secondary" onClick={() => setShowForm(false)}>
              <X size={20} /> {t('cancel')}
            </LargeButton>
            <LargeButton onClick={handleSave} disabled={!name.trim()}>
              <Check size={20} /> {t('save')}
            </LargeButton>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('confirmDelete')}>
        <p className="mb-4 text-gray-600">{deleteTarget?.name}</p>
        <div className="flex gap-3">
          <LargeButton variant="secondary" onClick={() => setDeleteTarget(null)}>
            {t('cancel')}
          </LargeButton>
          <LargeButton variant="danger" onClick={handleDelete}>
            <Trash2 size={20} /> {t('delete')}
          </LargeButton>
        </div>
      </Modal>
    </div>
  );
}
