import { useState, useEffect } from 'react';
import { Users, SprayCan, Receipt, IndianRupee } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, type LaborRecord, type SprayRecord, type ExpenseRecord, type IncomeRecord } from '@/lib/db';
import { formatDate, formatCurrency } from '@/lib/image';
import { Card } from '@/components/ui';

type LogEntry = {
  id: string;
  date: string;
  type: 'labor' | 'spray' | 'expense' | 'income';
  title: string;
  detail: string;
  amount?: number;
};

export function DailyLogs() {
  const { t } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [labor, spray, expense, income] = await Promise.all([
        db.labor.orderBy('date').reverse().toArray(),
        db.spray.orderBy('date').reverse().toArray(),
        db.expense.orderBy('date').reverse().toArray(),
        db.income.orderBy('date').reverse().toArray(),
      ]);
      const entries: LogEntry[] = [];
      (labor as LaborRecord[]).forEach((r) =>
        entries.push({
          id: r.local_id,
          date: r.date,
          type: 'labor',
          title: `${r.male_count + r.female_count} ${t('maleWorkers').toLowerCase()}/${t('femaleWorkers').toLowerCase()}`,
          detail: `${r.male_count}M + ${r.female_count}F`,
          amount: r.total,
        })
      );
      (spray as SprayRecord[]).forEach((r) =>
        entries.push({
          id: r.local_id,
          date: r.date,
          type: 'spray',
          title: r.crop_name,
          detail: `${r.medicine_name} — ${r.quantity}`,
        })
      );
      (expense as ExpenseRecord[]).forEach((r) =>
        entries.push({
          id: r.local_id,
          date: r.date,
          type: 'expense',
          title: r.category,
          detail: r.notes || '',
          amount: r.amount,
        })
      );
      (income as IncomeRecord[]).forEach((r) =>
        entries.push({
          id: r.local_id,
          date: r.date,
          type: 'income',
          title: r.crop_name,
          detail: r.notes || '',
          amount: r.amount,
        })
      );
      entries.sort((a, b) => b.date.localeCompare(a.date));
      setLogs(entries);
    })();
  }, [t]);

  const icon = { labor: Users, spray: SprayCan, expense: Receipt, income: IndianRupee };
  const color = {
    labor: 'text-orange-600 bg-orange-50',
    spray: 'text-teal-600 bg-teal-50',
    expense: 'text-purple-600 bg-purple-50',
    income: 'text-emerald-600 bg-emerald-50',
  };

  if (logs.length === 0) {
    return <Card className="py-10 text-center text-gray-500">{t('noLogs')}</Card>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const Icon = icon[log.type];
        return (
          <Card key={log.id}>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${color[log.type]}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 capitalize">{log.title}</p>
                <p className="text-sm text-gray-500">{log.detail}</p>
                <p className="text-xs text-gray-400">{formatDate(log.date)}</p>
              </div>
              {log.amount !== undefined && (
                <span className={`font-bold ${log.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {log.type === 'income' ? '+' : ''}{formatCurrency(log.amount)}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
