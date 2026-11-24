import fs from 'fs';
import path from 'path';

export interface ApiRequest {
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string | string[]) => void;
  send: (body: Buffer | string) => void;
  end: (body?: Buffer | string) => void;
}

export interface ChallengePreview {
  id: string;
  title: string;
  type: 'battle' | 'friend_poll' | 'secret_poll';
  category: string;
  sideALabel: string;
  sideBLabel: string;
  sideAImageUrl: string;
  sideBImageUrl: string;
  votesA: number;
  votesB: number;
  responseCount: number;
  creatorHandle: string;
  creatorName: string;
  visibility: 'public' | 'unlisted';
  lang: 'en' | 'ur';
  updateTime: string;
}

interface FirestoreFieldValue {
  stringValue?: string;
  integerValue?: string | number;
  doubleValue?: number;
  booleanValue?: boolean;
}

interface FirestoreDocumentResponse {
  name?: string;
  updateTime?: string;
  fields?: Record<string, FirestoreFieldValue>;
}

const DEFAULT_PROJECT_ID = 'sonorous-boulevard-2q7xb';
const DEFAULT_DATABASE_ID = 'ai-studio-af72314c-89fe-4dee-8336-72c46c8e9ca4';
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

let cachedConfig: { projectId: string; firestoreDatabaseId: string } | null = null;

function getFirebaseIds(): { projectId: string; firestoreDatabaseId: string } {
  if (cachedConfig) return cachedConfig;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
        projectId?: string;
        firestoreDatabaseId?: string;
      };
      if (parsed.projectId && parsed.firestoreDatabaseId) {
        cachedConfig = {
          projectId: parsed.projectId,
          firestoreDatabaseId: parsed.firestoreDatabaseId,
        };
        return cachedConfig;
      }
    }
  } catch {
    // Fallback to known project identifiers
  }
  cachedConfig = {
    projectId: DEFAULT_PROJECT_ID,
    firestoreDatabaseId: DEFAULT_DATABASE_ID,
  };
  return cachedConfig;
}

export function extractChallengeId(req: ApiRequest): string | null {
  const rawFromQuery = req.query?.c;
  const candidate = Array.isArray(rawFromQuery) ? rawFromQuery[0] : rawFromQuery;
  if (candidate && SAFE_ID_REGEX.test(candidate.trim())) {
    return candidate.trim();
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'https://bolosach.vercel.app');
      const fromUrl = parsed.searchParams.get('c')?.trim();
      if (fromUrl && SAFE_ID_REGEX.test(fromUrl)) {
        return fromUrl;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function getOriginFromRequest(req: ApiRequest): string {
  const rawHost = req.headers?.['x-forwarded-host'] ?? req.headers?.host;
  const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost)?.trim();
  const rawProto = req.headers?.['x-forwarded-proto'];
  const proto = (Array.isArray(rawProto) ? rawProto[0] : rawProto)?.trim() || 'https';
  if (host) {
    return `${proto}://${host}`;
  }
  return 'https://bolosach.vercel.app';
}

function strField(fields: Record<string, FirestoreFieldValue>, key: string, fallback = ''): string {
  const val = fields[key]?.stringValue;
  return typeof val === 'string' ? val : fallback;
}

function intField(fields: Record<string, FirestoreFieldValue>, key: string): number {
  const raw = fields[key]?.integerValue;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function fetchChallengeForPreview(
  challengeId: string
): Promise<ChallengePreview | null> {
  if (!SAFE_ID_REGEX.test(challengeId)) {
    return null;
  }

  const { projectId, firestoreDatabaseId } = getFirebaseIds();
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(firestoreDatabaseId)}/documents/challenges/${encodeURIComponent(
    challengeId
  )}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      return null;
    }

    const doc = (await res.json()) as FirestoreDocumentResponse;
    const fields = doc.fields;
    if (!fields) return null;

    const visibility = strField(fields, 'visibility', 'public');
    if (visibility !== 'public' && visibility !== 'unlisted') {
      return null;
    }

    const rawType = strField(fields, 'type', 'battle');
    const type: ChallengePreview['type'] =
      rawType === 'secret_poll' || rawType === 'friend_poll' ? rawType : 'battle';

    return {
      id: challengeId,
      title: strField(fields, 'title', 'BoloSach 1v1 Challenge'),
      type,
      category: strField(fields, 'category', 'general'),
      sideALabel: strField(fields, 'sideALabel', 'Option A'),
      sideBLabel: strField(fields, 'sideBLabel', 'Option B'),
      sideAImageUrl: strField(fields, 'sideAImageUrl', ''),
      sideBImageUrl: strField(fields, 'sideBImageUrl', ''),
      votesA: intField(fields, 'votesA'),
      votesB: intField(fields, 'votesB'),
      responseCount: intField(fields, 'responseCount'),
      creatorHandle: strField(fields, 'creatorHandle', 'bolosach'),
      creatorName: strField(fields, 'creatorName', 'Creator'),
      visibility: visibility === 'unlisted' ? 'unlisted' : 'public',
      lang: strField(fields, 'lang', 'en') === 'ur' ? 'ur' : 'en',
      updateTime: doc.updateTime || '',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface SitemapEntry {
  id: string;
  updateTime: string;
}

interface RunQueryRow {
  document?: {
    name?: string;
    updateTime?: string;
    fields?: Record<string, FirestoreFieldValue>;
  };
}

export async function listPublicChallengeSitemapEntries(limitCount = 200): Promise<SitemapEntry[]> {
  const { projectId, firestoreDatabaseId } = getFirebaseIds();
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(firestoreDatabaseId)}/documents:runQuery`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'challenges' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'visibility' },
              op: 'EQUAL',
              value: { stringValue: 'public' },
            },
          },
          limit: limitCount,
        },
      }),
    });

    if (!res.ok) return [];
    const rows = (await res.json()) as RunQueryRow[];
    const entries: SitemapEntry[] = [];
    for (const row of rows) {
      const fullName = row.document?.name;
      if (!fullName) continue;
      const fields = row.document?.fields;
      if (!fields) continue;
      if (strField(fields, 'visibility', '') !== 'public') continue;
      if (strField(fields, 'type', 'battle') === 'secret_poll') continue;
      const id = fullName.split('/').pop() || '';
      if (!SAFE_ID_REGEX.test(id)) continue;
      entries.push({
        id,
        updateTime: row.document?.updateTime || '',
      });
    }
    return entries;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

