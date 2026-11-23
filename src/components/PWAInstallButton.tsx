import React, { useState } from 'react';
import { Check, Copy, Download, MoreVertical, Share, Smartphone, X } from 'lucide-react';
import APP_ICON from '../assets/images/bolosach_app_icon_custom.jpg';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { LangCode } from '../types/bolosach';

interface PWAInstallButtonProps {
  lang: LangCode;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{lang === 'ur' ? 'ایپ اس فون پر انسٹال ہے' : 'App installed on this device'}</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const handleCopyDownloadUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const buttonLabel =
    variant === 'full'
      ? lang === 'ur'
        ? 'ایپ ڈاؤن لوڈ کریں'
        : 'Download App'
      : lang === 'ur'
        ? 'ڈاؤن لوڈ'
        : 'Download';

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={
          variant === 'full'
            ? 'w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer'
            : 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download
          className={`w-3.5 h-3.5 shrink-0 ${variant === 'full' ? 'text-emerald-400' : 'text-emerald-600'}`}
        />
        <span>{buttonLabel}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 shadow-xl"
            dir={lang === 'ur' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={APP_ICON}
                  alt="BoloSach"
                  className="w-11 h-11 rounded-xl object-cover border border-neutral-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3 id="install-guide-title" className="text-base font-extrabold text-neutral-950">
                    {lang === 'ur' ? 'BoloSach ایپ انسٹال کریں' : 'Download & Install BoloSach'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {lang === 'ur' ? 'بغیر Play Store سیدھا فون پر لگائیں' : 'Install directly on your home screen'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-neutral-700 leading-relaxed mb-5">
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
                      ? 'نیچے اسکرول کر کے "Add to Home Screen" منتخب کریں اور Add دبائیں'
                      : 'Scroll down, tap "Add to Home Screen", then tap Add'}
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-neutral-700 leading-relaxed mb-5">
                <li className="flex items-start gap-2">
                  <span className="font-mono-nums font-bold text-emerald-700">1.</span>
                  <span className="flex items-center gap-1 flex-wrap">
                    {lang === 'ur'
                      ? 'اگر یہ لنک WhatsApp یا کسی ایپ کے اندر کھلا ہے تو اوپر تین نقطوں'
                      : 'If opened inside another app, tap'}
                    <MoreVertical className="w-4 h-4 text-neutral-700 inline shrink-0" />
                    {lang === 'ur' ? 'سے "Open in Chrome" دبائیں' : 'and choose "Open in Chrome"'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-nums font-bold text-emerald-700">2.</span>
                  <span className="flex items-center gap-1 flex-wrap">
                    {lang === 'ur'
                      ? 'Chrome کے اوپر دائیں کونے میں'
                      : 'In Chrome, tap the top-right menu'}
                    <MoreVertical className="w-4 h-4 text-neutral-700 inline shrink-0" />
                    {lang === 'ur' ? 'پر کلک کریں' : ''}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-nums font-bold text-emerald-700">3.</span>
                  <span className="flex items-center gap-1 flex-wrap">
                    <Smartphone className="w-4 h-4 text-emerald-600 inline shrink-0" />
                    {lang === 'ur'
                      ? '"Install app" یا "Add to Home screen" دبائیں — نیا آئیکن فون پر آ جائے گا!'
                      : 'Tap "Install app" or "Add to Home screen" to install!'}
                  </span>
                </li>
              </ol>
            )}

            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 mb-4 space-y-2">
              <p className="text-[11px] font-semibold text-neutral-500">
                {lang === 'ur' ? 'ڈائریکٹ ایپ / ڈاؤن لوڈ لنک:' : 'Direct App Download Link:'}
              </p>
              <p className="text-xs font-mono-nums text-neutral-800 truncate">
                {window.location.origin}
              </p>
              <button
                type="button"
                onClick={() => void handleCopyDownloadUrl()}
                className="w-full min-h-[38px] px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedUrl
                    ? lang === 'ur'
                      ? 'لنک کاپی ہو گیا!'
                      : 'Link Copied!'
                    : lang === 'ur'
                      ? 'ایپ لنک کاپی کریں'
                      : 'Copy App Link'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              {lang === 'ur' ? 'سمجھ گیا' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
