import { Timestamp } from 'firebase/firestore';

export type LangCode = 'en' | 'ur';
export type ChallengeType = 'battle' | 'secret_poll' | 'friend_poll';
export type ChallengeCategory = 'cricket' | 'poetry' | 'friendship' | 'roast' | 'debate' | 'general';
export type ChallengeVisibility = 'public' | 'unlisted';
export type ChallengeStatus = 'active' | 'closed';
export type SecretMoodTag = 'honest' | 'funny' | 'spicy' | 'kind';

export const LIMITS = {
  ID_MAX: 128,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  HANDLE_MIN: 2,
  HANDLE_MAX: 32,
  HANDLE_REGEX: /^[a-zA-Z0-9_]+$/,
  DISPLAY_NAME_MAX: 60,
  BIO_MAX: 160,
  PHOTO_URL_MAX: 500,
  SIDE_IMAGE_MAX: 75000,
  TITLE_MIN: 3,
  TITLE_MAX: 140,
  SIDE_MIN: 1,
  SIDE_MAX: 60,
  SECRET_MIN: 2,
  SECRET_MAX: 280,
  REPLY_MAX: 240,
} as const;

export function isValidFirestoreId(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      value.length >= 1 &&
      value.length <= LIMITS.ID_MAX &&
      LIMITS.ID_REGEX.test(value)
  );
}

export function sanitizeHttpsUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString().slice(0, LIMITS.PHOTO_URL_MAX);
    }
    return '';
  } catch {
    return '';
  }
}

const DATA_IMAGE_REGEX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function sanitizeSideImage(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.length <= LIMITS.SIDE_IMAGE_MAX && DATA_IMAGE_REGEX.test(trimmed)) {
    return trimmed;
  }
  return sanitizeHttpsUrl(trimmed);
}

export interface UserPrivate {
  uid: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  handle: string;
  photoUrl: string;
  bio: string;
  preferredLang: LangCode;
  totalChallenges: number;
  totalVotesReceived: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Challenge {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  creatorPhotoUrl: string;
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  sideALabel: string;
  sideBLabel: string;
  sideAImageUrl?: string;
  sideBImageUrl?: string;
  votesA: number;
  votesB: number;
  responseCount: number;
  lastEventId: string;
  visibility: ChallengeVisibility;
  status: ChallengeStatus;
  lang: LangCode;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface VoteRecord {
  id: string;
  challengeId: string;
  side: 'A' | 'B';
  voterUid: string;
  createdAt: Timestamp | null;
}

export interface SecretResponse {
  id: string;
  challengeId: string;
  creatorId: string;
  message: string;
  moodTag: SecretMoodTag;
  isShowcased: boolean;
  creatorReply: string;
  createdAt: Timestamp | null;
}

export interface CreateChallengeInput {
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  sideALabel: string;
  sideBLabel: string;
  sideAImageUrl?: string;
  sideBImageUrl?: string;
  visibility: ChallengeVisibility;
  lang: LangCode;
}

export const OWNER_ADMIN_EMAIL = 'asifrn0041@gmail.com';

export function isOwnerAdmin(
  user: { email?: string | null; emailVerified?: boolean } | null | undefined
): boolean {
  return Boolean(
    user &&
      user.emailVerified === true &&
      user.email &&
      user.email.toLowerCase() === OWNER_ADMIN_EMAIL
  );
}

