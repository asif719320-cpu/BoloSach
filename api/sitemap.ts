import {
  ApiRequest,
  ApiResponse,
  getOriginFromRequest,
  listPublicChallengeSitemapEntries,
} from './_firestore.js';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CANONICAL_ORIGIN = 'https://bolosach.vercel.app';

function resolveSitemapOrigin(req: ApiRequest): string {
  const origin = getOriginFromRequest(req);
  if (/^https?:\/\/(www\.)?bolosach\.vercel\.app$/i.test(origin)) {
    return CANONICAL_ORIGIN;
  }
  return origin;
}

export default async function handler(
  req: ApiRequest & { method?: string },
  res: ApiResponse
): Promise<void> {
  const origin = resolveSitemapOrigin(req);
  const todayIso = new Date().toISOString().split('T')[0];

  let challengeUrls: string[] = [];
  try {
    const entries = await listPublicChallengeSitemapEntries(200);
    challengeUrls = entries.map((entry) => {
      const lastmod = entry.updateTime ? entry.updateTime.split('T')[0] : todayIso;
      return `  <url>
    <loc>${escapeXml(`${origin}/c/${encodeURIComponent(entry.id)}`)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  } catch {
    challengeUrls = [];
  }

  const urlNodes = [
    `  <url>
    <loc>${escapeXml(`${origin}/`)}</loc>
    <lastmod>${escapeXml(todayIso)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ...challengeUrls,
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=1200');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.send(xml);
}
