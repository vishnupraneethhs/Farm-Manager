import { Users, SprayCan, Receipt, Leaf, IndianRupee } from 'lucide-react';
import { useApp } from '@/lib/context';
import type { TranslationKey } from '@/lib/i18n';

export type ManagerTab = 'labor' | 'spray' | 'expense' | 'income' | 'doctor';

interface Props {
  onSelect: (tab: ManagerTab) => void;
}

export function ManagerHome({ onSelect }: Props) {
  const { t } = useApp();

  const cards: { tab: ManagerTab; key: TranslationKey; descKey: TranslationKey; icon: typeof Users; color: string; bg: string }[] = [
    { tab: 'labor', key: 'dailyLabor', descKey: 'dailyLaborDesc', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { tab: 'spray', key: 'medicineSpraying', descKey: 'medicineSprayingDesc', icon: SprayCan, color: 'text-teal-600', bg: 'bg-teal-50' },
    { tab: 'expense', key: 'otherExpenses', descKey: 'otherExpensesDesc', icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50' },
    { tab: 'income', key: 'dailyIncome', descKey: 'dailyIncomeDesc', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { tab: 'doctor', key: 'aiCropDoctor', descKey: 'aiCropDoctorDesc', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map(({ tab, key, descKey, icon: Icon, color, bg }) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className="group flex flex-col items-start gap-3 rounded-3xl bg-white p-6 text-left shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
        >
          <div className={`rounded-2xl ${bg} p-4 transition-transform group-active:scale-90`}>
            <Icon className={color} size={36} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t(key)}</h3>
            <p className="mt-1 text-sm text-gray-500">{t(descKey)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
