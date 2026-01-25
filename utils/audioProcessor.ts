
/**
 * Audio processing utilities for BitChat voice messages
 * Handles recording, waveform generation, compression, and encryption
 */

import { encryptMessage, decryptMessage } from './crypto';

export interface AudioRecording {
    blob: Blob;
    duration: number;
    waveform: number[];
    url: string;
}

export interface EncryptedAudio {
    encryptedData: string;
    duration: number;
    waveform: number[];
}

/**
 * Record audio from user's microphone
 */
export async function recordAudio(): Promise<MediaRecorder> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        return mediaRecorder;
    } catch (error) {
        console.error('Failed to access microphone:', error);
        throw new Error('Microphone access denied. Please allow microphone permissions.');
    }
}

/**
 * Generate waveform data from audio blob
 */
export async function generateWaveform(audioBlob: Blob, samples: number = 50): Promise<number[]> {
    return new Promise((resolve, reject) => {
        const audioContext = new AudioContext();
        const fileReader = new FileReader();

        fileReader.onload = async () => {
            try {
                const arrayBuffer = fileReader.result as ArrayBuffer;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const rawData = audioBuffer.getChannelData(0);
                const blockSize = Math.floor(rawData.length / samples);
                const waveform: number[] = [];

                for (let i = 0; i < samples; i++) {
                    const start = blockSize * i;
                    let sum = 0;

                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(rawData[start + j]);
                    }

                    waveform.push(sum / blockSize);
                }

                // Normalize to 0-1 range
                const max = Math.max(...waveform);
                const normalized = waveform.map(v => v / max);

                resolve(normalized);
            } catch (error) {
                reject(error);
            }
        };

        fileReader.onerror = () => reject(new Error('Failed to read audio file'));
        fileReader.readAsArrayBuffer(audioBlob);
    });
}

/**
 * Compress audio blob (reduce quality for smaller size)
 */
export async function compressAudio(blob: Blob): Promise<Blob> {
    // For WebM/Opus, compression is already good
    // This is a placeholder for future compression logic
    return blob;
}

/**
 * Convert audio blob to base64 string
 */
export async function audioToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert audio to base64'));
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert base64 to audio blob
 */
export function base64ToAudioBlob(base64: string): Blob {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'audio/webm';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
}

/**
 * Encrypt audio for secure transmission
 */
export async function encryptAudio(
    blob: Blob,
    secret: string,
    channelId: string
): Promise<EncryptedAudio> {
    const base64 = await audioToBase64(blob);
    const encryptedData = await encryptMessage(base64, secret, channelId);

    // Generate waveform before encryption
    const waveform = await generateWaveform(blob);

    // Get duration
    const duration = await getAudioDuration(blob);

    return {
        encryptedData,
        duration,
        waveform
    };
}

/**
 * Decrypt audio for playback
 */
export async function decryptAudio(
    encrypted: EncryptedAudio,
    secret: string,
    channelId: string
): Promise<Blob> {
    const decryptedBase64 = await decryptMessage(encrypted.encryptedData, secret, channelId);
    return base64ToAudioBlob(decryptedBase64);
}

/**
 * Get audio duration in seconds
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        const url = URL.createObjectURL(blob);

        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(audio.duration);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load audio'));
        };

        audio.src = url;
    });
}

/**
 * Format duration for display (mm:ss)
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Stop all tracks in a media stream
 */
export function stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
}
