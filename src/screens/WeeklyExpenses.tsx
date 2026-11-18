import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, SprayCan, Receipt, IndianRupee, Wallet } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db } from '@/lib/db';
import { formatCurrency, startOfWeek } from '@/lib/image';
import { Card } from '@/components/ui';

export function WeeklyExpenses() {
  const { t } = useApp();
  const [laborTotal, setLaborTotal] = useState(0);
  const [sprayCount, setSprayCount] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const weekStart = startOfWeek().toISOString().slice(0, 10);
      const [labor, spray, expense, income] = await Promise.all([
        db.labor.where('date').aboveOrEqual(weekStart).toArray(),
        db.spray.where('date').aboveOrEqual(weekStart).toArray(),
        db.expense.where('date').aboveOrEqual(weekStart).toArray(),
        db.income.where('date').aboveOrEqual(weekStart).toArray(),
      ]);
      setLaborTotal(labor.reduce((s, r) => s + r.total, 0));
      setSprayCount(spray.length);
      setExpenseTotal(expense.reduce((s, r) => s + r.amount, 0));
      setIncomeTotal(income.reduce((s, r) => s + r.amount, 0));
    })();
  }, []);

  const totalExpenses = laborTotal + expenseTotal;
  const netProfit = incomeTotal - totalExpenses;

  const rows = [
    { label: t('income'), value: formatCurrency(incomeTotal), icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
    { label: t('labor'), value: formatCurrency(laborTotal), icon: Users, color: 'text-orange-600 bg-orange-50' },
    { label: t('spraying'), value: `${sprayCount}`, icon: SprayCan, color: 'text-teal-600 bg-teal-50' },
    { label: t('expenses'), value: formatCurrency(expenseTotal), icon: Receipt, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-4">
      <Card className={`bg-gradient-to-br text-white ${netProfit >= 0 ? 'from-emerald-600 to-emerald-700' : 'from-red-500 to-red-600'}`}>
        <div className="flex items-center gap-3">
          <Wallet size={28} />
          <div>
            <p className="text-sm opacity-90">{t('thisWeek')} — {t('grandTotal')}</p>
            <p className="text-3xl font-bold">{formatCurrency(netProfit)}</p>
            <div className="mt-2 flex gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1"><TrendingUp size={14} /> {formatCurrency(incomeTotal)}</span>
              <span className="flex items-center gap-1"><TrendingDown size={14} /> {formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {rows.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon size={22} />
              </div>
              <span className="flex-1 font-medium text-gray-700">{label}</span>
              <span className="text-xl font-bold text-gray-900">{value}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
