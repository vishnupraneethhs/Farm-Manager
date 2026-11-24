import { useState, useEffect } from 'react';
import { ArrowLeft, Sprout, LogOut } from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import { RoleSelection } from '@/screens/RoleSelection';
import { OwnerDashboard } from '@/screens/OwnerDashboard';
import { ManagerHome, type ManagerTab } from '@/screens/ManagerHome';
import { DailyLaborScreen } from '@/screens/DailyLaborScreen';
import { MedicineSprayingScreen } from '@/screens/MedicineSprayingScreen';
import { OtherExpensesScreen } from '@/screens/OtherExpensesScreen';
import { DailyIncomeScreen } from '@/screens/DailyIncomeScreen';
import { CropDoctorScreen } from '@/screens/CropDoctorScreen';
import FarmChatScreen from '@/screens/FarmChatScreen';
import { ConnectionIndicator } from '@/components/SyncBadge';
import { syncAll, processPendingDoctorQueries } from '@/lib/sync';
import { ChatFAB } from '@/components/ChatFAB';

function LanguageToggle() {
  const { lang, setLang, t } = useApp();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-gray-100 active:scale-95 transition-transform"
    >
      {t('language')}
    </button>
  );
}

function Header({ onBack, showBack }: { onBack: () => void; showBack: boolean }) {
  const { t, role, setRole } = useApp();
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button onClick={onBack} className="rounded-xl p-2 text-gray-600 active:bg-gray-100">
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div className="rounded-xl bg-emerald-100 p-2">
              <Sprout className="text-emerald-600" size={22} />
            </div>
          )}
          <span className="font-bold text-gray-900">{t('appName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionIndicator />
          <LanguageToggle />
          {role && (
            <button
              onClick={() => setRole(null)}
              className="rounded-xl bg-gray-50 p-2 text-gray-500 active:bg-gray-100"
              title={t('exitToRoles')}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const { role, online } = useApp();
  const [managerTab, setManagerTab] = useState<ManagerTab | null>(null);

  // Auto-sync and process pending AI queries when coming online
  useEffect(() => {
    if (online) {
      syncAll().catch(() => {});
      processPendingDoctorQueries().catch(() => {});
    }
  }, [online]);

  // Reset manager tab when leaving
  useEffect(() => {
    if (role !== 'manager') setManagerTab(null);
  }, [role]);

  if (!role) {
    return <RoleSelection />;
  }

  const showBack = role === 'manager' && managerTab !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showBack={showBack}
        onBack={() => setManagerTab(null)}
      />
      {role === 'owner' && (
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
          <OwnerDashboard />
        </div>
      )}
      {role === 'manager' && (
        <ManagerViewWrapper tab={managerTab} setTab={setManagerTab} />
      )}
      {/* Global floating AI chat button — always visible */}
      <ChatFAB />
    </div>
  );
}

function ManagerViewWrapper({ tab, setTab }: { tab: ManagerTab | null; setTab: (t: ManagerTab | null) => void }) {
  const { t } = useApp();
  if (tab) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        {tab === 'labor' && <DailyLaborScreen />}
        {tab === 'spray' && <MedicineSprayingScreen />}
        {tab === 'expense' && <OtherExpensesScreen />}
        {tab === 'income' && <DailyIncomeScreen />}
        {tab === 'doctor' && <CropDoctorScreen />}
        {tab === 'chat' && <FarmChatScreen />}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{t('manager')}</h1>
        <p className="text-gray-500">{t('managerDesc')}</p>
      </div>
      <ManagerHome onSelect={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
