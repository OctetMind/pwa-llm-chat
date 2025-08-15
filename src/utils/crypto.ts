export async function encrypt(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV is 12 bytes

  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    new TextEncoder().encode(text)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(encryptedArray, salt.length + iv.length);

  return btoa(String.fromCharCode(...result));
}

export async function decrypt(encryptedText: string, password: string): Promise<string> {
  const data = atob(encryptedText);
  const dataArray = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    dataArray[i] = data.charCodeAt(i);
  }

  const salt = dataArray.slice(0, 16);
  const iv = dataArray.slice(16, 16 + 12);
  const encrypted = dataArray.slice(16 + 12);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // Recommended iterations for PBKDF2
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 }, // 256-bit key
    true,
    ['encrypt', 'decrypt']
  );
}