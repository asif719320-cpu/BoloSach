import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Lock,
  MessageSquarePlus,
  Share2,
} from 'lucide-react';
import { CATEGORY_ARTWORK } from '../lib/categoryArt';
import { Translations } from '../lib/i18n';
import {
  buildChallengeShareUrl,
  downloadShareCardImage,
  getWhatsAppShareHref,
} from '../lib/shareCardGenerator';
import { castVote, getLocalVote } from '../services/bolosachService';
import { Challenge, LangCode, sanitizeHttpsUrl, sanitizeSideImage } from '../types/bolosach';
import { PhotoDuelVote } from './PhotoDuelVote';

interface BattleCardProps {
  challenge: Challenge;
  currentUser: User | null;
  lang: LangCode;
  t: Translations;
  onOpenArena: (challengeId: string) => void;
  onVotedAction?: () => void;
}

function formatRelativeTime(challenge: Challenge): string {
  if (!challenge.createdAt || typeof challenge.createdAt.toMillis !== 'function') {
    return 'Just now';
  }
  const diffSec = Math.max(0, Math.floor((Date.now() - challenge.createdAt.toMillis()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

export const BattleCard: React.FC<BattleCardProps> = ({
  challenge,
  currentUser,
  lang,
  t,
  onOpenArena,
  onVotedAction,
}) => {
  const [votedSide, setVotedSide] = useState<'A' | 'B' | null>(() => getLocalVote(challenge.id));
  const [votingSide, setVotingSide] = useState<'A' | 'B' | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setVotedSide(getLocalVote(challenge.id));
  }, [challenge.id]);

  const totalVotes = challenge.votesA + challenge.votesB;
  const pctA = totalVotes > 0 ? Math.round((challenge.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;
  const isClosed = challenge.status === 'closed';
  const isUrduText = challenge.lang === 'ur' || lang === 'ur';
  const safeAvatar = sanitizeHttpsUrl(challenge.creatorPhotoUrl);
  const hasSidePhotos = Boolean(
    sanitizeSideImage(challenge.sideAImageUrl) || sanitizeSideImage(challenge.sideBImageUrl)
  );
  const artwork = CATEGORY_ARTWORK[challenge.category] ?? CATEGORY_ARTWORK.general;

  const handleVote = async (side: 'A' | 'B') => {
    if (isClosed || votingSide || votedSide) return;
    setErrorMsg('');
    setVotingSide(side);
    try {
      const res = await castVote(challenge.id, side, currentUser);
      setVotedSide(res.side);
      if (onVotedAction) onVotedAction();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to record vote.');
    } finally {
      setVotingSide(null);
    }
  };

  const handleCopy = async () => {
    const url = buildChallengeShareUrl(challenge.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMsg('Copy failed. Please copy from address bar.');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      {/* Crisp Full-HD Visual Header Strip */}
      <div
        onClick={() => onOpenArena(challenge.id)}
        className={`relative h-28 w-full overflow-hidden cursor-pointer bg-gradient-to-r ${artwork.gradientClass}`}
      >
        {!imgFailed && (
          <img
            src={artwork.imageUrl}
            alt={artwork.alt}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-100 truncate">
            <span>{t.typeLabels[challenge.type]}</span>
            <span aria-hidden="true">·</span>
            <span>{t.categoryLabels[challenge.category]}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-nums">{formatRelativeTime(challenge)}</span>
          </div>
          <span
            className={`text-xs font-semibold shrink-0 ${
              isClosed ? 'text-neutral-300' : 'text-emerald-300'
            }`}
          >
            {isClosed ? t.closedBadge : t.activeBadge}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Creator Strip */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {safeAvatar ? (
              <img
                src={safeAvatar}
                alt={challenge.creatorName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                {challenge.creatorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {challenge.creatorName}
              </p>
              <p className="text-xs text-neutral-500 font-mono-nums truncate">
                @{challenge.creatorHandle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenArena(challenge.id)}
            aria-label={t.openArena}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Challenge Question */}
        <h3
          onClick={() => onOpenArena(challenge.id)}
          className={`text-lg sm:text-xl font-bold text-neutral-950 leading-snug mb-4 cursor-pointer hover:text-emerald-700 transition-colors ${
            isUrduText ? 'font-urdu' : ''
          }`}
        >
          {challenge.title}
        </h3>

        {/* Interactive Voting or Secret Prompt */}
        {challenge.type === 'secret_poll' ? (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => onOpenArena(challenge.id)}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.sendSecretBtn}</span>
              </span>
              <span className="font-mono-nums text-xs text-neutral-300">
                {challenge.responseCount} {t.truthsLabel}
              </span>
            </button>
          </div>
        ) : hasSidePhotos ? (
          <PhotoDuelVote
            challenge={challenge}
            votedSide={votedSide}
            votingSide={votingSide}
            isClosed={isClosed}
            lang={lang}
            t={t}
            compact
            onVote={(side) => void handleVote(side)}
          />
        ) : (
          <div className="space-y-2.5 mb-4">
            {/* Side A */}
            <button
              type="button"
              disabled={isClosed || Boolean(votedSide) || Boolean(votingSide)}
              onClick={() => handleVote('A')}
              className={`relative w-full min-h-[48px] px-4 py-3 rounded-xl border text-left overflow-hidden transition-all active:scale-[0.99] cursor-pointer disabled:cursor-default ${
                votedSide === 'A'
                  ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/40'
                  : 'border-neutral-200 hover:border-emerald-500 bg-neutral-50/60'
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
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-neutral-900 flex items-center gap-2 min-w-0">
                  {votedSide === 'A' && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                  <span className="truncate">{challenge.sideALabel}</span>
                </span>
                {(votedSide || isClosed) && (
                  <span className="font-mono-nums text-xs font-bold text-emerald-800 shrink-0">
                    {pctA}% · {challenge.votesA}
                  </span>
                )}
              </div>
            </button>

            {/* Side B */}
            <button
              type="button"
              disabled={isClosed || Boolean(votedSide) || Boolean(votingSide)}
              onClick={() => handleVote('B')}
              className={`relative w-full min-h-[48px] px-4 py-3 rounded-xl border text-left overflow-hidden transition-all active:scale-[0.99] cursor-pointer disabled:cursor-default ${
                votedSide === 'B'
                  ? 'border-orange-600 ring-1 ring-orange-600 bg-orange-50/40'
                  : 'border-neutral-200 hover:border-orange-500 bg-neutral-50/60'
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
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-neutral-900 flex items-center gap-2 min-w-0">
                  {votedSide === 'B' && <Check className="w-4 h-4 text-orange-700 shrink-0" />}
                  <span className="truncate">{challenge.sideBLabel}</span>
                </span>
                {(votedSide || isClosed) && (
                  <span className="font-mono-nums text-xs font-bold text-orange-800 shrink-0">
                    {pctB}% · {challenge.votesB}
                  </span>
                )}
              </div>
            </button>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-0.5">
              <span className="font-mono-nums">
                {totalVotes} {t.votesLabel}
              </span>
              <span>{votedSide ? t.voteRecorded : t.oneClickHint}</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-red-600 mb-3" role="alert">
            {errorMsg}
          </p>
        )}

        {/* Share & Actions Footer */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <a
              href={getWhatsAppShareHref(challenge, lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.shareWhatsApp}</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? t.copied : t.copyLink}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void downloadShareCardImage(challenge)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.downloadCard}</span>
            </button>

            {challenge.type !== 'secret_poll' && (
              <button
                type="button"
                onClick={() => onOpenArena(challenge.id)}
                className="inline-flex items-center gap-1 min-h-[40px] px-3 py-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{t.openArena}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
