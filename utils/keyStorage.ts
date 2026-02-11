
/**
 * Secure key storage using IndexedDB for EncHAT encryption keys.
 * Stores CryptoKey objects securely in the browser's IndexedDB.
 */

const DB_NAME = 'enchat_keystore';
const DB_VERSION = 1;
const STORE_NAME = 'encryption_keys';

interface StoredKey {
    channelId: string;
    key: CryptoKey;
    createdAt: number;
    version: number;
}

class KeyStorage {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'channelId' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    async storeKey(channelId: string, key: CryptoKey): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const storedKey: StoredKey = {
                channelId,
                key,
                createdAt: Date.now(),
                version: 1
            };

            const request = store.put(storedKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async retrieveKey(channelId: string): Promise<CryptoKey | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(channelId);

            request.onsuccess = () => {
                const result = request.result as StoredKey | undefined;
                resolve(result?.key || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteKey(channelId: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(channelId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllKeys(): Promise<StoredKey[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async exportKeyBackup(channelId: string, password: string): Promise<string> {
        const key = await this.retrieveKey(channelId);
        if (!key) throw new Error('Key not found');

        // Export key as JWK
        const jwk = await crypto.subtle.exportKey('jwk', key);

        // Encrypt JWK with password
        const enc = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            enc.encode(password.padEnd(32, '0').slice(0, 32)),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: enc.encode('backup-salt-' + channelId),
                iterations: 100000,
                hash: 'SHA-256',
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            derivedKey,
            enc.encode(JSON.stringify(jwk))
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    async importKeyBackup(channelId: string, backup: string, password: string): Promise<void> {
        const enc = new TextEncoder();

        // Decrypt backup
        const combined = new Uint8Array(
            atob(backup).split('').map(c => c.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const passwordKey = await crypto.subtle.importKey(
            'raw',
            enc.encode(password.padEnd(32, '0').slice(0, 32)),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: enc.encode('backup-salt-' + channelId),
                iterations: 100000,
                hash: 'SHA-256',
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            derivedKey,
            data
        );

        const jwk = JSON.parse(new TextDecoder().decode(decrypted));

        // Import key
        const key = await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        await this.storeKey(channelId, key);
    }
}

export const keyStorage = new KeyStorage();
