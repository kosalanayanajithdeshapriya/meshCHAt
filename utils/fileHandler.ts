
/**
 * File handling utilities for BitChat
 * Handles file encryption, validation, compression, and storage
 */

import { encryptMessage, decryptMessage } from './crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'],
    document: ['application/pdf', 'text/plain', 'application/json']
};

export interface ValidationResult {
    valid: boolean;
    error?: string;
    fileType?: 'image' | 'video' | 'audio' | 'document' | 'other';
}

export interface EncryptedFile {
    encryptedData: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnail?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): ValidationResult {
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        };
    }

    let fileType: 'image' | 'video' | 'audio' | 'document' | 'other' = 'other';

    if (ALLOWED_TYPES.image.includes(file.type)) fileType = 'image';
    else if (ALLOWED_TYPES.video.includes(file.type)) fileType = 'video';
    else if (ALLOWED_TYPES.audio.includes(file.type)) fileType = 'audio';
    else if (ALLOWED_TYPES.document.includes(file.type)) fileType = 'document';

    return { valid: true, fileType };
}

/**
 * Generate thumbnail for image files
 */
export async function generateThumbnail(file: File, maxSize: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('Not an image file'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress image if needed
 */
export async function compressImage(file: File, maxSize: number = 1024 * 1024): Promise<File> {
    if (file.size <= maxSize || !file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;
                const ratio = Math.sqrt(maxSize / file.size);

                width *= ratio;
                height *= ratio;

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressed = new File([blob], file.name, { type: file.type });
                        resolve(compressed);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                }, file.type, 0.8);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Convert file to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Convert base64 to File object
 */
export function base64ToFile(base64: string, fileName: string, fileType: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || fileType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
}

/**
 * Encrypt file for secure transmission
 */
export async function encryptFile(
    file: File,
    secret: string,
    channelId: string
): Promise<EncryptedFile> {
    const base64 = await fileToBase64(file);
    const encryptedData = await encryptMessage(base64, secret, channelId);

    let thumbnail: string | undefined;
    if (file.type.startsWith('image/')) {
        try {
            thumbnail = await generateThumbnail(file);
        } catch (e) {
            console.warn('Failed to generate thumbnail', e);
        }
    }

    return {
        encryptedData,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        thumbnail
    };
}

/**
 * Decrypt file for viewing/download
 */
export async function decryptFile(
    encrypted: EncryptedFile,
    secret: string,
    channelId: string
): Promise<File> {
    const decryptedBase64 = await decryptMessage(encrypted.encryptedData, secret, channelId);
    return base64ToFile(decryptedBase64, encrypted.fileName, encrypted.fileType);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('application/pdf')) return '📄';
    if (fileType.startsWith('text/')) return '📝';
    return '📎';
}
