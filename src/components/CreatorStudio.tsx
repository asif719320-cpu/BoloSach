import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Plus,
  Share2,
  Shield,
  Trash2,
} from 'lucide-react';
import { Translations } from '../lib/i18n';
import {
  getAppWhatsAppInviteHref,
  getFacebookShareHref,
  getWhatsAppShareHref,
} from '../lib/shareCardGenerator';
import {
  deleteChallengeById,
  deleteSecretResponse,
  subscribeChallengeResponses,
  subscribeMyChallenges,
  updateChallengeMeta,
  updateCreatorProfile,
  updateSecretResponseShowcase,
} from '../services/bolosachService';
import {
  Challenge,
  isOwnerAdmin,
  LangCode,
  LIMITS,
  PublicProfile,
  sanitizeHttpsUrl,
  SecretResponse,
} from '../types/bolosach';
import { OwnerControlCenter } from './OwnerControlCenter';
import { SupportFeedbackCard } from './SupportFeedbackCard';

interface CreatorStudioProps {
  currentUser: User | null;
  profile: PublicProfile | null;
  authReady?: boolean;
  lang: LangCode;
  t: Translations;
  onSignIn: () => void;
  onSignOut: () => void;
  onProfileUpdated: (next: Partial<PublicProfile>) => void;
  onOpenCreate: () => void;
  onOpenArena: (challengeId: string) => void;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  currentUser,
  profile,
  authReady = true,
  lang,
  t,
  onSignIn,
  onSignOut,
  onProfileUpdated,
  onOpenCreate,
  onOpenArena,
}) => {
  const isOwner = isOwnerAdmin(currentUser);
  const [studioMode, setStudioMode] = useState<'creator' | 'owner'>(() =>
    isOwner ? 'owner' : 'creator'
  );

  useEffect(() => {
    setStudioMode(isOwner ? 'owner' : 'creator');
  }, [isOwner]);

  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [inboxResponses, setInboxResponses] = useState<SecretResponse[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setHandle(profile.handle);
      setBio(profile.bio);
    }
  }, [profile]);

  useEffect(() => {
    if (!currentUser) {
      setMyChallenges([]);
      setSelectedChallengeId(null);
      return;
    }
    const unsub = subscribeMyChallenges(
      currentUser.uid,
      (rows) => {
        setMyChallenges(rows);
        setSelectedChallengeId((prev) => {
          if (prev && rows.some((r) => r.id === prev)) return prev;
          return rows[0]?.id ?? null;
        });
      },
      (err) => setErrorMsg(err.message)
    );
    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser || !selectedChallengeId) {
      setInboxResponses([]);
      return;
    }
    const selected = myChallenges.find((c) => c.id === selectedChallengeId);
    if (!selected) return;

    const unsub = subscribeChallengeResponses(
      selected.id,
      currentUser.uid,
      selected.creatorId,
      (items) => {
        setInboxResponses(items);
        setReplyDrafts((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            if (next[item.id] === undefined) {
              next[item.id] = item.creatorReply;
            }
          });
          return next;
        });
      },
      (err) => setErrorMsg(err.message)
    );
    return () => unsub();
  }, [currentUser?.uid, selectedChallengeId, myChallenges]);

  if (!authReady) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 animate-pulse space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-200 mx-auto" />
          <div className="h-6 w-56 bg-neutral-200 rounded mx-auto" />
          <div className="h-4 w-72 bg-neutral-100 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!currentUser || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-950 mb-2">{t.signInPromptTitle}</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">{t.signInPromptDesc}</p>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            <span>{t.continueGoogle}</span>
          </button>
        </div>

        <SupportFeedbackCard currentUser={currentUser} lang={lang} t={t} />
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavingProfile(true);
    try {
      await updateCreatorProfile(currentUser.uid, {
        displayName,
        handle,
        bio,
        preferredLang: lang,
        photoUrl: profile.photoUrl,
      });
      onProfileUpdated({ displayName, handle, bio });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const selectedChallenge = myChallenges.find((c) => c.id === selectedChallengeId) ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">{t.studioTitle}</h1>
          <p className="text-sm text-neutral-600">{t.studioSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isOwner && (
            <div className="flex items-center gap-1 bg-white border border-neutral-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStudioMode('owner')}
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  studioMode === 'owner'
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'لائیو کنٹرول' : 'Owner Control'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('creator')}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  studioMode === 'creator'
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span>{lang === 'ur' ? 'میری پروفائل' : 'My Inbox'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createCta}</span>
          </button>

          <a
            href={getAppWhatsAppInviteHref(lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareAppBtn}</span>
          </a>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.signOutCta}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5" role="alert">
          {errorMsg}
        </p>
      )}

      {isOwner && studioMode === 'owner' ? (
        <OwnerControlCenter
          currentUser={currentUser}
          lang={lang}
          onOpenArena={onOpenArena}
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile + My Challenges List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Settings Card */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              {sanitizeHttpsUrl(profile.photoUrl) ? (
                <img
                  src={sanitizeHttpsUrl(profile.photoUrl)}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-base font-bold text-neutral-950">{t.profileSettings}</h2>
                <p className="text-xs text-neutral-500 font-mono-nums">
                  @{profile.handle} · {myChallenges.length} challenges
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="studio-name" className="block text-xs font-semibold text-neutral-700 mb-1">
                {t.displayNameLabel}
              </label>
              <input
                id="studio-name"
                type="text"
                maxLength={LIMITS.DISPLAY_NAME_MAX}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="studio-handle" className="block text-xs font-semibold text-neutral-700 mb-1">
                {t.handleLabel}
              </label>
              <input
                id="studio-handle"
                type="text"
                maxLength={LIMITS.HANDLE_MAX}
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full min-h-[42px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-mono-nums text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="studio-bio" className="block text-xs font-semibold text-neutral-700 mb-1">
                {t.bioLabel}
              </label>
              <input
                id="studio-bio"
                type="text"
                maxLength={LIMITS.BIO_MAX}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full min-h-[44px] rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {profileSaved && <Check className="w-4 h-4 text-emerald-400" />}
              <span>{profileSaved ? t.profileSaved : t.saveProfile}</span>
            </button>
          </form>

          {/* My Challenges Selector */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-bold text-neutral-950 mb-4">{t.myChallengesTitle}</h2>
            {myChallenges.length === 0 ? (
              <p className="text-sm text-neutral-500">{t.noChallengesTitle}</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {myChallenges.map((item) => {
                  const isSelected = item.id === selectedChallengeId;
                  const totalVotes = item.votesA + item.votesB;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedChallengeId(item.id)}
                      className={`py-3.5 px-3 -mx-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/70' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 mb-1">
                        <span>
                          {t.typeLabels[item.type]} · {item.status === 'closed' ? t.closedBadge : t.activeBadge}
                        </span>
                        <span className="font-mono-nums">
                          {item.type === 'secret_poll'
                            ? `${item.responseCount} ${t.truthsLabel}`
                            : `${totalVotes} ${t.votesLabel}`}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-950 line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Challenge Controls & Secret Truths Inbox */}
        <div className="lg:col-span-7 space-y-6">
          {selectedChallenge ? (
            <>
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">
                      {t.typeLabels[selectedChallenge.type]} · {t.categoryLabels[selectedChallenge.category]}
                    </p>
                    <h2
                      onClick={() => onOpenArena(selectedChallenge.id)}
                      className="text-xl font-bold text-neutral-950 hover:text-emerald-700 cursor-pointer"
                    >
                      {selectedChallenge.title}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={getWhatsAppShareHref(selectedChallenge, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.shareWhatsApp}</span>
                  </a>

                  <a
                    href={getFacebookShareHref(selectedChallenge.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.4v8h3.1z" />
                    </svg>
                    <span>{t.shareFacebook}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      void updateChallengeMeta(selectedChallenge.id, {
                        status: selectedChallenge.status === 'active' ? 'closed' : 'active',
                      })
                    }
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-pointer"
                  >
                    {selectedChallenge.status === 'active' ? t.closeChallenge : t.reopenChallenge}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDeleteId === selectedChallenge.id) {
                        void deleteChallengeById(selectedChallenge.id);
                        setConfirmDeleteId(null);
                      } else {
                        setConfirmDeleteId(selectedChallenge.id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {confirmDeleteId === selectedChallenge.id ? t.confirmDelete : t.deleteChallenge}
                    </span>
                  </button>
                </div>
              </div>

              {/* Secret Truths Inbox */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-base font-bold text-neutral-950 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>{t.secretInboxTitle}</span>
                  </h3>
                  <span className="font-mono-nums text-xs text-neutral-500">
                    {inboxResponses.length} {t.truthsLabel}
                  </span>
                </div>

                {inboxResponses.length === 0 ? (
                  <p className="text-sm text-neutral-500">{t.noSecretsInbox}</p>
                ) : (
                  <div className="space-y-4">
                    {inboxResponses.map((resp) => (
                      <div
                        key={resp.id}
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                          <span>{t.moodLabels[resp.moodTag]} · Anonymous</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void updateSecretResponseShowcase(
                                  selectedChallenge.id,
                                  resp.id,
                                  !resp.isShowcased,
                                  replyDrafts[resp.id] ?? resp.creatorReply
                                )
                              }
                              className={`inline-flex items-center gap-1 min-h-[34px] px-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                resp.isShowcased
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-white border border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {resp.isShowcased ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                              <span>{resp.isShowcased ? t.hideFromCard : t.showcaseToggle}</span>
                            </button>

                            <button
                              type="button"
                              aria-label={t.deleteChallenge}
                              onClick={() => void deleteSecretResponse(selectedChallenge.id, resp.id)}
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-neutral-950">“{resp.message}”</p>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={LIMITS.REPLY_MAX}
                            value={replyDrafts[resp.id] ?? ''}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [resp.id]: e.target.value }))
                            }
                            placeholder={t.replyPlaceholder}
                            className="flex-1 min-h-[40px] rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void updateSecretResponseShowcase(
                                selectedChallenge.id,
                                resp.id,
                                true,
                                replyDrafts[resp.id] ?? ''
                              )
                            }
                            className="min-h-[40px] px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            {t.saveReply}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-neutral-500 mb-4">{t.noChallengesTitle}</p>
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.launchFirstBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
