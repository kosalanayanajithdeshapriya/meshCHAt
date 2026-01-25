
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send, X, Trash2 } from 'lucide-react';
import { recordAudio, generateWaveform, getAudioDuration, formatDuration, stopMediaStream } from '../utils/audioProcessor';

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob, duration: number, waveform: number[]) => void;
    onCancel: () => void;
    disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onSend,
    onCancel,
    disabled = false
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [duration, setDuration] = useState(0);
    const [waveform, setWaveform] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) stopMediaStream(streamRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            audioChunksRef.current = [];
            const mediaRecorder = await recordAudio();
            mediaRecorderRef.current = mediaRecorder;
            streamRef.current = mediaRecorder.stream;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setRecordedBlob(audioBlob);

                // Generate waveform
                const waveformData = await generateWaveform(audioBlob);
                setWaveform(waveformData);

                // Stop timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // Cleanup stream
                if (streamRef.current) {
                    stopMediaStream(streamRef.current);
                    streamRef.current = null;
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerRef.current = window.setInterval(() => {
                setDuration(prev => prev + 0.1);
            }, 100);
        } catch (error) {
            console.error('Recording failed:', error);
            alert('Failed to start recording. Please check microphone permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                // Resume timer
                timerRef.current = window.setInterval(() => {
                    setDuration(prev => prev + 0.1);
                }, 100);
            } else {
                mediaRecorderRef.current.pause();
                // Pause timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            }
            setIsPaused(!isPaused);
        }
    };

    const playPreview = () => {
        if (!recordedBlob) return;

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const audio = new Audio(URL.createObjectURL(recordedBlob));
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                audioRef.current = null;
            };

            audio.play();
            setIsPlaying(true);
        }
    };

    const handleSend = () => {
        if (recordedBlob) {
            onSend(recordedBlob, duration, waveform);
            handleCancel();
        }
    };

    const handleCancel = () => {
        if (isRecording) {
            stopRecording();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setRecordedBlob(null);
        setDuration(0);
        setWaveform([]);
        setIsPlaying(false);
        onCancel();
    };

    const handleDelete = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setRecordedBlob(null);
        setDuration(0);
        setWaveform([]);
        setIsPlaying(false);
    };

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {recordedBlob ? 'Voice Message Preview' : 'Record Voice Message'}
                </h3>
                <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Waveform Visualization */}
            <div className="h-24 bg-slate-950/50 rounded-2xl flex items-center justify-center gap-1 px-4">
                {waveform.length > 0 ? (
                    waveform.map((amplitude, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-blue-500 rounded-full transition-all"
                            style={{
                                height: `${Math.max(amplitude * 100, 4)}%`,
                                opacity: isPlaying ? 0.8 : 0.5
                            }}
                        />
                    ))
                ) : isRecording ? (
                    // Animated recording indicator
                    Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-red-500 rounded-full animate-pulse"
                            style={{
                                height: `${Math.random() * 80 + 20}%`,
                                animationDelay: `${i * 20}ms`
                            }}
                        />
                    ))
                ) : (
                    <div className="text-slate-600 text-sm font-mono">
                        {isRecording ? 'Recording...' : 'Ready to record'}
                    </div>
                )}
            </div>

            {/* Duration Display */}
            <div className="text-center">
                <span className="text-2xl font-black font-mono text-white">
                    {formatDuration(duration)}
                </span>
                {isRecording && (
                    <span className="ml-3 text-red-500 animate-pulse">● REC</span>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                {!recordedBlob ? (
                    // Recording controls
                    <>
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={disabled}
                                className="p-6 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-xl disabled:opacity-50"
                            >
                                <Mic size={32} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={pauseRecording}
                                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-all"
                                >
                                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                                </button>
                                <button
                                    onClick={stopRecording}
                                    className="p-6 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-xl"
                                >
                                    <Square size={32} />
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    // Preview controls
                    <>
                        <button
                            onClick={playPreview}
                            className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-all"
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-4 bg-red-600/20 hover:bg-red-600/30 rounded-full text-red-400 transition-all"
                        >
                            <Trash2 size={24} />
                        </button>
                        <button
                            onClick={handleSend}
                            className="p-6 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-xl"
                        >
                            <Send size={32} />
                        </button>
                    </>
                )}
            </div>

            {/* Tips */}
            <div className="text-center text-xs font-mono text-slate-600 space-y-1">
                {!recordedBlob && !isRecording && <p>Click the microphone to start recording</p>}
                {isRecording && <p>Click square to stop • Click pause to pause</p>}
                {recordedBlob && <p>Click play to preview • Click send to share</p>}
            </div>
        </div>
    );
};
