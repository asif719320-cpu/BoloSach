import {
  ApiRequest,
  ApiResponse,
  extractChallengeId,
  fetchChallengeForPreview,
  getOriginFromRequest,
} from './_firestore.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const origin = getOriginFromRequest(req);
  const challengeId = extractChallengeId(req);
  const challenge = challengeId ? await fetchChallengeForPreview(challengeId) : null;

  const shareUrl = challengeId
    ? `${origin}/c/${encodeURIComponent(challengeId)}`
    : `${origin}/`;
  const spaTargetUrl = challengeId
    ? `${origin}/?c=${encodeURIComponent(challengeId)}`
    : `${origin}/`;

  let title = 'BoloSach — 1v1 Friend Battles & Secret Polls';
  let description =
    'Viral 1v1 friend battles, honest group polls, and anonymous secret Q&A with instant WhatsApp sharing.';
  let imageUrl = `${origin}/pwa-512x512.png`;
  let imageType = 'image/png';
  let imageWidth = '512';
  let imageHeight = '512';

  if (challenge) {
    const totalVotes = challenge.votesA + challenge.votesB;
    if (challenge.type === 'secret_poll') {
      title = `${challenge.title} | BoloSach Secret Poll`;
      description = `Send an anonymous honest reply to @${challenge.creatorHandle} on BoloSach (${challenge.responseCount} replies so far).`;
    } else {
      title = `${challenge.sideALabel} vs ${challenge.sideBLabel} — ${challenge.title} | BoloSach`;
      description = `Vote in 1 click: ${challenge.sideALabel} (${challenge.votesA}) vs ${challenge.sideBLabel} (${challenge.votesB}). Total votes: ${totalVotes}.`;
    }

    const versionTag = encodeURIComponent(
      challenge.updateTime || `${challenge.sideAImageUrl ? 'a' : ''}${challenge.sideBImageUrl ? 'b' : ''}${totalVotes}`
    );
    imageUrl = `${origin}/api/og?c=${encodeURIComponent(challenge.id)}&v=${versionTag}`;
    imageType = 'image/jpeg';
    imageWidth = '1200';
    imageHeight = '630';
  }

  const isIndexable = Boolean(
    challenge && challenge.visibility === 'public' && challenge.type !== 'secret_poll'
  );
  const robotsContent = isIndexable
    ? 'index, follow, max-image-preview:large, max-snippet:-1'
    : 'noindex, nofollow';

  const html = `<!doctype html>
<html lang="${challenge?.lang === 'ur' ? 'ur' : 'en'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${robotsContent}" />
    <link rel="canonical" href="${escapeHtml(shareUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="BoloSach" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="${imageWidth}" />
    <meta property="og:image:height" content="${imageHeight}" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    ${
      isIndexable
        ? `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            description,
            url: shareUrl,
            image: imageUrl,
            isPartOf: {
              '@type': 'WebSite',
              name: 'BoloSach',
              url: origin,
            },
          }).replace(/</g, '\\u003c')}</script>`
        : ''
    }
    <script>
      if (!/bot|crawl|spider|facebookexternalhit|facebot|meta-externalagent|facebookcatalog|whatsapp|twitterbot|telegrambot|discordbot|linkedinbot|slackbot|pinterest|applebot|embedly|vkshare|snapchat/i.test(navigator.userAgent)) {
        window.location.replace(${JSON.stringify(spaTargetUrl)});
      }
    </script>
  </head>
  <body style="font-family: system-ui, sans-serif; background:#091114; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:24px; text-align:center;">
    <main style="max-width:520px;">
      <h1 style="font-size:24px; margin-bottom:12px;">${escapeHtml(title)}</h1>
      <p style="color:#d1d5db; font-size:15px; line-height:1.5; margin-bottom:20px;">${escapeHtml(description)}</p>
      <a href="${escapeHtml(spaTargetUrl)}" style="display:inline-block; background:#059669; color:#fff; text-decoration:none; font-weight:700; padding:12px 24px; border-radius:12px;">Open &amp; Vote on BoloSach</a>
    </main>
  </body>
</html>`;

  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
  );
  res.send(html);
}
