import React, { useState } from 'react';
import { Check, Copy, Download, Share, Smartphone, X } from 'lucide-react';
import APP_ICON from '../assets/images/bolosach_app_icon_custom.jpg';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { APK_DOWNLOAD_URL } from '../lib/shareCardGenerator';
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
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled && variant === 'compact') {
    return null;
  }

  const handleCopyDownloadUrl = async () => {
    try {
      await navigator.clipboard.writeText(APK_DOWNLOAD_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const buttonLabel =
    variant === 'full'
      ? lang === 'ur'
        ? 'ایپ ڈاؤن لوڈ کریں (APK)'
        : 'Download App (APK)'
      : lang === 'ur'
        ? 'ڈاؤن لوڈ'
        : 'Download';

  const buttonClasses =
    variant === 'full'
      ? 'w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer'
      : 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer';

  if (isIOS) {
    return (
      <>
        <button type="button" onClick={() => setShowGuide(true)} className={buttonClasses}>
          <Download
            className={`w-3.5 h-3.5 shrink-0 ${variant === 'full' ? 'text-emerald-400' : 'text-emerald-600'}`}
          />
          <span>{variant === 'full' ? (lang === 'ur' ? 'آئی فون پر انسٹال کریں' : 'Install on iPhone') : buttonLabel}</span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-guide-title"
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
                    <h3 id="ios-install-guide-title" className="text-base font-extrabold text-neutral-950">
                      {lang === 'ur' ? 'آئی فون پر BoloSach انسٹال کریں' : 'Install BoloSach on iPhone'}
                    </h3>
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
  }

  return (
    <>
      <a
        href={APK_DOWNLOAD_URL}
        download="BoloSach.apk"
        rel="noopener noreferrer"
        onClick={() => {
          setDownloadStarted(true);
          if (variant === 'full') {
            setShowGuide(true);
          }
        }}
        className={buttonClasses}
      >
        <Download
          className={`w-3.5 h-3.5 shrink-0 ${variant === 'full' ? 'text-emerald-400' : 'text-emerald-600'}`}
        />
        <span>{buttonLabel}</span>
      </a>

      {variant === 'full' && downloadStarted && !showGuide && (
        <p className="text-[11px] font-medium text-emerald-700 text-center">
          {lang === 'ur'
            ? 'BoloSach.apk ڈاؤن لوڈ شروع ہو گئی ہے — مکمل ہونے پر فائل کھول کر Install کریں۔'
            : 'Downloading BoloSach.apk — tap the file once complete to install.'}
        </p>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apk-download-title"
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
                  <h3 id="apk-download-title" className="text-base font-extrabold text-neutral-950">
                    {lang === 'ur' ? 'BoloSach.apk ڈاؤن لوڈ ہو رہی ہے' : 'Downloading BoloSach.apk'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {lang === 'ur'
                      ? 'ڈاؤن لوڈ مکمل ہونے پر فائل کھول کر انسٹال کریں'
                      : 'Open the downloaded file to install on Android'}
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

            <ol className="space-y-2 text-sm text-neutral-700 leading-relaxed mb-4">
              <li className="flex items-start gap-2">
                <span className="font-mono-nums font-bold text-emerald-700">1.</span>
                <span>
                  {lang === 'ur'
                    ? 'اوپر نوٹیفکیشن بار یا Chrome Downloads میں BoloSach.apk مکمل ہونے کا انتظار کریں۔'
                    : 'Wait for BoloSach.apk to finish downloading in Chrome Downloads.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono-nums font-bold text-emerald-700">2.</span>
                <span>
                  {lang === 'ur'
                    ? 'فائل پر کلک کر کے Install دبائیں (اگر اجازت مانگے تو Allow from this source آن کریں)۔'
                    : 'Tap the APK file and press Install (allow unknown apps if prompted).'}
                </span>
              </li>
            </ol>

            <div className="space-y-2 mb-4">
              <a
                href={APK_DOWNLOAD_URL}
                download="BoloSach.apk"
                rel="noopener noreferrer"
                className="w-full min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ur' ? 'دوبارہ APK ڈاؤن لوڈ کریں' : 'Download APK Again'}</span>
              </a>

              {isInstallable && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGuide(false);
                    void install();
                  }}
                  className="w-full min-h-[40px] px-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ur' ? 'یا Chrome سے ڈائریکٹ انسٹال کریں' : 'Or Instant Install via Chrome'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleCopyDownloadUrl()}
                className="w-full min-h-[38px] px-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedUrl
                    ? lang === 'ur'
                      ? 'APK لنک کاپی ہو گیا!'
                      : 'APK Link Copied!'
                    : lang === 'ur'
                      ? 'APK ڈاؤن لوڈ لنک کاپی کریں'
                      : 'Copy APK Download Link'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
