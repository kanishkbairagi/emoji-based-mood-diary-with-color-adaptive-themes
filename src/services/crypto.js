/**
 * Zero-Knowledge Client-Side Cryptographic Service
 * Implemented using W3C Web Crypto API (SubtleCrypto)
 * Standard: AES-256-GCM authenticated encryption with PBKDF2-SHA256 key derivation.
 */

// Converts ArrayBuffer to Base64 string
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Converts Base64 string to ArrayBuffer
function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user password and cryptographic salt
 * Uses PBKDF2 with 100,000 iterations of SHA-256
 */
export async function deriveKeyFromPassword(password, saltHex) {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  // Import raw password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Convert salt hex to byte array
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  // Derive AES-GCM 256-bit key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Non-exportable key for security in-memory
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext journal text using AES-256-GCM
 * Generates an unpredictable 12-byte IV per encryption
 * Returns { ciphertext, iv, authTag }
 */
export async function encryptJournalText(plainText, cryptoKey) {
  if (!plainText) {
    return { ciphertext: '', iv: '', authTag: '' };
  }

  const enc = new TextEncoder();
  const dataBuffer = enc.encode(plainText);

  // 12-byte initialization vector recommended for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // SubtleCrypto AES-GCM appends the 16-byte authentication tag to the ciphertext buffer
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    dataBuffer
  );

  // Split ciphertext and 16-byte auth tag
  const totalLength = encryptedBuffer.byteLength;
  const tagLength = 16;
  const ciphertextBytes = encryptedBuffer.slice(0, totalLength - tagLength);
  const tagBytes = encryptedBuffer.slice(totalLength - tagLength);

  return {
    ciphertext: bufferToBase64(ciphertextBytes),
    authTag: bufferToBase64(tagBytes),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the derived CryptoKey
 * Reconstructs ciphertext + authTag buffer before invoking SubtleCrypto.decrypt
 */
export async function decryptJournalText(ciphertextBase64, ivBase64, authTagBase64, cryptoKey) {
  if (!ciphertextBase64 || !cryptoKey) return '';

  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const tagBuffer = base64ToBuffer(authTagBase64);
    const ivBuffer = base64ToBuffer(ivBase64);

    // Recombine ciphertext and auth tag for Web Crypto AES-GCM
    const combinedBuffer = new Uint8Array(ciphertextBuffer.byteLength + tagBuffer.byteLength);
    combinedBuffer.set(new Uint8Array(ciphertextBuffer), 0);
    combinedBuffer.set(new Uint8Array(tagBuffer), ciphertextBuffer.byteLength);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuffer), tagLength: 128 },
      cryptoKey,
      combinedBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('[Crypto] Decryption failed - possible tampering or incorrect key:', err);
    return '[Encrypted Entry - Key Required]';
  }
}
