import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { LangCode } from '../types/bolosach';

interface OfflineIndicatorProps {
  lang: LangCode;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
      role="status"
      aria-live="polite"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>
        {lang === 'ur'
          ? 'آف لائن موڈ — محفوظ شدہ ڈیٹا دکھایا جا رہا ہے۔'
          : 'Offline Mode — Showing cached content.'}
      </span>
    </div>
  );
};
