import { ImageError, validateImage, compressImage } from '../imageUtils';

describe('imageUtils', () => {
  describe('ImageError', () => {
    it('should be an instance of Error with name ImageError', () => {
      const err = new ImageError('test message');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ImageError);
      expect(err.name).toBe('ImageError');
      expect(err.message).toBe('test message');
    });
  });

  describe('validateImage', () => {
    it('should accept JPEG', () => {
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should accept PNG', () => {
      const file = new File(['x'], 'test.png', { type: 'image/png' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should accept WebP', () => {
      const file = new File(['x'], 'test.webp', { type: 'image/webp' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should reject non-image types (text/plain)', () => {
      const file = new File(['x'], 'test.txt', { type: 'text/plain' });
      expect(() => validateImage(file)).toThrow(ImageError);
      expect(() => validateImage(file)).toThrow(
        'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      );
    });

    it('should reject non-image types (application/pdf)', () => {
      const file = new File(['x'], 'test.pdf', { type: 'application/pdf' });
      expect(() => validateImage(file)).toThrow(ImageError);
      expect(() => validateImage(file)).toThrow(
        'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      );
    });

    it('should reject files over 10MB', () => {
      const tenMB = 10 * 1024 * 1024;
      const file = new File([new ArrayBuffer(tenMB + 1)], 'large.jpg', {
        type: 'image/jpeg',
      });
      expect(() => validateImage(file)).toThrow(ImageError);
      expect(() => validateImage(file)).toThrow(/File size too large/);
      expect(() => validateImage(file)).toThrow(/Max 10MB allowed/);
    });

    it('should accept files under 10MB', () => {
      const file = new File(['x'], 'small.jpg', { type: 'image/jpeg' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should accept files exactly at 10MB boundary', () => {
      const tenMB = 10 * 1024 * 1024;
      const file = new File([new ArrayBuffer(tenMB)], 'boundary.jpg', {
        type: 'image/jpeg',
      });
      expect(() => validateImage(file)).not.toThrow();
    });
  });

  describe('compressImage', () => {
    it('should reject invalid file types', async () => {
      const file = new File(['x'], 'test.txt', { type: 'text/plain' });
      await expect(compressImage(file)).rejects.toThrow(ImageError);
      await expect(compressImage(file)).rejects.toThrow(
        'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      );
    });

    it('should reject files over 10MB', async () => {
      const tenMB = 10 * 1024 * 1024;
      const file = new File([new ArrayBuffer(tenMB + 1)], 'large.jpg', {
        type: 'image/jpeg',
      });
      await expect(compressImage(file)).rejects.toThrow(ImageError);
      await expect(compressImage(file)).rejects.toThrow(/File size too large/);
    });

    it('should compress a valid JPEG and return a data URL', async () => {
      const pixel = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const file = new File([pixel], 'photo.jpg', { type: 'image/jpeg' });

      const OriginalImage = globalThis.Image;
      class MockImage {
        width = 100;
        height = 100;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      }
      globalThis.Image = MockImage as unknown as typeof Image;

      const mockCanvas = document.createElement('canvas');
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas;
        return document.createElement(tag);
      });
      vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,compressed');

      const result = await compressImage(file);
      expect(result).toBe('data:image/jpeg;base64,compressed');

      globalThis.Image = OriginalImage;
      vi.restoreAllMocks();
    });

    it('should resize images wider than maxWidth', async () => {
      const pixel = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const file = new File([pixel], 'wide.jpg', { type: 'image/jpeg' });

      const OriginalImage = globalThis.Image;
      class MockImage {
        width = 2048;
        height = 1024;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      }
      globalThis.Image = MockImage as unknown as typeof Image;

      const mockCanvas = document.createElement('canvas');
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas;
        return document.createElement(tag);
      });
      vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,resized');

      const result = await compressImage(file, 512);
      expect(result).toBe('data:image/jpeg;base64,resized');
      expect(mockCanvas.width).toBe(512);
      expect(mockCanvas.height).toBe(256);

      globalThis.Image = OriginalImage;
      vi.restoreAllMocks();
    });

    it('should handle canvas getContext returning null', async () => {
      const file = new File([new Uint8Array([0xff])], 'photo.jpg', { type: 'image/jpeg' });

      const OriginalImage = globalThis.Image;
      class MockImage {
        width = 100;
        height = 100;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      }
      globalThis.Image = MockImage as unknown as typeof Image;

      const mockCanvas = document.createElement('canvas');
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas;
        return document.createElement(tag);
      });
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

      await expect(compressImage(file)).rejects.toThrow(
        'Browser does not support canvas operations.',
      );

      globalThis.Image = OriginalImage;
      vi.restoreAllMocks();
    });

    it('should handle image load error', async () => {
      const file = new File([new Uint8Array([0xff])], 'bad.jpg', { type: 'image/jpeg' });

      const OriginalImage = globalThis.Image;
      class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onerror?.(), 0);
        }
      }
      globalThis.Image = MockImage as unknown as typeof Image;

      await expect(compressImage(file)).rejects.toThrow('Failed to load image.');

      globalThis.Image = OriginalImage;
    });

    it('should handle FileReader error', async () => {
      const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

      const originalFileReader = globalThis.FileReader;
      class FailReader {
        result: string | ArrayBuffer | null = null;
        onerror: (() => void) | null = null;
        onload: (() => void) | null = null;
        readAsDataURL() {
          setTimeout(() => this.onerror?.(), 0);
        }
      }
      globalThis.FileReader = FailReader as unknown as typeof FileReader;

      await expect(compressImage(file)).rejects.toThrow('Failed to read file.');

      globalThis.FileReader = originalFileReader;
    });
  });
});
