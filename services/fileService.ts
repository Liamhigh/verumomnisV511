/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Calculates the SHA-512 hash of a file.
 * @param file The file to hash.
 * @returns A promise that resolves with the hex-encoded SHA-512 hash string.
 */
export async function calculateSHA512(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Reads the content of a file as a string.
 * This is a simplified reader for demonstration; it works best for text-based files.
 * @param file The file to read.
 * @returns A promise that resolves with the file's text content.
 */
export function readTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
}
