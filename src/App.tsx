import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Flame, Globe, Lock, Plus, Shield, Sparkles } from 'lucide-react';
import { BattleCard } from './components/BattleCard';
import { ChallengeArena } from './components/ChallengeArena';
import { CreateChallengeModal } from './components/CreateChallengeModal';
import { CreatorStudio } from './components/CreatorStudio';
import { AppTab, Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CATEGORY_ARTWORK } from './lib/categoryArt';
import { auth, googleProvider } from './lib/firebase';
import { COPY, STARTER_TEMPLATES } from './lib/i18n';
import {
  ensureUserDocuments,
  subscribePublicChallenges,
} from './services/bolosachService';
import {
  Challenge,
  ChallengeCategory,
  ChallengeType,
  isOwnerAdmin,
  isValidFirestoreId,
  LangCode,
  PublicProfile,
  sanitizeHttpsUrl,
} from './types/bolosach';

import HERO_IMG from './assets/images/bolosach_hero_arena_1795351767909.jpg';
import AVATAR_A from './assets/images/avatar_cricket_fan_1795351767748.jpg';
import AVATAR_B from './assets/images/avatar_chai_poet_1795351767156.jpg';

const CATEGORIES: ('all' | ChallengeCategory)[] = [
  'all',
  'cricket',
  'friendship',
  'roast',
  'poetry',
  'debate',
  'general',
];

const FEATURED_ARENAS: { category: ChallengeCategory; titleEn: string; titleUr: string }[] = [
  { category: 'cricket', titleEn: 'Cricket & Match Debates', titleUr: 'کرکٹ اور میچ کے مقابلے' },
  { category: 'poetry', titleEn: 'Chai & Shayari Polls', titleUr: 'چائے اور شاعری پولز' },
  { category: 'debate', titleEn: '1v1 Squad Showdowns', titleUr: 'دوستوں کے 1v1 چیلنجز' },
];

function getInitialChallengeIdFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('c')?.trim();
    return isValidFirestoreId(id) ? id : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [lang, setLang] = useState<LangCode>(() => {
    try {
      return localStorage.getItem('bolosach_lang') === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  });
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [arenaChallengeId, setArenaChallengeId] = useState<string | null>(() =>
    getInitialChallengeIdFromUrl()
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ChallengeCategory>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'trending'>('newest');

  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<ChallengeType>('battle');
  const [pendingCreateAfterAuth, setPendingCreateAfterAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  const t = COPY[lang];

  useEffect(() => {
    try {
      localStorage.setItem('bolosach_lang', lang);
    } catch {
      // Ignore storage error
    }
  }, [lang]);

  useEffect(() => {
    const onPopState = () => {
      setArenaChallengeId(getInitialChallengeIdFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const prof = await ensureUserDocuments(user, lang);
          setProfile(prof);
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : 'Unable to initialize profile.');
        }
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    setFeedLoading(true);
    const unsubFeed = subscribePublicChallenges(
      (rows) => {
        setPublicChallenges(rows);
        setFeedLoading(false);
      },
      (err) => {
        setAuthError(err.message);
        setFeedLoading(false);
      }
    );
    return () => unsubFeed();
  }, []);

  useEffect(() => {
    if (pendingCreateAfterAuth && currentUser && profile) {
      setPendingCreateAfterAuth(false);
      setCreateOpen(true);
    }
  }, [pendingCreateAfterAuth, currentUser, profile]);

  const navigateToArena = (challengeId: string | null) => {
    if (challengeId && !isValidFirestoreId(challengeId)) {
      return;
    }
    setArenaChallengeId(challengeId);
    const url = new URL(window.location.href);
    if (challengeId) {
      url.searchParams.set('c', challengeId);
    } else {
      url.searchParams.delete('c');
    }
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const openCreateFlow = (mode: ChallengeType = 'battle') => {
    setCreateInitialType(mode);
    if (currentUser && profile) {
      setCreateOpen(true);
    } else {
      setPendingCreateAfterAuth(true);
      void handleSignIn();
    }
  };

  const filteredChallenges = useMemo(() => {
    let list = publicChallenges;

    if (activeTab === 'battles') {
      list = list.filter((c) => c.type === 'battle' || c.type === 'friend_poll');
    } else if (activeTab === 'secrets') {
      list = list.filter((c) => c.type === 'secret_poll');
    }

    if (categoryFilter !== 'all') {
      list = list.filter((c) => c.category === categoryFilter);
    }

    if (sortBy === 'trending') {
      return [...list].sort(
        (a, b) =>
          b.votesA + b.votesB + b.responseCount - (a.votesA + a.votesB + a.responseCount)
      );
    }
    return list;
  }, [publicChallenges, activeTab, categoryFilter, sortBy]);

  const handleSelectTab = (tab: AppTab) => {
    if (arenaChallengeId) {
      navigateToArena(null);
    }
    setActiveTab(tab);
  };

  const safeProfilePhoto = sanitizeHttpsUrl(profile?.photoUrl);

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#111315] pb-24 md:pb-12">
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCreate={() => openCreateFlow('battle')}
        onSignIn={() => void handleSignIn()}
        isSignedIn={Boolean(currentUser && profile)}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
        t={t}
      />

      {authError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError('')}
              className="font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {arenaChallengeId ? (
        <ChallengeArena
          challengeId={arenaChallengeId}
          currentUser={currentUser}
          lang={lang}
          t={t}
          onBack={() => navigateToArena(null)}
          onOpenCreateOrSignIn={() => openCreateFlow('battle')}
        />
      ) : activeTab === 'studio' ? (
        <CreatorStudio
          currentUser={currentUser}
          profile={profile}
          lang={lang}
          t={t}
          onSignIn={() => void handleSignIn()}
          onSignOut={() => void handleSignOut()}
          onProfileUpdated={(next) =>
            setProfile((prev) => (prev ? { ...prev, ...next } : prev))
          }
          onOpenCreate={() => openCreateFlow('battle')}
          onOpenArena={(id) => navigateToArena(id)}
        />
      ) : (
        <main
          className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-10"
          dir={lang === 'ur' ? 'rtl' : 'ltr'}
        >
          {/* Hero Showcase on main Feed */}
          {activeTab === 'feed' && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-xs">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-3">
                      {t.oneClickHint}
                    </p>
                    <h1
                      className={`text-3xl sm:text-5xl font-extrabold text-neutral-950 tracking-tight leading-[1.1] mb-4 max-w-2xl [text-wrap:balance] ${
                        lang === 'ur' ? 'font-urdu leading-[1.45]' : ''
                      }`}
                    >
                      {t.heroTitle}
                    </h1>
                    <p
                      className={`text-base text-neutral-600 max-w-xl leading-relaxed mb-7 ${
                        lang === 'ur' ? 'font-urdu' : ''
                      }`}
                    >
                      {t.heroSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openCreateFlow('battle')}
                      className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>{t.heroPrimaryBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openCreateFlow('secret_poll')}
                      className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-900 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{t.heroSecondaryBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Full-HD Studio Showcase Card */}
                <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-neutral-200 bg-gradient-to-br from-emerald-950 via-neutral-900 to-emerald-900 min-h-[280px] flex flex-col justify-end shadow-xs">
                  <img
                    src={HERO_IMG}
                    alt="BoloSach 1v1 challenge studio"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  <div className="relative p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex -space-x-2">
                        <img
                          src={AVATAR_A}
                          alt="Challenger portrait"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white"
                        />
                        <img
                          src={AVATAR_B}
                          alt="Creator portrait"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-200">
                        Full-HD Status Cards
                      </span>
                    </div>
                    <p className="text-lg font-bold leading-snug">
                      {lang === 'ur'
                        ? 'فل ایچ ڈی اسٹیٹس کارڈ ڈاؤن لوڈ کریں یا 1 کلک میں واٹس ایپ پر شیئر کریں۔'
                        : 'Export Full-HD scorecards or drop a 1-tap voting link in any WhatsApp group.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3-Card Full-HD Topic Visual Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FEATURED_ARENAS.map((arena) => {
                  const art = CATEGORY_ARTWORK[arena.category];
                  return (
                    <button
                      key={arena.category}
                      type="button"
                      onClick={() => setCategoryFilter(arena.category)}
                      className={`group relative h-36 rounded-2xl overflow-hidden border border-neutral-200 text-left bg-gradient-to-br ${art.gradientClass} cursor-pointer`}
                    >
                      <img
                        src={art.imageUrl}
                        alt={art.alt}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                      <div className="relative h-full p-5 flex flex-col justify-end text-white">
                        <p className="text-xs text-emerald-300 font-semibold mb-0.5">
                          {t.categoryLabels[arena.category]}
                        </p>
                        <p className="text-base font-bold leading-snug">
                          {lang === 'ur' ? arena.titleUr : arena.titleEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Main 2-Column Interactive Feed & Workspace Rail */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-5">
              {/* Interactive Filter Toolbar */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                  {CATEGORIES.map((cat) => {
                    const active = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-neutral-950 text-white font-semibold'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                        }`}
                      >
                        {cat === 'all' ? t.allCategories : t.categoryLabels[cat]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      sortBy === 'newest'
                        ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                        : 'text-neutral-600 hover:text-neutral-950'
                    }`}
                  >
                    {t.sortNewest}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('trending')}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      sortBy === 'trending'
                        ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                        : 'text-neutral-600 hover:text-neutral-950'
                    }`}
                  >
                    {t.sortTrending}
                  </button>
                </div>
              </div>

              {/* Challenges Feed */}
              {feedLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((skeleton) => (
                    <div
                      key={skeleton}
                      className="bg-white border border-neutral-200 rounded-2xl p-6 animate-pulse space-y-3"
                    >
                      <div className="h-24 w-full bg-neutral-200 rounded-xl" />
                      <div className="h-4 w-40 bg-neutral-200 rounded" />
                      <div className="h-6 w-3/4 bg-neutral-200 rounded" />
                      <div className="h-12 w-full bg-neutral-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : filteredChallenges.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-10 text-center">
                  <h2 className="text-lg font-bold text-neutral-950 mb-2">
                    {t.noChallengesTitle}
                  </h2>
                  <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">
                    {t.noChallengesDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreateFlow(activeTab === 'secrets' ? 'secret_poll' : 'battle')}
                    className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.launchFirstBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredChallenges.map((challenge) => (
                    <BattleCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUser={currentUser}
                      lang={lang}
                      t={t}
                      onOpenArena={(id) => navigateToArena(id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Rail */}
            <aside className="lg:col-span-4 space-y-5">
              {/* Bilingual Language Toggle */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-neutral-950">
                    {lang === 'en' ? 'Language / زبان' : 'زبان / Language'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      lang === 'en' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('ur')}
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      lang === 'ur' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    اردو
                  </button>
                </div>
              </div>

              {/* Account / Creator Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                {authReady && currentUser && profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {safeProfilePhoto ? (
                        <img
                          src={safeProfilePhoto}
                          alt={profile.displayName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover border border-neutral-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
                          {profile.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-950 truncate">
                          {profile.displayName}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono-nums truncate">
                          @{profile.handle}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openCreateFlow('battle')}
                        className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {t.createCta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('studio')}
                        className="min-h-[40px] px-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold cursor-pointer"
                      >
                        {t.navStudio}
                      </button>
                    </div>

                    {isOwnerAdmin(currentUser) && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('studio')}
                        className="w-full min-h-[42px] px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {lang === 'ur' ? 'اونر لائیو کنٹرول کھولیں' : 'Open Owner Live Control'}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-neutral-950">{t.signInPromptTitle}</h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {t.signInPromptDesc}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSignIn()}
                      className="w-full min-h-[44px] rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {t.continueGoogle}
                    </button>
                  </div>
                )}
              </div>

              {/* Starter Prompts Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{t.quickTemplates}</span>
                </h3>
                <div className="divide-y divide-neutral-100">
                  {STARTER_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.titleEn}
                      type="button"
                      onClick={() => openCreateFlow(tpl.type)}
                      className="w-full py-3 text-left hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <p className="text-[11px] text-neutral-500 mb-0.5">
                        {t.typeLabels[tpl.type]} · {t.categoryLabels[tpl.category]}
                      </p>
                      <p className="text-xs font-semibold text-neutral-900 leading-snug">
                        {lang === 'ur' ? tpl.titleUr : tpl.titleEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </main>
      )}

      {currentUser && profile && (
        <CreateChallengeModal
          isOpen={createOpen}
          initialType={createInitialType}
          currentUser={currentUser}
          profile={profile}
          lang={lang}
          t={t}
          onClose={() => setCreateOpen(false)}
          onCreated={(newId) => {
            setCreateOpen(false);
            navigateToArena(newId);
          }}
        />
      )}

      <OfflineIndicator lang={lang} />
    </div>
  );
}
