import BACKDROP_URL from '../assets/images/battle_card_backdrop_1795351766501.jpg';
import { Challenge, isValidFirestoreId, LangCode } from '../types/bolosach';

export function buildChallengeShareUrl(challengeId: string): string {
  const origin = window.location.origin;
  if (!isValidFirestoreId(challengeId)) {
    return origin;
  }
  return `${origin}/?c=${encodeURIComponent(challengeId)}`;
}

export function buildWhatsAppShareText(challenge: Challenge, lang: LangCode): string {
  const shareUrl = buildChallengeShareUrl(challenge.id);
  const totalVotes = challenge.votesA + challenge.votesB;
  return lang === 'ur'
    ? challenge.type === 'secret_poll'
      ? `🤫 *BoloSach خفیہ پول*\n"${challenge.title}"\n\nاپنی سچی رائے خفیہ طور پر بھیجیں (نام ظاہر نہیں ہوگا):\n${shareUrl}`
      : `🔥 *BoloSach 1v1 مقابلہ*\n"${challenge.title}"\n\n🟢 ${challenge.sideALabel} (${challenge.votesA}) vs 🟠 ${challenge.sideBLabel} (${challenge.votesB})\nکل ووٹس: ${totalVotes}\n\n1 کلک میں ووٹ دیں:\n${shareUrl}`
    : challenge.type === 'secret_poll'
      ? `🤫 *BoloSach Secret Poll*\n"${challenge.title}"\n\nSend me an anonymous honest reply (100% private):\n${shareUrl}`
      : `🔥 *BoloSach 1v1 Battle*\n"${challenge.title}"\n\n🟢 ${challenge.sideALabel} (${challenge.votesA}) vs 🟠 ${challenge.sideBLabel} (${challenge.votesB})\nTotal votes: ${totalVotes}\n\nVote in 1 click:\n${shareUrl}`;
}

export function getWhatsAppShareHref(challenge: Challenge, lang: LangCode): string {
  const encoded = encodeURIComponent(buildWhatsAppShareText(challenge, lang));
  const isMobile =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile
    ? `whatsapp://send?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}

export function openWhatsAppShare(challenge: Challenge, lang: LangCode): void {
  const href = getWhatsAppShareHref(challenge, lang);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

export async function downloadShareCardImage(challenge: Challenge): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // High-DPI Paper Canvas
  ctx.fillStyle = '#F7F7F4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Backdrop failed'));
      img.src = BACKDROP_URL;
    });
    ctx.globalAlpha = 0.65;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  } catch {
    const grad = ctx.createLinearGradient(0, 0, 1440, 1440);
    grad.addColorStop(0, '#ECFDF5');
    grad.addColorStop(1, '#FFF7ED');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1440, 1440);
  }

  // Outer Studio Frame with soft elevation
  ctx.save();
  ctx.shadowColor = 'rgba(17, 19, 21, 0.12)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(96, 120, 1248, 1200, 48);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#E5E5E0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(96, 120, 1248, 1200, 48);
  ctx.stroke();

  // Top Accent Bar (Emerald -> Coral gradient)
  const accentGrad = ctx.createLinearGradient(96, 0, 1344, 0);
  accentGrad.addColorStop(0, '#059669');
  accentGrad.addColorStop(1, '#EA580C');
  ctx.fillStyle = accentGrad;
  ctx.beginPath();
  ctx.roundRect(176, 188, 180, 10, 5);
  ctx.fill();

  // Brand Header
  ctx.fillStyle = '#111315';
  ctx.font = '800 48px "Outfit", sans-serif';
  ctx.fillText('BoloSach', 176, 260);

  ctx.fillStyle = '#6B7280';
  ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`@${challenge.creatorHandle} · ${challenge.category.toUpperCase()}`, 176, 314);

  // Title
  ctx.fillStyle = '#111315';
  ctx.font = '800 68px "Outfit", sans-serif';
  const afterTitleY = wrapText(ctx, challenge.title, 176, 450, 1088, 88);

  const totalVotes = challenge.votesA + challenge.votesB;
  const pctA = totalVotes > 0 ? Math.round((challenge.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  if (challenge.type === 'secret_poll') {
    const boxY = Math.max(afterTitleY + 56, 700);
    ctx.fillStyle = '#111315';
    ctx.beginPath();
    ctx.roundRect(176, boxY, 1088, 300, 32);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 44px "Outfit", sans-serif';
    ctx.fillText('Send an anonymous honest truth', 240, boxY + 120);

    ctx.fillStyle = '#34D399';
    ctx.font = '700 36px "JetBrains Mono", monospace';
    ctx.fillText(`${challenge.responseCount} truths received`, 240, boxY + 204);
  } else {
    const barY = Math.max(afterTitleY + 72, 720);
    // Side A
    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.roundRect(176, barY, 1088, 148, 28);
    ctx.fill();
    ctx.fillStyle = '#A7F3D0';
    ctx.beginPath();
    ctx.roundRect(176, barY, Math.max(80, (1088 * pctA) / 100), 148, 28);
    ctx.fill();

    ctx.fillStyle = '#064E3B';
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(challenge.sideALabel, 224, barY + 90);
    ctx.font = '700 46px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${pctA}%`, 1216, barY + 90);
    ctx.textAlign = 'left';

    // Side B
    ctx.fillStyle = '#FFF7ED';
    ctx.beginPath();
    ctx.roundRect(176, barY + 184, 1088, 148, 28);
    ctx.fill();
    ctx.fillStyle = '#FED7AA';
    ctx.beginPath();
    ctx.roundRect(176, barY + 184, Math.max(80, (1088 * pctB) / 100), 148, 28);
    ctx.fill();

    ctx.fillStyle = '#7C2D12';
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(challenge.sideBLabel, 224, barY + 274);
    ctx.font = '700 46px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${pctB}%`, 1216, barY + 274);
    ctx.textAlign = 'left';
  }

  // Footer CTA
  ctx.fillStyle = '#4B5563';
  ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Vote in 1 click on BoloSach · Share on WhatsApp Status', 176, 1236);

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = `bolosach-hd-${challenge.id.slice(0, 8)}.png`;
  link.href = dataUrl;
  link.click();
}
