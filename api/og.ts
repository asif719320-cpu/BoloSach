import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import {
  ApiRequest,
  ApiResponse,
  ChallengePreview,
  extractChallengeId,
  fetchChallengeForPreview,
} from './_firestore.js';

const WIDTH = 1200;
const HEIGHT = 630;
const PHOTO_SIZE = 276;
const PHOTO_RADIUS = 24;
const DATA_IMAGE_REGEX = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

const FONT_FILES = ['NotoSans-Bold.ttf', 'NotoSans-Regular.ttf', 'NotoSansArabic-Bold.ttf']
  .map((file) => path.join(process.cwd(), 'api', 'fonts', file))
  .filter((filePath) => fs.existsSync(filePath));

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasRtlChars(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

function fontForText(text: string): string {
  return hasRtlChars(text)
    ? 'Noto Sans Arabic, Noto Sans, sans-serif'
    : 'Noto Sans, Noto Sans Arabic, sans-serif';
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return ['BoloSach 1v1 Challenge'];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        current = word;
      } else {
        lines.push(word.slice(0, maxCharsPerLine));
        current = '';
      }
      if (lines.length === maxLines) {
        break;
      }
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const lastIdx = lines.length - 1;
    lines[lastIdx] = `${lines[lastIdx].slice(0, Math.max(4, maxCharsPerLine - 1))}…`;
  }

  return lines;
}

function truncateLabel(text: string, maxChars: number): string {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars - 1)}…`;
}

async function resolveImageBuffer(src: string): Promise<Buffer | null> {
  if (!src) return null;
  const trimmed = src.trim();
  const dataMatch = DATA_IMAGE_REGEX.exec(trimmed);
  if (dataMatch) {
    try {
      return Buffer.from(dataMatch[2], 'base64');
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('https://')) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(trimmed, { signal: controller.signal });
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) return null;
      const ab = await res.arrayBuffer();
      if (ab.byteLength === 0 || ab.byteLength > 3 * 1024 * 1024) return null;
      return Buffer.from(ab);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

async function renderRoundedPhoto(src: string, size: number, radius: number): Promise<Buffer | null> {
  const raw = await resolveImageBuffer(src);
  if (!raw) return null;
  try {
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#ffffff"/></svg>`
    );
    return await sharp(raw)
      .rotate()
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .ensureAlpha()
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

