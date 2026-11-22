import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Activity,
  ArrowUpRight,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import {
  deleteChallengeById,
  deleteSecretResponse,
  subscribeAdminAllChallenges,
  subscribeAdminAllProfiles,
  subscribeAdminAllResponses,
  subscribeAdminAllVotes,
  updateChallengeMeta,
} from '../services/bolosachService';
import {
  Challenge,
  isOwnerAdmin,
  LangCode,
  PublicProfile,
  SecretResponse,
  VoteRecord,
} from '../types/bolosach';

interface OwnerControlCenterProps {
  currentUser: User | null;
  lang: LangCode;
  onOpenArena: (challengeId: string) => void;
}

type AdminView = 'votes' | 'challenges' | 'secrets' | 'creators';

function formatTimestamp(ts: { toDate?: () => Date } | null): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const OwnerControlCenter: React.FC<OwnerControlCenterProps> = ({
  currentUser,
  lang,
  onOpenArena,
}) => {
  const [view, setView] = useState<AdminView>('votes');
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([]);
  const [allResponses, setAllResponses] = useState<SecretResponse[]>([]);
  const [allProfiles, setAllProfiles] = useState<PublicProfile[]>([]);
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'active' | 'closed' | 'unlisted'>(
    'all'
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const authorized = isOwnerAdmin(currentUser);

  useEffect(() => {
    if (!authorized) return;

    const unsubC = subscribeAdminAllChallenges(setAllChallenges, (e) => setErrorMsg(e.message));
    const unsubV = subscribeAdminAllVotes(setAllVotes, (e) => setErrorMsg(e.message));
    const unsubR = subscribeAdminAllResponses(setAllResponses, (e) => setErrorMsg(e.message));
    const unsubP = subscribeAdminAllProfiles(setAllProfiles, (e) => setErrorMsg(e.message));

    return () => {
      unsubC();
      unsubV();
      unsubR();
      unsubP();
    };
  }, [authorized]);

  const challengeMap = useMemo(() => {
    const map = new Map<string, Challenge>();
    allChallenges.forEach((c) => map.set(c.id, c));
    return map;
  }, [allChallenges]);

  const filteredChallenges = useMemo(() => {
    if (challengeFilter === 'active') return allChallenges.filter((c) => c.status === 'active');
    if (challengeFilter === 'closed') return allChallenges.filter((c) => c.status === 'closed');
    if (challengeFilter === 'unlisted')
      return allChallenges.filter((c) => c.visibility === 'unlisted');
    return allChallenges;
  }, [allChallenges, challengeFilter]);

  if (!authorized) {
    return null;
  }

  const totalVotes = allChallenges.reduce((sum, c) => sum + c.votesA + c.votesB, 0);
  const totalTruths = allChallenges.reduce((sum, c) => sum + c.responseCount, 0);
  const activeCount = allChallenges.filter((c) => c.status === 'active').length;

  const labels =
    lang === 'ur'
      ? {
          heading: 'اونر لائیو کنٹرول سینٹر',
          sub: 'ایپ کی تمام ووٹنگ، خفیہ پیغامات اور چیلنجز کی لائیو نگرانی اور مکمل کنٹرول۔',
          kpiChallenges: 'کل چیلنجز',
          kpiActive: 'لائیو فعال',
          kpiVotes: 'کل ووٹس',
          kpiSecrets: 'خفیہ جوابات',
          kpiUsers: 'کری ایٹرز',
          tabVotes: 'لائیو ووٹنگ فیڈ',
          tabChallenges: 'تمام چیلنجز کنٹرول',
          tabSecrets: 'خفیہ پیغامات مانیٹر',
          tabCreators: 'یوزرز لسٹ',
          emptyVotes: 'ابھی تک کوئی لائیو ووٹ ریکارڈ نہیں ہوا۔',
          emptyChallenges: 'ابھی تک کوئی چیلنج موجود نہیں۔',
          emptySecrets: 'ابھی تک کوئی خفیہ پیغام موصول نہیں ہوا۔',
          emptyCreators: 'ابھی تک کوئی کری ایٹر رجسٹر نہیں ہوا۔',
        }
      : {
          heading: 'Owner Live Control Center',
          sub: 'Real-time visibility and moderation across all votes, challenges, and secret replies.',
          kpiChallenges: 'Total Challenges',
          kpiActive: 'Live Active',
          kpiVotes: 'Total Votes',
          kpiSecrets: 'Secret Truths',
          kpiUsers: 'Creators',
          tabVotes: 'Live Votes Stream',
          tabChallenges: 'All Challenges',
          tabSecrets: 'Secret Truths Monitor',
          tabCreators: 'Creators',
          emptyVotes: 'No live votes recorded yet.',
          emptyChallenges: 'No challenges created yet.',
          emptySecrets: 'No secret replies submitted yet.',
          emptyCreators: 'No creators registered yet.',
        };

  return (
    <section className="space-y-6" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>{currentUser?.email}</span>
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold">{labels.heading}</h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1">{labels.sub}</p>
        </div>
      </div>

      {errorMsg && (
        <p
          className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
          role="alert"
        >
          {errorMsg}
        </p>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <p className="text-xs text-neutral-500 mb-1">{labels.kpiChallenges}</p>
          <p className="text-2xl font-extrabold font-mono-nums text-neutral-950">
            {allChallenges.length}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <p className="text-xs text-neutral-500 mb-1">{labels.kpiActive}</p>
          <p className="text-2xl font-extrabold font-mono-nums text-emerald-700">{activeCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <p className="text-xs text-neutral-500 mb-1">{labels.kpiVotes}</p>
          <p className="text-2xl font-extrabold font-mono-nums text-neutral-950">{totalVotes}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <p className="text-xs text-neutral-500 mb-1">{labels.kpiSecrets}</p>
          <p className="text-2xl font-extrabold font-mono-nums text-orange-700">{totalTruths}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-neutral-500 mb-1">{labels.kpiUsers}</p>
          <p className="text-2xl font-extrabold font-mono-nums text-neutral-950">
            {allProfiles.length}
          </p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white border border-neutral-200 rounded-2xl p-2">
        <button
          type="button"
          onClick={() => setView('votes')}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            view === 'votes'
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{labels.tabVotes}</span>
        </button>

        <button
          type="button"
          onClick={() => setView('challenges')}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            view === 'challenges'
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{labels.tabChallenges}</span>
        </button>

        <button
          type="button"
          onClick={() => setView('secrets')}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            view === 'secrets'
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{labels.tabSecrets}</span>
        </button>

        <button
          type="button"
          onClick={() => setView('creators')}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            view === 'creators'
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{labels.tabCreators}</span>
        </button>
      </div>

      {/* View 1: Live Votes Stream */}
      {view === 'votes' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
          {allVotes.length === 0 ? (
            <p className="text-sm text-neutral-500">{labels.emptyVotes}</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {allVotes.map((v) => {
                const parent = challengeMap.get(v.challengeId);
                const sideText =
                  v.side === 'A'
                    ? parent?.sideALabel ?? 'Side A'
                    : parent?.sideBLabel ?? 'Side B';
                return (
                  <div
                    key={`${v.challengeId}-${v.id}`}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950 truncate">
                        {parent?.title ?? `Challenge ${v.challengeId}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span
                          className={`font-semibold ${
                            v.side === 'A' ? 'text-emerald-700' : 'text-orange-700'
                          }`}
                        >
                          Voted: {sideText}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{v.voterUid === 'guest' ? 'WhatsApp Guest' : 'Signed-in User'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-nums">{formatTimestamp(v.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenArena(v.challengeId)}
                      className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 cursor-pointer shrink-0"
                    >
                      <span>Open</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: All Challenges Control */}
      {view === 'challenges' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'active', 'closed', 'unlisted'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setChallengeFilter(f)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                  challengeFilter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredChallenges.length === 0 ? (
            <p className="text-sm text-neutral-500">{labels.emptyChallenges}</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredChallenges.map((c) => (
                <div
                  key={c.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 mb-1">
                      <span className="font-semibold text-neutral-800">@{c.creatorHandle}</span>
                      <span aria-hidden="true">·</span>
                      <span>{c.visibility}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          c.status === 'active'
                            ? 'text-emerald-700 font-semibold'
                            : 'text-neutral-500 font-semibold'
                        }
                      >
                        {c.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-nums">
                        {c.votesA + c.votesB} votes · {c.responseCount} truths
                      </span>
                    </div>
                    <p
                      onClick={() => onOpenArena(c.id)}
                      className="text-sm font-bold text-neutral-950 hover:text-emerald-700 cursor-pointer truncate"
                    >
                      {c.title}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void updateChallengeMeta(c.id, {
                          status: c.status === 'active' ? 'closed' : 'active',
                        })
                      }
                      className="min-h-[36px] px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-pointer"
                    >
                      {c.status === 'active' ? 'Close' : 'Reopen'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void updateChallengeMeta(c.id, {
                          visibility: c.visibility === 'public' ? 'unlisted' : 'public',
                        })
                      }
                      className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-pointer"
                    >
                      {c.visibility === 'public' ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>{c.visibility === 'public' ? 'Make Unlisted' : 'Make Public'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDeleteId === c.id) {
                          void deleteChallengeById(c.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(c.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{confirmDeleteId === c.id ? 'Confirm' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View 3: Secret Truths Monitor */}
      {view === 'secrets' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
          {allResponses.length === 0 ? (
            <p className="text-sm text-neutral-500">{labels.emptySecrets}</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {allResponses.map((r) => {
                const parent = challengeMap.get(r.challengeId);
                return (
                  <div
                    key={`${r.challengeId}-${r.id}`}
                    className="py-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500 mb-1">
                        {parent?.title ?? r.challengeId} · {r.moodTag} ·{' '}
                        <span className="font-mono-nums">{formatTimestamp(r.createdAt)}</span>
                      </p>
                      <p className="text-sm font-semibold text-neutral-950">“{r.message}”</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteSecretResponse(r.challengeId, r.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                      aria-label="Delete secret message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 4: Creators Directory */}
      {view === 'creators' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
          {allProfiles.length === 0 ? (
            <p className="text-sm text-neutral-500">{labels.emptyCreators}</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {allProfiles.map((p) => (
                <div key={p.uid} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-950 truncate">{p.displayName}</p>
                    <p className="text-xs text-neutral-500 font-mono-nums truncate">
                      @{p.handle} · {p.preferredLang.toUpperCase()}
                    </p>
                  </div>
                  <span className="font-mono-nums text-xs font-semibold text-neutral-700 shrink-0">
                    {p.totalChallenges} challenges
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
