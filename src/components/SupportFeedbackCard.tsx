import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Mail, MessageSquareWarning, Send } from 'lucide-react';
import { Translations } from '../lib/i18n';
import { submitSupportFeedback } from '../services/bolosachService';
import { LangCode, LIMITS } from '../types/bolosach';

interface SupportFeedbackCardProps {
  currentUser: User | null;
  lang: LangCode;
  t: Translations;
}

export const SupportFeedbackCard: React.FC<SupportFeedbackCardProps> = ({
  currentUser,
  lang,
  t,
}) => {
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser?.email) {
      setEmail((prev) => (prev.trim() ? prev : currentUser.email ?? ''));
    }
  }, [currentUser?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await submitSupportFeedback(email, message, lang, currentUser);
      setMessage('');
      setSent(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === 'ur'
          ? 'کمنٹ بھیجنے میں مسئلہ پیش آیا، دوبارہ کوشش کریں۔'
          : 'Could not send your comment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="support-feedback-box"
      className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3.5"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquareWarning className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-neutral-950">{t.feedbackTitle}</h3>
          <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">{t.feedbackDesc}</p>
        </div>
      </div>

      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.feedbackSent}</span>
          </div>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-xs font-semibold text-emerald-700 underline cursor-pointer"
          >
            {lang === 'ur' ? 'ایک اور کمنٹ بھیجیں' : 'Send another comment'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="feedback-email-input"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              {t.feedbackEmailLabel}
            </label>
            <div className="relative">
              <Mail
                className={`w-3.5 h-3.5 text-neutral-400 absolute top-1/2 -translate-y-1/2 ${
                  lang === 'ur' ? 'right-3' : 'left-3'
                }`}
              />
              <input
                id="feedback-email-input"
                type="email"
                required
                dir="ltr"
                maxLength={LIMITS.EMAIL_MAX}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.feedbackEmailPlaceholder}
                className={`w-full min-h-[42px] rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white ${
                  lang === 'ur' ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="feedback-message-input"
                className="block text-xs font-semibold text-neutral-700"
              >
                {t.feedbackMessageLabel}
              </label>
              <span className="text-[11px] font-mono-nums text-neutral-400">
                {message.length}/{LIMITS.FEEDBACK_MAX}
              </span>
            </div>
            <textarea
              id="feedback-message-input"
              rows={3}
              required
              minLength={LIMITS.FEEDBACK_MIN}
              maxLength={LIMITS.FEEDBACK_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.feedbackMessagePlaceholder}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
            />
          </div>

          {errorMsg && (
            <p
              className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
              role="alert"
            >
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[42px] px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? t.feedbackSending : t.feedbackSubmit}</span>
          </button>
        </form>
      )}
    </div>
  );
};