function buildBrandSvg(): string {
  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#091114"/>
      <stop offset="55%" stop-color="#06281E"/>
      <stop offset="100%" stop-color="#1D120C"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#F97316"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="64" y="64" width="${WIDTH - 128}" height="${HEIGHT - 128}" rx="36" fill="#0F171A" stroke="#1F3B33" stroke-width="2"/>
  <rect x="120" y="130" width="180" height="8" rx="4" fill="url(#accent)"/>
  <text x="120" y="218" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="68" font-weight="700">BoloSach</text>
  <text x="120" y="305" fill="#D1FAE5" font-family="Noto Sans, sans-serif" font-size="34" font-weight="700">1v1 Photo Battles &amp; Secret Polls</text>
  <text x="120" y="365" fill="#9CA3AF" font-family="Noto Sans, sans-serif" font-size="24" font-weight="400">Challenge friends, drop a link on WhatsApp or Facebook, vote in 1 click.</text>
  <rect x="120" y="438" width="320" height="58" rx="16" fill="#059669"/>
  <text x="280" y="476" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="24" font-weight="700">bolosach.vercel.app</text>
</svg>`;
}

function buildSecretPollSvg(c: ChallengePreview): string {
  const titleLines = wrapLines(c.title, 44, 3);
  const titleFont = fontForText(c.title);
  const titleYStart = titleLines.length === 1 ? 285 : titleLines.length === 2 ? 255 : 225;

  const titleSvg = titleLines
    .map(
      (line, idx) =>
        `<text x="600" y="${titleYStart + idx * 54}" text-anchor="middle" fill="#FFFFFF" font-family="${titleFont}" font-size="40" font-weight="700">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B1114"/>
      <stop offset="100%" stop-color="#06291F"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="56" y="48" width="${WIDTH - 112}" height="${HEIGHT - 96}" rx="34" fill="#11181C" stroke="#1E3A34" stroke-width="2.5"/>
  <rect x="100" y="88" width="166" height="44" rx="14" fill="#059669"/>
  <text x="183" y="118" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="24" font-weight="700">BoloSach</text>
  <text x="288" y="118" fill="#A7F3D0" font-family="Noto Sans, sans-serif" font-size="22" font-weight="700">SECRET POLL · @${escapeXml(
    truncateLabel(c.creatorHandle, 20)
  )}</text>
  ${titleSvg}
  <rect x="340" y="438" width="520" height="64" rx="18" fill="#059669"/>
  <text x="600" y="479" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="26" font-weight="700">Send an Anonymous Honest Truth</text>
  <text x="600" y="554" text-anchor="middle" fill="#9CA3AF" font-family="Noto Sans, sans-serif" font-size="20" font-weight="400">${c.responseCount} replies received · 100% private</text>
</svg>`;
}

function buildBattleSvg(
  c: ChallengePreview,
  hasPhotoA: boolean,
  hasPhotoB: boolean
): string {
  const totalVotes = c.votesA + c.votesB;
  const pctA = totalVotes > 0 ? Math.round((c.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  const titleLines = wrapLines(c.title, 48, 2);
  const titleFont = fontForText(c.title);
  const titleStartY = titleLines.length === 1 ? 128 : 110;
  const titleSvg = titleLines
    .map(
      (line, idx) =>
        `<text x="600" y="${titleStartY + idx * 42}" text-anchor="middle" fill="#FFFFFF" font-family="${titleFont}" font-size="34" font-weight="700">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  const labelA = truncateLabel(c.sideALabel, 20);
  const labelB = truncateLabel(c.sideBLabel, 20);
  const initialA = escapeXml(labelA.charAt(0).toUpperCase() || 'A');
  const initialB = escapeXml(labelB.charAt(0).toUpperCase() || 'B');

  const subA = totalVotes > 0 ? `${pctA}% · ${c.votesA} votes` : 'VOTE OPTION A';
  const subB = totalVotes > 0 ? `${pctB}% · ${c.votesB} votes` : 'VOTE OPTION B';
  const votePill = totalVotes > 0 ? `${totalVotes} Votes` : 'Live 1v1';

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071915"/>
      <stop offset="50%" stop-color="#0D1216"/>
      <stop offset="100%" stop-color="#1E1009"/>
    </linearGradient>
    <linearGradient id="vsGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#F97316"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Top Studio Bar -->
  <rect x="64" y="28" width="152" height="40" rx="12" fill="#059669"/>
  <text x="140" y="55" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="22" font-weight="700">BoloSach</text>
  <text x="234" y="55" fill="#9CA3AF" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">@${escapeXml(
    truncateLabel(c.creatorHandle, 18)
  )} · ${escapeXml(c.category.toUpperCase())}</text>

  <rect x="976" y="28" width="160" height="40" rx="20" fill="#13221F" stroke="#10B981" stroke-width="1.5"/>
  <text x="1056" y="55" text-anchor="middle" fill="#34D399" font-family="Noto Sans, sans-serif" font-size="19" font-weight="700">${escapeXml(
    votePill
  )}</text>

  <!-- Question Title -->
  ${titleSvg}

  <!-- Left Fighter Card (Side A) -->
  <rect x="74" y="172" width="476" height="392" rx="28" fill="#0B221C" stroke="#10B981" stroke-width="3"/>
  <rect x="174" y="190" width="${PHOTO_SIZE}" height="${PHOTO_SIZE}" rx="${PHOTO_RADIUS}" fill="#064E3B" stroke="#34D399" stroke-width="2"/>
  ${
    hasPhotoA
      ? ''
      : `<text x="312" y="364" text-anchor="middle" fill="#6EE7B7" font-family="${fontForText(
          labelA
        )}" font-size="110" font-weight="700">${initialA}</text>`
  }
  <rect x="186" y="202" width="44" height="34" rx="10" fill="#059669"/>
  <text x="208" y="226" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">A</text>
  <text x="312" y="504" text-anchor="middle" fill="#FFFFFF" font-family="${fontForText(
    labelA
  )}" font-size="28" font-weight="700">${escapeXml(labelA)}</text>
  <text x="312" y="540" text-anchor="middle" fill="#34D399" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">${escapeXml(
    subA
  )}</text>

  <!-- Right Fighter Card (Side B) -->
  <rect x="650" y="172" width="476" height="392" rx="28" fill="#23140B" stroke="#F97316" stroke-width="3"/>
  <rect x="750" y="190" width="${PHOTO_SIZE}" height="${PHOTO_SIZE}" rx="${PHOTO_RADIUS}" fill="#7C2D12" stroke="#FB923C" stroke-width="2"/>
  ${
    hasPhotoB
      ? ''
      : `<text x="888" y="364" text-anchor="middle" fill="#FDBA74" font-family="${fontForText(
          labelB
        )}" font-size="110" font-weight="700">${initialB}</text>`
  }
  <rect x="762" y="202" width="44" height="34" rx="10" fill="#EA580C"/>
  <text x="784" y="226" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">B</text>
  <text x="888" y="504" text-anchor="middle" fill="#FFFFFF" font-family="${fontForText(
    labelB
  )}" font-size="28" font-weight="700">${escapeXml(labelB)}</text>
  <text x="888" y="540" text-anchor="middle" fill="#FB923C" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">${escapeXml(
    subB
  )}</text>

  <!-- Center VS Medallion -->
  <circle cx="600" cy="326" r="44" fill="#111315" stroke="url(#vsGrad)" stroke-width="4"/>
  <text x="600" y="338" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="32" font-weight="700">VS</text>

  <!-- Bottom CTA Footer -->
  <text x="600" y="598" text-anchor="middle" fill="#D1D5DB" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">Tap to Vote in 1 Click on BoloSach · bolosach.vercel.app</text>
