import { useState } from 'react';
import { Crown, ClipboardList, Sprout, ArrowRight, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { LargeButton } from '@/components/ui';

const OWNER_PASSWORD = 'sannidhi2026';

export function RoleSelection() {
  const { t, setRole } = useApp();
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const roles: { key: 'owner' | 'manager'; label: string; desc: string; icon: typeof Crown; color: string; bg: string }[] = [
    { key: 'owner', label: t('owner'), desc: t('ownerDesc'), icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'manager', label: t('manager'), desc: t('managerDesc'), icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const handleSelect = (key: 'owner' | 'manager') => {
    if (key === 'owner') {
      setVerifying(true);
      setPassword('');
      setError(false);
    } else {
      setRole('manager');
    }
  };

  const handleUnlock = () => {
    if (password === OWNER_PASSWORD) {
      setRole('owner');
    } else {
      setError(true);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white p-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="rounded-3xl bg-amber-500 p-5 shadow-lg shadow-amber-500/30">
            <Lock className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('appName')}</h1>
          <p className="text-gray-500">{t('enterPassword')}</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder={t('ownerPassword')}
            className={`w-full rounded-2xl border-2 px-4 py-4 text-lg outline-none transition-colors ${
              error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-amber-500'
            }`}
          />
          {error && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle size={16} /> {t('wrongPassword')}
            </p>
          )}
          <LargeButton onClick={handleUnlock} className="!bg-amber-500 active:!bg-amber-600 !shadow-amber-500/20">
            <Lock size={20} /> {t('unlock')}
          </LargeButton>
          <button
            onClick={() => setVerifying(false)}
            className="flex w-full items-center justify-center gap-2 py-3 text-gray-500 active:text-gray-700"
          >
            <ArrowLeft size={18} /> {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="rounded-3xl bg-emerald-600 p-5 shadow-lg shadow-emerald-600/30">
          <Sprout className="text-white" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('appName')}</h1>
      </div>

      <div className="w-full max-w-md space-y-4">
        <p className="text-center text-lg font-medium text-gray-600">{t('selectRole')}</p>
        {roles.map(({ key, label, desc, icon: Icon, color, bg }) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            className="group flex w-full items-center gap-4 rounded-3xl bg-white p-5 shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
          >
            <div className={`rounded-2xl ${bg} p-4 transition-transform group-active:scale-90`}>
              <Icon className={color} size={32} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-bold text-gray-900">{label}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-gray-400 transition-colors" size={24} />
          </button>
        ))}
      </div>
    </div>
  );
}
