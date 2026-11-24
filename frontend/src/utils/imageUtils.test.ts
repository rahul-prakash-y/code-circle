import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getOptimizedImageUrl } from './imageUtils.ts';

describe('getOptimizedImageUrl', () => {
  test('returns empty string for null or undefined or empty', () => {
    assert.equal(getOptimizedImageUrl(''), '');
    assert.equal(getOptimizedImageUrl(null as any), '');
    assert.equal(getOptimizedImageUrl(undefined as any), '');
  });

  test('returns non-cloudinary URLs untouched', () => {
    const url = 'https://example.com/avatar.png';
    assert.equal(getOptimizedImageUrl(url, 160), url);
  });

  test('injects f_auto,q_auto,w_${width},c_limit after /image/upload/', () => {
    const rawUrl = 'https://res.cloudinary.com/codecircle/image/upload/v1700000000/avatars/user123.jpg';
    const optimized = getOptimizedImageUrl(rawUrl, 160);
    assert.equal(
      optimized,
      'https://res.cloudinary.com/codecircle/image/upload/f_auto,q_auto,w_160,c_limit/v1700000000/avatars/user123.jpg'
    );
  });

  test('uses default width of 200 when not specified', () => {
    const rawUrl = 'https://res.cloudinary.com/codecircle/image/upload/v1700000000/avatars/user123.jpg';
    const optimized = getOptimizedImageUrl(rawUrl);
    assert.equal(
      optimized,
      'https://res.cloudinary.com/codecircle/image/upload/f_auto,q_auto,w_200,c_limit/v1700000000/avatars/user123.jpg'
    );
  });

  test('avoids duplicate transformations when called multiple times with same width', () => {
    const rawUrl = 'https://res.cloudinary.com/codecircle/image/upload/v1700000000/avatars/user123.jpg';
    const step1 = getOptimizedImageUrl(rawUrl, 160);
    const step2 = getOptimizedImageUrl(step1, 160);
    assert.equal(step1, step2);
  });

  test('updates width without duplicating when called with different width', () => {
    const url160 = 'https://res.cloudinary.com/codecircle/image/upload/f_auto,q_auto,w_160,c_limit/v1700000000/avatars/user123.jpg';
    const url300 = getOptimizedImageUrl(url160, 300);
    assert.equal(
      url300,
      'https://res.cloudinary.com/codecircle/image/upload/f_auto,q_auto,w_300,c_limit/v1700000000/avatars/user123.jpg'
    );
  });

  test('compresses raw 2MB Cloudinary PNGs into auto-formatted 200px width', () => {
    const rawPng = 'https://res.cloudinary.com/codecircle/image/upload/v1700000000/bearers/large-avatar.png';
    const compressed = getOptimizedImageUrl(rawPng, 200);
    assert.equal(
      compressed,
      'https://res.cloudinary.com/codecircle/image/upload/f_auto,q_auto,w_200,c_limit/v1700000000/bearers/large-avatar.png'
    );
  });
});