</svg>`;
}

export async function renderChallengeOgImage(challenge: ChallengePreview | null): Promise<Buffer> {
  if (!challenge) {
    const resvg = new Resvg(buildBrandSvg(), {
      fitTo: { mode: 'width', value: WIDTH },
      font: { fontFiles: FONT_FILES, loadSystemFonts: false },
    });
    return sharp(Buffer.from(resvg.render().asPng()))
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
  }

  if (challenge.type === 'secret_poll') {
    const resvg = new Resvg(buildSecretPollSvg(challenge), {
      fitTo: { mode: 'width', value: WIDTH },
      font: { fontFiles: FONT_FILES, loadSystemFonts: false },
    });
    return sharp(Buffer.from(resvg.render().asPng()))
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
  }

  const [photoA, photoB] = await Promise.all([
    renderRoundedPhoto(challenge.sideAImageUrl, PHOTO_SIZE, PHOTO_RADIUS),
    renderRoundedPhoto(challenge.sideBImageUrl, PHOTO_SIZE, PHOTO_RADIUS),
  ]);

  const svg = buildBattleSvg(challenge, Boolean(photoA), Boolean(photoB));
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false },
  });
  const basePng = Buffer.from(resvg.render().asPng());

  const overlays: Array<{ input: Buffer; left: number; top: number }> = [];
  if (photoA) {
    overlays.push({ input: photoA, left: 174, top: 190 });
  }
  if (photoB) {
    overlays.push({ input: photoB, left: 750, top: 190 });
  }

  if (overlays.length === 0) {
    return sharp(basePng).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  }

  // Re-composite the A/B corner badges on top of the photos cleanly
  const badgeOverlaySvg = Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${
        photoA
          ? '<rect x="186" y="202" width="44" height="34" rx="10" fill="#059669"/><text x="208" y="226" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">A</text>'
          : ''
      }
      ${
        photoB
          ? '<rect x="762" y="202" width="44" height="34" rx="10" fill="#EA580C"/><text x="784" y="226" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans, sans-serif" font-size="20" font-weight="700">B</text>'
          : ''
      }
    </svg>`
  );
  const badgePng = Buffer.from(
    new Resvg(badgeOverlaySvg, {
      fitTo: { mode: 'width', value: WIDTH },
      font: { fontFiles: FONT_FILES, loadSystemFonts: false },
    })
      .render()
      .asPng()
  );

  return sharp(basePng)
    .composite([...overlays, { input: badgePng, left: 0, top: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  try {
    const challengeId = extractChallengeId(req);
    const challenge = challengeId ? await fetchChallengeForPreview(challengeId) : null;
    const imageBuffer = await renderChallengeOgImage(challenge);

    res.status(200);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
    );
    res.send(imageBuffer);
  } catch {
    res.status(500);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send('Unable to generate preview image.');
  }
}
