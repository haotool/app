import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { APP_MANIFEST } from '../app-info';
import { GUIDE_HOW_TO_STEPS } from '../seo-metadata/core';

describe('public image metadata', () => {
  it('matches each manifest screenshot size to its actual image', async () => {
    for (const screenshot of APP_MANIFEST.screenshots) {
      const image = await sharp(resolve('public', screenshot.src)).metadata();
      expect(`${image.width}x${image.height}`, screenshot.src).toBe(screenshot.sizes);
      expect(image.format, screenshot.src).toBe('png');
    }
  });

  it.each(['og-image.jpg', 'twitter-image.jpg'])('%s matches the social metadata', async (file) => {
    const image = await sharp(resolve('public', file)).metadata();
    expect([image.width, image.height, image.format]).toEqual([1200, 630, 'jpeg']);
  });

  it('references existing screenshots for the guide steps', async () => {
    for (const step of GUIDE_HOW_TO_STEPS) {
      if ('image' in step) {
        const image = await sharp(resolve('public', `.${step.image}`)).metadata();
        expect(image.format, step.name).toBe('png');
      }
    }
  });
});
