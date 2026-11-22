import { sanitizeSideImage } from '../types/bolosach';

const MAX_OUTPUT_CHARS = 62000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error('Invalid image dimensions.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };
    img.src = objectUrl;
  });
}

function renderSquareDataUrl(
  img: HTMLImageElement,
  size: number,
  mime: 'image/webp' | 'image/jpeg',
  quality: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const minSide = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.max(0, (img.naturalWidth - minSide) / 2);
  const sy = Math.max(0, (img.naturalHeight - minSide) / 2);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

  return canvas.toDataURL(mime, quality);
}

export async function compressSideImageFile(file: File): Promise<string> {
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose a valid photo (JPG, PNG, or WebP).');
  }

  const img = await loadImageFromFile(file);

  const attempts: Array<{ size: number; mime: 'image/webp' | 'image/jpeg'; quality: number }> = [
    { size: 360, mime: 'image/webp', quality: 0.78 },
    { size: 360, mime: 'image/webp', quality: 0.64 },
    { size: 320, mime: 'image/jpeg', quality: 0.72 },
    { size: 280, mime: 'image/jpeg', quality: 0.58 },
    { size: 220, mime: 'image/jpeg', quality: 0.5 },
  ];

  for (const attempt of attempts) {
    const raw = renderSquareDataUrl(img, attempt.size, attempt.mime, attempt.quality);
    if (raw && raw.length <= MAX_OUTPUT_CHARS) {
      const safe = sanitizeSideImage(raw);
      if (safe) return safe;
    }
  }

  throw new Error('Photo is too detailed. Please try another picture.');
}
