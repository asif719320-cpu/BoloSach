import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Lock,
  Send,
  Share2,
  Sparkles,
} from 'lucide-react';
import { CATEGORY_ARTWORK } from '../lib/categoryArt';
import { Translations } from '../lib/i18n';
import {
  APK_DOWNLOAD_URL,
  buildChallengeShareUrl,
  downloadShareCardImage,
  getFacebookShareHref,
  getWhatsAppShareHref,
} from '../lib/shareCardGenerator';
import {
  castVote,
  checkRemoteVote,
  subscribeChallengeById,
  subscribeChallengeResponses,
  submitSecretResponse,
} from '../services/bolosachService';
import {
  Challenge,
  LangCode,
  LIMITS,
  sanitizeHttpsUrl,
  sanitizeSideImage,
  SecretMoodTag,
  SecretResponse,
} from '../types/bolosach';
import { PhotoDuelVote } from './PhotoDuelVote';

interface ChallengeArenaProps {
  challengeId: string;
  currentUser: User | null;
  lang: LangCode;
  t: Translations;
  onBack: () => void;
  onOpenCreateOrSignIn: () => void;
}

const MOODS: SecretMoodTag[] = ['honest', 'funny', 'spicy', 'kind'];

export const ChallengeArena: React.FC<ChallengeArenaProps> = ({
  challengeId,
  currentUser,
  lang,
  t,
  onBack,
  onOpenCreateOrSignIn,
}) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [votedSide, setVotedSide] = useState<'A' | 'B' | null>(null);
  const [voting, setVoting] = useState(false);

  const [secretText, setSecretText] = useState('');
  const [moodTag, setMoodTag] = useState<SecretMoodTag>('honest');
  const [sendingSecret, setSendingSecret] = useState(false);
  const [secretSent, setSecretSent] = useState(false);

  const [showcasedResponses, setShowcasedResponses] = useState<SecretResponse[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bannerFailed, setBannerFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErrorMsg('');
    setBannerFailed(false);
    const unsub = subscribeChallengeById(
      challengeId,
      (data) => {
        setChallenge(data);
        setLoading(false);
      },
      (err) => {
        setErrorMsg(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [challengeId]);

  useEffect(() => {
    if (!challenge) return;
    const prevTitle = document.title;
    document.title =
      challenge.type === 'secret_poll'
        ? `${challenge.title} | BoloSach`
        : `${challenge.title} — ${challenge.sideALabel} vs ${challenge.sideBLabel} | BoloSach`;

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonicalEl?.getAttribute('href') || 'https://bolosach.vercel.app/';
    const robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const prevRobots = robotsEl?.getAttribute('content') || 'index, follow, max-image-preview:large, max-snippet:-1';

    const shouldIndex = challenge.visibility === 'public' && challenge.type !== 'secret_poll';
    if (canonicalEl) {
      canonicalEl.setAttribute('href', `${window.location.origin}/c/${encodeURIComponent(challenge.id)}`);
    }
    if (robotsEl) {
      robotsEl.setAttribute(
        'content',
        shouldIndex ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow'
      );
    }

    return () => {
      document.title = prevTitle;
      if (canonicalEl) canonicalEl.setAttribute('href', prevCanonical);
      if (robotsEl) robotsEl.setAttribute('content', prevRobots);
    };
  }, [
    challenge?.id,
    challenge?.title,
    challenge?.sideALabel,
    challenge?.sideBLabel,
    challenge?.type,
    challenge?.visibility,
  ]);

  useEffect(() => {
    let active = true;
    void checkRemoteVote(challengeId, currentUser)
      .then((side) => {
        if (active) setVotedSide(side);
      })
      .catch(() => {
        // Non-blocking remote check
      });
    return () => {
      active = false;
    };
  }, [challengeId, currentUser]);

  useEffect(() => {
    if (!challenge) return;
    const unsub = subscribeChallengeResponses(
      challenge.id,
      currentUser?.uid ?? null,
      challenge.creatorId,
      (items) => {
        setShowcasedResponses(items.filter((item) => item.isShowcased));
      },
      () => {
        // Ignore error if non-owner
      }
    );
    return () => unsub();
  }, [challenge?.id, challenge?.creatorId, currentUser?.uid]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 animate-pulse space-y-4">
          <div className="h-44 w-full bg-neutral-200 rounded-2xl" />
          <div className="h-4 w-32 bg-neutral-200 rounded" />
          <div className="h-7 w-3/4 bg-neutral-200 rounded" />
          <div className="h-12 w-full bg-neutral-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{t.notFoundTitle}</h2>
          <p className="text-sm text-neutral-600 mb-6">{t.notFoundDesc}</p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToFeed}</span>
          </button>
        </div>
      </div>
    );
  }

  const totalVotes = challenge.votesA + challenge.votesB;
  const pctA = totalVotes > 0 ? Math.round((challenge.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;
  const isClosed = challenge.status === 'closed';
  const showViralCta = Boolean(votedSide || secretSent);
  const safeAvatar = sanitizeHttpsUrl(challenge.creatorPhotoUrl);
  const hasSidePhotos = Boolean(
    sanitizeSideImage(challenge.sideAImageUrl) || sanitizeSideImage(challenge.sideBImageUrl)
  );
  const artwork = CATEGORY_ARTWORK[challenge.category] ?? CATEGORY_ARTWORK.general;

  const handleVote = async (side: 'A' | 'B') => {
    if (isClosed || voting || votedSide) return;
    setErrorMsg('');
    setVoting(true);
    try {
      const res = await castVote(challenge.id, side, currentUser);
      setVotedSide(res.side);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to record vote.');
    } finally {
      setVoting(false);
    }
  };

  const handleSendSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed || sendingSecret) return;
    const trimmed = secretText.trim();
    if (trimmed.length < LIMITS.SECRET_MIN) {
      setErrorMsg('Please write at least 2 characters.');
      return;
    }
    setErrorMsg('');
    setSendingSecret(true);
    try {
      await submitSecretResponse(challenge.id, challenge.creatorId, trimmed, moodTag);
      setSecretText('');
      setSecretSent(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to deliver secret truth.');
    } finally {
      setSendingSecret(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildChallengeShareUrl(challenge.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMsg('Unable to copy link.');
    }
  };

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 min-h-[40px] text-sm font-medium text-neutral-600 hover:text-neutral-950 mb-5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backToFeed}</span>
      </button>

      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm mb-6">
        {/* Full-HD 16:9 Category Arena Header */}
        <div className={`relative h-48 sm:h-56 w-full bg-gradient-to-br ${artwork.gradientClass}`}>
          {!bannerFailed && (
            <img
              src={artwork.imageUrl}
              alt={artwork.alt}
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4 text-white">
            <div className="flex items-center gap-3 min-w-0">
              {safeAvatar ? (
                <img
                  src={safeAvatar}
                  alt={challenge.creatorName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center border-2 border-white shrink-0">
                  {challenge.creatorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-bold truncate">{challenge.creatorName}</p>
                <div className="flex items-center gap-1.5 text-xs text-neutral-200">
                  <span>@{challenge.creatorHandle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.typeLabels[challenge.type]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.categoryLabels[challenge.category]}</span>
                </div>
              </div>
            </div>

            <span
              className={`text-xs font-bold shrink-0 ${
                isClosed ? 'text-neutral-300' : 'text-emerald-300'
              }`}
            >
              {isClosed ? t.closedBadge : t.activeBadge}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold text-neutral-950 leading-tight mb-6 ${
              challenge.lang === 'ur' || lang === 'ur' ? 'font-urdu' : ''
            }`}
          >
            {challenge.title}
          </h1>

          {challenge.type !== 'secret_poll' ? (
            hasSidePhotos ? (
              <PhotoDuelVote
                challenge={challenge}
                votedSide={votedSide}
                votingSide={voting ? 'A' : null}
                isClosed={isClosed}
                lang={lang}
                t={t}
                onVote={(side) => void handleVote(side)}
              />
            ) : (
            <div className="space-y-3 mb-6">
              <button
                type="button"
                disabled={isClosed || Boolean(votedSide) || voting}
                onClick={() => handleVote('A')}
                className={`relative w-full min-h-[58px] px-5 py-4 rounded-2xl border text-left overflow-hidden transition-all active:scale-[0.99] cursor-pointer disabled:cursor-default ${
                  votedSide === 'A'
                    ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/40'
                    : 'border-neutral-200 hover:border-emerald-600 bg-neutral-50/60'
                }`}
              >
                {(votedSide || isClosed) && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: `${pctA}%`, transformOrigin: 'left center' }}
                    className="absolute inset-y-0 left-0 bg-emerald-100/85"
                  />
                )}
                <div className="relative flex items-center justify-between gap-4">
                  <span className="text-base font-bold text-neutral-950 flex items-center gap-2">
                    {votedSide === 'A' && <Check className="w-5 h-5 text-emerald-700 shrink-0" />}
                    <span>{challenge.sideALabel}</span>
                  </span>
                  {(votedSide || isClosed) && (
                    <span className="font-mono-nums text-sm font-bold text-emerald-800 shrink-0">
                      {pctA}% ({challenge.votesA})
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center justify-center">
                <span className="text-[11px] font-extrabold tracking-widest text-neutral-400">
                  VS
                </span>
              </div>

              <button
                type="button"
                disabled={isClosed || Boolean(votedSide) || voting}
                onClick={() => handleVote('B')}
                className={`relative w-full min-h-[58px] px-5 py-4 rounded-2xl border text-left overflow-hidden transition-all active:scale-[0.99] cursor-pointer disabled:cursor-default ${
                  votedSide === 'B'
                    ? 'border-orange-600 ring-2 ring-orange-600/20 bg-orange-50/40'
                    : 'border-neutral-200 hover:border-orange-600 bg-neutral-50/60'
                }`}
              >
                {(votedSide || isClosed) && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: `${pctB}%`, transformOrigin: 'left center' }}
                    className="absolute inset-y-0 left-0 bg-orange-100/85"
                  />
                )}
                <div className="relative flex items-center justify-between gap-4">
                  <span className="text-base font-bold text-neutral-950 flex items-center gap-2">
                    {votedSide === 'B' && <Check className="w-5 h-5 text-orange-700 shrink-0" />}
                    <span>{challenge.sideBLabel}</span>
                  </span>
                  {(votedSide || isClosed) && (
                    <span className="font-mono-nums text-sm font-bold text-orange-800 shrink-0">
                      {pctB}% ({challenge.votesB})
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                <span className="font-mono-nums">
                  {totalVotes} {t.votesLabel}
                </span>
                <span>{votedSide ? t.voteRecorded : t.oneClickHint}</span>
              </div>
            </div>
            )
          ) : null}

          {/* Secret Poll Submission Box */}
          {(challenge.type === 'secret_poll' || challenge.type === 'friend_poll') && !isClosed && (
            <form onSubmit={handleSendSecret} className="pt-4 border-t border-neutral-100 mb-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <label
                  htmlFor="secret-truth-input"
                  className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>{t.sendSecretBtn}</span>
                </label>
                <span className="font-mono-nums text-xs text-neutral-400">
                  {secretText.length}/{LIMITS.SECRET_MAX}
                </span>
              </div>

              <textarea
                id="secret-truth-input"
                rows={3}
                maxLength={LIMITS.SECRET_MAX}
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder={t.sendSecretPlaceholder}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white mb-3"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoodTag(m)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        moodTag === m
                          ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      {t.moodLabels[m]}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={sendingSecret || secretText.trim().length < LIMITS.SECRET_MIN}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 disabled:opacity-45 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.sendSecretBtn}</span>
                </button>
              </div>
            </form>
          )}

          {secretSent && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{t.secretRecorded}</span>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 mb-4" role="alert">
              {errorMsg}
            </p>
          )}

          {/* Share Toolbar */}
          <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2.5">
            <a
              href={getWhatsAppShareHref(challenge, lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareWhatsApp}</span>
            </a>

            <a
              href={getFacebookShareHref(challenge.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.4v8h3.1z" />
              </svg>
              <span>{t.shareFacebook}</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-sm font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copied ? t.copied : t.copyLink}</span>
            </button>

            <button
              type="button"
              onClick={() => void downloadShareCardImage(challenge)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-sm font-medium transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadCard}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Viral Loop Conversion Card */}
      {showViralCta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BoloSach</span>
            </p>
            <h2 className="text-xl font-bold mb-1">{t.viralPromptTitle}</h2>
            <p className="text-sm text-neutral-300 max-w-lg">{t.viralPromptDesc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenCreateOrSignIn}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {t.createMyOwnBtn}
            </button>
            <a
              href={APK_DOWNLOAD_URL}
              download="BoloSach.apk"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ur' ? 'ایپ ڈاؤن لوڈ (APK)' : 'Download APK'}</span>
            </a>
          </div>
        </motion.div>
      )}

      {/* Showcased Public Replies */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-neutral-950 mb-4">{t.showcasedTruths}</h2>
        {showcasedResponses.length === 0 ? (
          <p className="text-sm text-neutral-500">{t.noShowcasedYet}</p>
        ) : (
          <div className="space-y-4">
            {showcasedResponses.map((resp) => (
              <div
                key={resp.id}
                className="pb-4 border-b border-neutral-100 last:border-b-0 last:pb-0"
              >
                <p className="text-xs text-neutral-500 mb-1">
                  {t.moodLabels[resp.moodTag]} · Anonymous
                </p>
                <p className="text-sm font-medium text-neutral-900 mb-2">“{resp.message}”</p>
                {resp.creatorReply && (
                  <p className="text-sm text-emerald-800 bg-emerald-50/70 rounded-xl px-3.5 py-2.5">
                    <span className="font-semibold">@{challenge.creatorHandle}: </span>
                    {resp.creatorReply}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
