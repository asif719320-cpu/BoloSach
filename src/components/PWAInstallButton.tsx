import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { LangCode } from '../types/bolosach';

interface PWAInstallButtonProps {
  lang: LangCode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{lang === 'ur' ? 'ایپ انسٹال' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{lang === 'ur' ? 'ایپ انسٹال' : 'Install App'}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white border border-neutral-200 p-6 shadow-xl"
              dir={lang === 'ur' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 id="ios-install-title" className="text-base font-bold text-neutral-950">
                  {lang === 'ur' ? 'آئی فون پر BoloSach انسٹال کریں' : 'Install BoloSach on iPhone'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="space-y-2.5 text-sm text-neutral-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono-nums font-bold text-emerald-700">1.</span>
                  <span className="flex items-center gap-1 flex-wrap">
                    {lang === 'ur'
                      ? 'Safari میں نیچے Share بٹن دبائیں'
                      : 'Tap the Share icon in Safari toolbar'}
                    <Share className="w-4 h-4 text-emerald-600 inline shrink-0" />
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-nums font-bold text-emerald-700">2.</span>
                  <span>
                    {lang === 'ur'
                      ? 'نیچے اسکرول کر کے "Add to Home Screen" منتخب کریں'
                      : 'Scroll down and tap "Add to Home Screen"'}
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {lang === 'ur' ? 'سمجھ گیا' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
