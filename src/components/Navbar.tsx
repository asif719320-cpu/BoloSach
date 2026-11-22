import React from 'react';
import { Flame, Home, Lock, Plus, User as UserIcon } from 'lucide-react';
import { Translations } from '../lib/i18n';
import { LangCode } from '../types/bolosach';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab = 'feed' | 'battles' | 'secrets' | 'studio';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenCreate: () => void;
  onSignIn: () => void;
  isSignedIn: boolean;
  lang: LangCode;
  onToggleLang: () => void;
  t: Translations;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreate,
  onSignIn,
  isSignedIn,
  lang,
  onToggleLang,
  t,
}) => {
  const navItems: { id: AppTab; label: string }[] = [
    { id: 'feed', label: t.navFeed },
    { id: 'battles', label: t.navBattles },
    { id: 'secrets', label: t.navSecrets },
    { id: 'studio', label: t.navStudio },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#F7F7F4]/90 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('feed')}
            className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-950 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
          >
            {t.brand}
          </button>

          {/* Zone 2: 4 clean single-line navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded ${
                    isActive
                      ? 'text-neutral-950 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-950'
                  } ${lang === 'ur' ? 'font-urdu' : ''}`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA on Desktop; compact controls on Mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton lang={lang} />

            <button
              type="button"
              onClick={onToggleLang}
              className="md:hidden min-h-[40px] px-3 text-xs font-semibold text-neutral-700 border border-neutral-300 rounded-lg hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'en' ? 'اردو' : 'EN'}
            </button>

            <button
              type="button"
              onClick={isSignedIn ? onOpenCreate : onSignIn}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              {isSignedIn ? (
                <>
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>{t.createCta}</span>
                </>
              ) : (
                <span>{t.signInCta}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Thumb-Zone Tab Bar (h-16 = 64px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-4 items-center h-16 px-1">
          <button
            type="button"
            onClick={() => onSelectTab('feed')}
            className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'feed' ? 'text-emerald-600 font-semibold' : 'text-neutral-500'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[76px]">{t.navFeed}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('battles')}
            className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'battles' ? 'text-emerald-600 font-semibold' : 'text-neutral-500'
            }`}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[76px]">{t.navBattles}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('secrets')}
            className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'secrets' ? 'text-emerald-600 font-semibold' : 'text-neutral-500'
            }`}
          >
            <Lock className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[76px]">{t.navSecrets}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('studio')}
            className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'studio' ? 'text-emerald-600 font-semibold' : 'text-neutral-500'
            }`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[76px]">{t.navStudio}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
