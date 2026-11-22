import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Translations } from '../lib/i18n';
import { Challenge, LangCode, sanitizeSideImage } from '../types/bolosach';

interface PhotoDuelVoteProps {
  challenge: Challenge;
  votedSide: 'A' | 'B' | null;
  votingSide: 'A' | 'B' | null;
  isClosed: boolean;
  lang: LangCode;
  t: Translations;
  compact?: boolean;
  onVote: (side: 'A' | 'B') => void;
}

export const PhotoDuelVote: React.FC<PhotoDuelVoteProps> = ({
  challenge,
  votedSide,
  votingSide,
  isClosed,
  lang,
  t,
  compact = false,
  onVote,
}) => {
  const safeImgA = sanitizeSideImage(challenge.sideAImageUrl);
  const safeImgB = sanitizeSideImage(challenge.sideBImageUrl);
  const totalVotes = challenge.votesA + challenge.votesB;
  const pctA = totalVotes > 0 ? Math.round((challenge.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;
  const showResults = Boolean(votedSide || isClosed);
  const disabled = isClosed || Boolean(votedSide) || Boolean(votingSide);
  const isUrdu = challenge.lang === 'ur' || lang === 'ur';

  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      <div className="relative grid grid-cols-2 gap-3">
        {/* Side A Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote('A')}
          className={`group relative flex flex-col rounded-2xl border overflow-hidden text-left transition-all active:scale-[0.985] cursor-pointer disabled:cursor-default bg-white ${
            votedSide === 'A'
              ? 'border-emerald-600 ring-2 ring-emerald-600/25'
              : 'border-neutral-200 hover:border-emerald-500'
          }`}
        >
          <div className="relative aspect-square w-full bg-emerald-50 overflow-hidden">
            {safeImgA ? (
              <img
                src={safeImgA}
                alt={challenge.sideALabel}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 font-extrabold text-4xl select-none">
                {challenge.sideALabel.trim().charAt(0).toUpperCase() || 'A'}
              </div>
            )}

            <div className="absolute inset-x-0 top-0 p-2 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold tracking-wide shadow-xs">
                A
              </span>
              {votedSide === 'A' && (
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            {showResults && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-6 pb-2 flex items-baseline justify-between text-white">
                <span className="font-mono-nums text-base sm:text-lg font-extrabold">{pctA}%</span>
                <span className="font-mono-nums text-[11px] text-neutral-200">
                  {challenge.votesA} {t.votesLabel}
                </span>
              </div>
            )}
          </div>

          <div className="relative px-3 py-2.5 flex-1 flex items-center justify-between gap-2 bg-neutral-50/70">
            {showResults && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: `${pctA}%`, transformOrigin: 'left center' }}
                className="absolute inset-y-0 left-0 bg-emerald-100/85"
              />
            )}
            <span
              className={`relative text-xs sm:text-sm font-bold text-neutral-950 line-clamp-2 leading-snug ${
                isUrdu ? 'font-urdu' : ''
              }`}
            >
              {challenge.sideALabel}
            </span>
          </div>
        </button>

        {/* Centered VS Badge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-xl bg-neutral-950 text-white text-[11px] font-extrabold tracking-wider flex items-center justify-center border-2 border-white shadow-md"
        >
          VS
        </div>

        {/* Side B Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote('B')}
          className={`group relative flex flex-col rounded-2xl border overflow-hidden text-left transition-all active:scale-[0.985] cursor-pointer disabled:cursor-default bg-white ${
            votedSide === 'B'
              ? 'border-orange-600 ring-2 ring-orange-600/25'
              : 'border-neutral-200 hover:border-orange-500'
          }`}
        >
          <div className="relative aspect-square w-full bg-orange-50 overflow-hidden">
            {safeImgB ? (
              <img
                src={safeImgB}
                alt={challenge.sideBLabel}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 font-extrabold text-4xl select-none">
                {challenge.sideBLabel.trim().charAt(0).toUpperCase() || 'B'}
              </div>
            )}

            <div className="absolute inset-x-0 top-0 p-2 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white text-[11px] font-extrabold tracking-wide shadow-xs">
                B
              </span>
              {votedSide === 'B' && (
                <span className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            {showResults && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-6 pb-2 flex items-baseline justify-between text-white">
                <span className="font-mono-nums text-base sm:text-lg font-extrabold">{pctB}%</span>
                <span className="font-mono-nums text-[11px] text-neutral-200">
                  {challenge.votesB} {t.votesLabel}
                </span>
              </div>
            )}
          </div>

          <div className="relative px-3 py-2.5 flex-1 flex items-center justify-between gap-2 bg-neutral-50/70">
            {showResults && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: `${pctB}%`, transformOrigin: 'left center' }}
                className="absolute inset-y-0 left-0 bg-orange-100/85"
              />
            )}
            <span
              className={`relative text-xs sm:text-sm font-bold text-neutral-950 line-clamp-2 leading-snug ${
                isUrdu ? 'font-urdu' : ''
              }`}
            >
              {challenge.sideBLabel}
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 pt-2">
        <span className="font-mono-nums">
          {totalVotes} {t.votesLabel}
        </span>
        <span>{votedSide ? t.voteRecorded : t.oneClickHint}</span>
      </div>
    </div>
  );
};
