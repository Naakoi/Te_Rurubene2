// frontend/src/lib/offlineStorage.ts

const DB_NAME = 'RurubeneOfflineDB';
const DB_VERSION = 1;
const TRACKS_STORE = 'encrypted_tracks';
const KEYS_STORE = 'security_keys';

// ── IndexedDB Helpers ──
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not available'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE);
      }
      if (!db.objectStoreNames.contains(KEYS_STORE)) {
        db.createObjectStore(KEYS_STORE);
      }
    };
  });
}

// ── Web Crypto API Key Management ──
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const db = await getDB();
  
  return new Promise(async (resolve, reject) => {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return reject(new Error('Web Crypto API (subtle) not available.'));
    }

    // Try to get existing key
    const transaction = db.transaction(KEYS_STORE, 'readonly');
    const store = transaction.objectStore(KEYS_STORE);
    const getReq = store.get('master_key');
    
    getReq.onsuccess = async () => {
      if (getReq.result) {
        resolve(getReq.result);
      } else {
        // Generate a new key if it doesn't exist
        try {
          const newKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false, // Cannot be extracted!
            ['encrypt', 'decrypt']
          );
          
          const writeTx = db.transaction(KEYS_STORE, 'readwrite');
          const writeStore = writeTx.objectStore(KEYS_STORE);
          const putReq = writeStore.put(newKey, 'master_key');
          
          putReq.onsuccess = () => resolve(newKey);
          putReq.onerror = () => reject(putReq.error);
        } catch (e) {
          reject(e);
        }
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ── Fallback Key String Management ──
async function getOrCreateFallbackKey(): Promise<string> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(KEYS_STORE, 'readonly');
    const store = transaction.objectStore(KEYS_STORE);
    const getReq = store.get('fallback_key');
    
    getReq.onsuccess = () => {
      if (getReq.result) {
        resolve(getReq.result);
      } else {
        // Generate a random key string
        const array = new Uint8Array(32);
        if (typeof window !== 'undefined' && window.crypto) {
          window.crypto.getRandomValues(array);
        } else {
          for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
        }
        const newKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        const writeTx = db.transaction(KEYS_STORE, 'readwrite');
        const writeStore = writeTx.objectStore(KEYS_STORE);
        const putReq = writeStore.put(newKey, 'fallback_key');
        
        putReq.onsuccess = () => resolve(newKey);
        putReq.onerror = () => reject(putReq.error);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ── RC4 Stream Cipher Scrambler ──
function rc4Scramble(buffer: ArrayBuffer, keyStr: string): ArrayBuffer {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + keyStr.charCodeAt(i % keyStr.length)) % 256;
    // swap
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  
  const input = new Uint8Array(buffer);
  const output = new Uint8Array(buffer.byteLength);
  let i = 0;
  j = 0;
  for (let offset = 0; offset < input.length; offset++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    // swap
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    const k = s[(s[i] + s[j]) % 256];
    output[offset] = input[offset] ^ k;
  }
  return output.buffer;
}

export function makeUrlRelative(url: string): string {
  try {
    const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
    
    // If it's the same domain/IP or localhost, make it relative to bypass CORS
    const isSameHost = 
      parsedUrl.hostname === '91.99.89.94' || 
      parsedUrl.hostname === 'localhost' || 
      parsedUrl.hostname === '127.0.0.1' ||
      (typeof window !== 'undefined' && parsedUrl.hostname === window.location.hostname);

    if (isSameHost) {
      return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    } else {
      // Cross-origin: route through Next.js /media-proxy (NOT /api/ — Nginx sends /api/* to Laravel)
      return `/media-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch (e) {
    // If URL parsing fails, it's likely already relative
  }
  return url;
}

// ── Download & Encrypt ──
export async function downloadTrackOffline(trackId: number, initialUrl: string): Promise<void> {
  let url = makeUrlRelative(initialUrl);

  // Resolve true stream URL if it's an API endpoint (similar to AudioPlayer logic)
  if (!url.endsWith('.m3u8') && !url.includes('.mp3') && !url.includes('.mp4')) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        url = makeUrlRelative(data.stream_url || url);
      }
    } catch (e) {
      console.warn('Failed to resolve stream URL for offline download', e);
    }
  }

  // 1. Fetch the raw audio buffer
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });
  } catch (err: any) {
    throw new Error(`Failed to fetch URL: ${url} (${err.message})`);
  }

  if (!response.ok) {
    let errMsg = `Server returned status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errMsg = errJson.error;
      }
    } catch (e) {}
    throw new Error(`Failed to fetch: ${errMsg} for URL: ${url}`);
  }
  const buffer = await response.arrayBuffer();

  // 2. Encrypt/Scramble the buffer
  let storedData: any = null;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const key = await getOrCreateEncryptionKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        buffer
      );
      storedData = { iv, data: encryptedBuffer, version: 'v1' };
    } catch (e) {
      console.warn('AES-GCM encryption failed, falling back to RC4', e);
    }
  }

  if (!storedData) {
    // Fallback encryption (RC4)
    const key = await getOrCreateFallbackKey();
    const encryptedBuffer = rc4Scramble(buffer, key);
    storedData = { data: encryptedBuffer, version: 'rc4' };
  }

  // 3. Store the encrypted data in IndexedDB
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.put(storedData, trackId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Retrieve & Decrypt ──
export async function getOfflineTrackBlobUrl(trackId: number): Promise<string | null> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKS_STORE, 'readonly');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.get(trackId);
    
    req.onsuccess = async () => {
      const record = req.result;
      if (!record) {
        resolve(null);
        return;
      }
      
      try {
        let decryptedBuffer: ArrayBuffer;
        
        if (record.version === 'rc4') {
          const key = await getOrCreateFallbackKey();
          decryptedBuffer = rc4Scramble(record.data, key);
        } else {
          // Standard AES-GCM (record.version === 'v1' or undefined/older downloads)
          const key = await getOrCreateEncryptionKey();
          decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: record.iv },
            key,
            record.data
          );
        }
        
        // Create an in-memory blob URL for the player
        const blob = new Blob([decryptedBuffer], { type: 'audio/mpeg' });
        resolve(URL.createObjectURL(blob));
      } catch (e) {
        console.error('Decryption failed', e);
        reject(e);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ── Check if Track is Offline ──
export async function isTrackOffline(trackId: number): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(TRACKS_STORE, 'readonly');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.count(trackId);
    req.onsuccess = () => resolve(req.result > 0);
    req.onerror = () => resolve(false);
  });
}

// ── Remove Track from Offline Storage ──
export async function removeTrackOffline(trackId: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.delete(trackId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
