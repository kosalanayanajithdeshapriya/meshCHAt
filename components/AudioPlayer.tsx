
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';
import { formatDuration } from '../utils/audioProcessor';

interface AudioPlayerProps {
    audioUrl: string;
    duration: number;
    waveform: number[];
    onDownload?: () => void;
    isEncrypted?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioUrl,
    duration,
    waveform,
    onDownload,
    isEncrypted = false
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [audioUrl]);

    const togglePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const cyclePlaybackRate = () => {
        const rates = [1, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];

        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 max-w-sm">
            <div className="flex items-center gap-3">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    className="flex-shrink-0 w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>

                {/* Waveform & Progress */}
                <div className="flex-1 space-y-2">
                    {/* Waveform */}
                    <div
                        className="h-12 flex items-center gap-0.5 cursor-pointer"
                        onClick={handleSeek}
                    >
                        {waveform.map((amplitude, i) => {
                            const barProgress = (i / waveform.length) * 100;
                            const isPlayed = barProgress <= progress;

                            return (
                                <div
                                    key={i}
                                    className="flex-1 rounded-full transition-all"
                                    style={{
                                        height: `${Math.max(amplitude * 100, 4)}%`,
                                        backgroundColor: isPlayed ? '#3b82f6' : '#475569',
                                        opacity: isPlayed ? 1 : 0.5
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Time Display */}
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                    {/* Playback Speed */}
                    <button
                        onClick={cyclePlaybackRate}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                        title="Playback speed"
                    >
                        {playbackRate}x
                    </button>

                    {/* Download */}
                    {onDownload && (
                        <button
                            onClick={onDownload}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Encryption Indicator */}
            {isEncrypted && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-green-500">
                    <Volume2 size={12} />
                    <span>🔒 Encrypted Voice Message</span>
                </div>
            )}
        </div>
    );
};
