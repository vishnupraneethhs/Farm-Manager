import { useState } from 'react';
import { Sprout, List, BarChart3, LogOut, IndianRupee, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/context';
import { CropsManager } from './CropsManager';
import { DailyLogs } from './DailyLogs';
import { WeeklyExpenses } from './WeeklyExpenses';
import { DailyIncomeScreen } from './DailyIncomeScreen';
import FarmChatScreen from './FarmChatScreen';
import { ConnectionIndicator } from '@/components/SyncBadge';

type OwnerTab = 'crops' | 'income' | 'logs' | 'weekly' | 'chat';

export function OwnerDashboard() {
  const { t, setRole } = useApp();
  const [tab, setTab] = useState<OwnerTab>('crops');

  const tabs: { key: OwnerTab; label: string; icon: typeof Sprout }[] = [
    { key: 'crops', label: t('myCrops'), icon: Sprout },
    { key: 'income', label: t('dailyIncome'), icon: IndianRupee },
    { key: 'logs', label: t('dailyLogs'), icon: List },
    { key: 'weekly', label: t('weeklyExpenses'), icon: BarChart3 },
    { key: 'chat', label: t('aiFarmAssistant'), icon: Sparkles },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionIndicator />
          <button
            onClick={() => setRole(null)}
            className="rounded-xl bg-gray-50 p-2.5 text-gray-500 active:bg-gray-100"
            title={t('exitToRoles')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'crops' && <CropsManager />}
        {tab === 'income' && <DailyIncomeScreen />}
        {tab === 'logs' && <DailyLogs />}
        {tab === 'weekly' && <WeeklyExpenses />}
        {tab === 'chat' && <FarmChatScreen />}
      </div>
    </div>
  );
}
