import { describe, expect, it } from 'vitest';
import { IMAGE_UPLOAD, checkImageFile, imageSizeNote } from './upload';

describe('image upload rules (WM image checks)', () => {
  it('valid: jpg / png / webp up to 4 MB', () => {
    expect(checkImageFile({ type: 'image/png', size: 1024 })).toBeNull();
    expect(checkImageFile({ type: 'image/webp', size: IMAGE_UPLOAD.maxBytes })).toBeNull();
  });

  it('invalid size: one byte over 4 MB is refused', () => {
    expect(checkImageFile({ type: 'image/jpeg', size: IMAGE_UPLOAD.maxBytes + 1 })).toBe('size');
  });

  it('invalid type: gif, svg and text are refused', () => {
    expect(checkImageFile({ type: 'image/gif', size: 10 })).toBe('type');
    expect(checkImageFile({ type: 'image/svg+xml', size: 10 })).toBe('type');
    expect(checkImageFile({ type: 'text/plain', size: 10 })).toBe('type');
  });

  it('dimensions: 800×800 gets no note; any other size gets one (recommended, not required)', () => {
    expect(imageSizeNote({ width: 800, height: 800 })).toBeNull();
    expect(imageSizeNote({ width: 1200, height: 600 })).toContain('정사각형이 아님');
    expect(imageSizeNote({ width: 400, height: 400 })).toContain('권장 크기(800×800px)');
    expect(imageSizeNote({ width: 400, height: 400 })).not.toContain('정사각형이 아님');
  });
});
