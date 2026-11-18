import { Wifi, WifiOff, Cloud, CloudOff, Check } from 'lucide-react';
import { useApp } from '@/lib/context';

export function SyncBadge({ synced }: { synced?: number }) {
  const { t } = useApp();
  if (synced) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <Check size={14} /> {t('syncedToCloud')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <CloudOff size={14} /> {t('savedOffline')}
    </span>
  );
}

export function ConnectionIndicator() {
  const { online, t } = useApp();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        online ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {online ? <Wifi size={14} /> : <WifiOff size={14} />}
      {online ? t('online') : t('offline')}
    </span>
  );
}

export function SyncStatusPill({ syncing }: { syncing: boolean }) {
  const { t } = useApp();
  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        <Cloud size={14} className="animate-pulse" /> {t('syncing')}
      </span>
    );
  }
  return null;
}
