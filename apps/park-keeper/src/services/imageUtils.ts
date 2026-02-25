/**
 * Image Compression Service
 * Handles resizing and compression of images using Canvas API.
 */

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageError';
  }
}

export const validateImage = (file: File): void => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new ImageError(`File size too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
  }
};

export const compressImage = async (
  file: File,
  maxWidth = 1024,
  quality = 0.7,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      validateImage(file);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new ImageError('Browser does not support canvas operations.');
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };

      img.onerror = () => reject(new ImageError('Failed to load image.'));
    };

    reader.onerror = () => reject(new ImageError('Failed to read file.'));
  });
};
