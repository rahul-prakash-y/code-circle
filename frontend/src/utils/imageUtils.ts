/**
 * Cloudinary Auto-Optimization Helper
 * Injects responsive width, auto format, and auto quality into Cloudinary image delivery URLs.
 * Avoids duplicate transforms if already present.
 */

export function getOptimizedImageUrl(url?: string | null, width = 200): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Only transform Cloudinary URLs with /image/upload/
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const transform = `f_auto,q_auto,w_${width},c_limit`;

  // Avoid duplicate transforms if this exact transform is already present
  if (url.includes(`/upload/${transform}/`)) {
    return url;
  }

  // If already contains an f_auto/q_auto transformation segment right after /upload/, update with new width
  const existingTransformRegex = /\/image\/upload\/(?:f_auto,q_auto,[^/]+\/)/;
  if (existingTransformRegex.test(url)) {
    return url.replace(existingTransformRegex, `/image/upload/${transform}/`);
  }

  // Inject transformation right after /image/upload/
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}

export default getOptimizedImageUrl;
