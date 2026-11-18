import { useState } from 'react';
import { Receipt, Save, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, genLocalId, type ExpenseRecord } from '@/lib/db';
import { syncAll, isOnline } from '@/lib/sync';
import { todayISO, formatCurrency } from '@/lib/image';
import { LargeButton, Input, Select, TextArea } from '@/components/ui';
import { CameraCapture } from '@/components/CameraCapture';
import { SyncBadge } from '@/components/SyncBadge';

const RECEIPT_THRESHOLD = 500;

export function OtherExpensesScreen() {
  const { t } = useApp();
  const [category, setCategory] = useState('seeds');
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  const [saved, setSaved] = useState<ExpenseRecord | null>(null);
  const [showReceiptError, setShowReceiptError] = useState(false);

  const needsReceipt = amount > RECEIPT_THRESHOLD;

  const handleSave = async () => {
    if (needsReceipt && !photo) {
      setShowReceiptError(true);
      return;
    }
    setShowReceiptError(false);
    const record: ExpenseRecord = {
      local_id: genLocalId('expense'),
      date: todayISO(),
      category,
      amount,
      notes: notes || undefined,
      receipt_photo: photo || undefined,
      created_at: Date.now(),
    };
    await db.expense.put(record);
    if (isOnline()) {
      await syncAll();
      const updated = await db.expense.get(record.local_id);
      setSaved(updated || record);
    } else {
      setSaved(record);
    }
    setAmount(0);
    setNotes('');
    setPhoto('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-purple-100 p-3">
          <Receipt className="text-purple-600" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('otherExpenses')}</h2>
          <p className="text-sm text-gray-500">{t('otherExpensesDesc')}</p>
        </div>
      </div>

      <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="seeds">{t('catSeeds')}</option>
        <option value="fertilizer">{t('catFertilizer')}</option>
        <option value="fuel">{t('catFuel')}</option>
        <option value="equipment">{t('catEquipment')}</option>
        <option value="transport">{t('catTransport')}</option>
        <option value="other">{t('catOther')}</option>
      </Select>

      <Input
        type="number"
        inputMode="numeric"
        label={t('amount')}
        value={amount || ''}
        onChange={(e) => {
          setAmount(Math.max(0, Number(e.target.value)));
          setShowReceiptError(false);
        }}
        min={0}
      />

      {needsReceipt && (
        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <AlertCircle size={18} />
            <span className="text-sm font-semibold">{t('receiptPhoto')}</span>
          </div>
          <CameraCapture onCapture={(v) => { setPhoto(v); setShowReceiptError(false); }} compact />
        </div>
      )}

      {showReceiptError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {t('mandatoryReceipt')}
        </p>
      )}

      <TextArea
        label={t('notes')}
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {amount > 0 && (
        <div className="rounded-2xl bg-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">{t('amount')}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>
      )}

      <LargeButton onClick={handleSave} disabled={amount <= 0}>
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
