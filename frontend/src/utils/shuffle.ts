/**
 * Cryptographically secure Fisher-Yates array shuffling utility for browser environments.
 * Uses window.crypto.getRandomValues for unbiased, unpredictable distribution.
 *
 * @param array The array to shuffle
 * @returns A new shuffled copy of the array
 */
export function secureShuffle<T>(array: T[]): T[] {
  if (!Array.isArray(array) || array.length <= 1) {
    return Array.isArray(array) ? [...array] : [];
  }

  const shuffled = [...array];
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;

  for (let i = shuffled.length - 1; i > 0; i--) {
    let j: number;
    if (cryptoObj && cryptoObj.getRandomValues) {
      const randomBuffer = new Uint32Array(1);
      cryptoObj.getRandomValues(randomBuffer);
      j = Math.floor((randomBuffer[0] / (0xffffffff + 1)) * (i + 1));
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export default secureShuffle;
