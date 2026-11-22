import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Check, Copy, Flame, ImagePlus, Lock, Share2, Users, X } from 'lucide-react';
import { STARTER_TEMPLATES, Translations } from '../lib/i18n';
import { compressSideImageFile } from '../lib/imageUpload';
import { buildChallengeShareUrl, getWhatsAppShareHref } from '../lib/shareCardGenerator';
import { createChallenge } from '../services/bolosachService';
import {
  Challenge,
  ChallengeCategory,
  ChallengeType,
  ChallengeVisibility,
  LangCode,
  LIMITS,
  PublicProfile,
  sanitizeHttpsUrl,
} from '../types/bolosach';

interface CreateChallengeModalProps {
  isOpen: boolean;
  initialType?: ChallengeType;
  currentUser: User;
  profile: PublicProfile;
  lang: LangCode;
  t: Translations;
  onClose: () => void;
  onCreated: (challengeId: string) => void;
}

const CATEGORIES: ChallengeCategory[] = [
  'cricket',
  'friendship',
  'roast',
  'poetry',
  'debate',
  'general',
];

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  initialType = 'battle',
  currentUser,
  profile,
  lang,
  t,
  onClose,
  onCreated,
}) => {
  const [type, setType] = useState<ChallengeType>(initialType);
  const [category, setCategory] = useState<ChallengeCategory>('friendship');
  const [title, setTitle] = useState('');
  const [sideALabel, setSideALabel] = useState('');
  const [sideBLabel, setSideBLabel] = useState('');
  const [sideAImageUrl, setSideAImageUrl] = useState('');
  const [sideBImageUrl, setSideBImageUrl] = useState('');
  const [processingSide, setProcessingSide] = useState<'A' | 'B' | null>(null);
  const [visibility, setVisibility] = useState<ChallengeVisibility>('public');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [publishedChallenge, setPublishedChallenge] = useState<Challenge | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setErrorMsg('');
      setPublishedChallenge(null);
      setCopied(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (side: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg('');
    setProcessingSide(side);
    try {
      const compressed = await compressSideImageFile(file);
      if (side === 'A') {
        setSideAImageUrl(compressed);
      } else {
        setSideBImageUrl(compressed);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process photo.');
    } finally {
      setProcessingSide(null);
    }
  };

  const applyTemplate = (idx: number) => {
    const tpl = STARTER_TEMPLATES[idx];
    if (!tpl) return;
    setType(tpl.type);
    setCategory(tpl.category);
    setTitle(lang === 'ur' ? tpl.titleUr : tpl.titleEn);
    setSideALabel(lang === 'ur' ? tpl.sideAUr : tpl.sideAEn);
    setSideBLabel(lang === 'ur' ? tpl.sideBUr : tpl.sideBEn);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    const cleanTitle = title.trim();
    const cleanA = type === 'secret_poll' ? (sideALabel.trim() || 'Honest') : sideALabel.trim();
    const cleanB = type === 'secret_poll' ? (sideBLabel.trim() || 'Spicy') : sideBLabel.trim();

    if (cleanTitle.length < LIMITS.TITLE_MIN) {
      setErrorMsg('Question must be at least 3 characters.');
      return;
    }
    if (type !== 'secret_poll' && (cleanA.length < LIMITS.SIDE_MIN || cleanB.length < LIMITS.SIDE_MIN)) {
      setErrorMsg('Please enter both sides for your battle or poll.');
      return;
    }

    const cleanAImg = type === 'secret_poll' ? '' : sideAImageUrl;
    const cleanBImg = type === 'secret_poll' ? '' : sideBImageUrl;

    setSubmitting(true);
    try {
      const id = await createChallenge(currentUser, profile, {
        type,
        category,
        title: cleanTitle,
        sideALabel: cleanA,
        sideBLabel: cleanB,
        sideAImageUrl: cleanAImg,
        sideBImageUrl: cleanBImg,
        visibility,
        lang,
      });
      setPublishedChallenge({
        id,
        creatorId: currentUser.uid,
        creatorName: profile.displayName,
        creatorHandle: profile.handle,
        creatorPhotoUrl: sanitizeHttpsUrl(profile.photoUrl),
        type,
        category,
        title: cleanTitle,
        sideALabel: cleanA,
        sideBLabel: cleanB,
        sideAImageUrl: cleanAImg,
        sideBImageUrl: cleanBImg,
        votesA: 0,
        votesB: 0,
        responseCount: 0,
        lastEventId: '',
        visibility,
        status: 'active',
        lang,
        createdAt: null,
        updatedAt: null,
      });
      setTitle('');
      setSideALabel('');
      setSideBLabel('');
      setSideAImageUrl('');
      setSideBImageUrl('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPublished = async () => {
    if (!publishedChallenge) return;
    try {
      await navigator.clipboard.writeText(buildChallengeShareUrl(publishedChallenge.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMsg('Unable to copy link.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border border-neutral-200 max-h-[92vh] overflow-y-auto p-6 sm:p-7"
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
      >
        <div className="w-10 h-1.5 bg-neutral-300 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 id="create-modal-title" className="text-xl font-extrabold text-neutral-950">
            {publishedChallenge
              ? lang === 'ur'
                ? 'چیلنج لائیو ہو گیا!'
                : 'Your Challenge is Live!'
              : t.createModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {publishedChallenge ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold text-emerald-700 mb-1">
                {t.typeLabels[publishedChallenge.type]} · {t.categoryLabels[publishedChallenge.category]}
              </p>
              <p className="text-lg font-bold text-neutral-950 leading-snug">
                {publishedChallenge.title}
              </p>
              <p className="text-xs font-mono-nums text-neutral-500 mt-2 truncate">
                {buildChallengeShareUrl(publishedChallenge.id)}
              </p>
            </div>

            <a
              href={getWhatsAppShareHref(publishedChallenge, lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>
                {lang === 'ur'
                  ? 'ڈائریکٹ WhatsApp پر شیئر کریں'
                  : 'Open Directly in WhatsApp'}
              </span>
            </a>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopyPublished}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
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
                onClick={() => onCreated(publishedChallenge.id)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer"
              >
                {t.openArena}
              </button>
            </div>
          </div>
        ) : (
        <>

        {/* Starter Templates */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-neutral-500 mb-2">{t.quickTemplates}</p>
          <div className="flex flex-wrap gap-2">
            {STARTER_TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.titleEn}
                type="button"
                onClick={() => applyTemplate(idx)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-emerald-600 bg-neutral-50 hover:bg-emerald-50/40 text-xs font-medium text-neutral-700 transition-colors cursor-pointer text-left"
              >
                {lang === 'ur' ? tpl.titleUr : tpl.titleEn}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('battle')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                type === 'battle'
                  ? 'border-emerald-600 bg-emerald-50/60 text-neutral-950'
                  : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
              }`}
            >
              <Flame className="w-4 h-4 text-emerald-600 mb-1.5" />
              <p className="text-xs font-bold">{t.modeBattle}</p>
              <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">{t.modeBattleDesc}</p>
            </button>

            <button
              type="button"
              onClick={() => setType('friend_poll')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                type === 'friend_poll'
                  ? 'border-emerald-600 bg-emerald-50/60 text-neutral-950'
                  : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
              }`}
            >
              <Users className="w-4 h-4 text-orange-600 mb-1.5" />
              <p className="text-xs font-bold">{t.modeFriendPoll}</p>
              <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">{t.modeFriendPollDesc}</p>
            </button>

            <button
              type="button"
              onClick={() => setType('secret_poll')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                type === 'secret_poll'
                  ? 'border-emerald-600 bg-emerald-50/60 text-neutral-950'
                  : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
              }`}
            >
              <Lock className="w-4 h-4 text-neutral-900 mb-1.5" />
              <p className="text-xs font-bold">{t.modeSecretPoll}</p>
              <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">{t.modeSecretPollDesc}</p>
            </button>
          </div>

          {/* Question Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="challenge-title" className="text-xs font-semibold text-neutral-700">
                {t.fieldQuestion}
              </label>
              <span className="font-mono-nums text-xs text-neutral-400">
                {title.length}/{LIMITS.TITLE_MAX}
              </span>
            </div>
            <textarea
              id="challenge-title"
              rows={2}
              required
              maxLength={LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'secret_poll'
                  ? 'e.g. Tell me one honest truth you never told me...'
                  : 'e.g. Who is better under pressure: Ali or Hamza?'
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          {/* Side A & B for Battles and Friend Polls */}
          {type !== 'secret_poll' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="side-a-input" className="block text-xs font-semibold text-emerald-800 mb-1.5">
                    {t.fieldSideA}
                  </label>
                  <input
                    id="side-a-input"
                    type="text"
                    required
                    maxLength={LIMITS.SIDE_MAX}
                    value={sideALabel}
                    onChange={(e) => setSideALabel(e.target.value)}
                    placeholder={lang === 'ur' ? 'مثلاً علی / آپشن A' : 'e.g. Ali / Option A'}
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="side-b-input" className="block text-xs font-semibold text-orange-800 mb-1.5">
                    {t.fieldSideB}
                  </label>
                  <input
                    id="side-b-input"
                    type="text"
                    required
                    maxLength={LIMITS.SIDE_MAX}
                    value={sideBLabel}
                    onChange={(e) => setSideBLabel(e.target.value)}
                    placeholder={lang === 'ur' ? 'مثلاً حمزہ / آپشن B' : 'e.g. Hamza / Option B'}
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Dual Photo Uploader for Option A vs Option B */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5">
                <div className="mb-2.5">
                  <p className="text-xs font-bold text-neutral-900">{t.sidePhotosTitle}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{t.sidePhotosHint}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Photo A Slot */}
                  <div className="relative">
                    {sideAImageUrl ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border-2 border-emerald-600 bg-white">
                        <img
                          src={sideAImageUrl}
                          alt={sideALabel || t.optionABadge}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold">
                          {t.optionABadge}
                        </span>
                        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1.5">
                          <label className="min-h-[28px] px-2.5 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-semibold flex items-center justify-center cursor-pointer">
                            {t.changePhoto}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => void handlePhotoSelect('A', e)}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setSideAImageUrl('')}
                            aria-label={t.removePhoto}
                            className="w-7 h-7 rounded-lg bg-black/75 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="h-32 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-white flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer transition-colors">
                        <ImagePlus className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800">
                          {processingSide === 'A' ? t.processingPhoto : t.uploadPhotoA}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate max-w-full">
                          {sideALabel.trim() || t.optionABadge}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={processingSide !== null}
                          className="hidden"
                          onChange={(e) => void handlePhotoSelect('A', e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Photo B Slot */}
                  <div className="relative">
                    {sideBImageUrl ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border-2 border-orange-600 bg-white">
                        <img
                          src={sideBImageUrl}
                          alt={sideBLabel || t.optionBBadge}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-orange-600 text-white text-[10px] font-extrabold">
                          {t.optionBBadge}
                        </span>
                        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1.5">
                          <label className="min-h-[28px] px-2.5 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-semibold flex items-center justify-center cursor-pointer">
                            {t.changePhoto}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => void handlePhotoSelect('B', e)}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setSideBImageUrl('')}
                            aria-label={t.removePhoto}
                            className="w-7 h-7 rounded-lg bg-black/75 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="h-32 rounded-xl border-2 border-dashed border-orange-300 hover:border-orange-600 bg-white flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer transition-colors">
                        <ImagePlus className="w-5 h-5 text-orange-600" />
                        <span className="text-xs font-bold text-orange-800">
                          {processingSide === 'B' ? t.processingPhoto : t.uploadPhotoB}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate max-w-full">
                          {sideBLabel.trim() || t.optionBBadge}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={processingSide !== null}
                          className="hidden"
                          onChange={(e) => void handlePhotoSelect('B', e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category + Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="category-select" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {t.fieldCategory}
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ChallengeCategory)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t.categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="visibility-select" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {t.fieldVisibility}
              </label>
              <select
                id="visibility-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ChallengeVisibility)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="public">{t.visPublic}</option>
                <option value="unlisted">{t.visUnlisted}</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            {submitting ? t.publishing : t.publishBtn}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
};
