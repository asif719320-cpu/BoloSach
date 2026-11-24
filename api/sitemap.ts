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

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const origin = getOriginFromRequest(req);
  const entries = await listPublicChallengeSitemapEntries(200);
  const todayIso = new Date().toISOString().split('T')[0];

  const challengeUrls = entries
    .map((entry) => {
      const lastmod = entry.updateTime ? entry.updateTime.split('T')[0] : todayIso;
      return `  <url>
    <loc>${escapeXml(`${origin}/c/${encodeURIComponent(entry.id)}`)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(`${origin}/`)}</loc>
    <lastmod>${escapeXml(todayIso)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${challengeUrls}
</urlset>`;

  res.status(200);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=1200');
  res.send(xml);
}
