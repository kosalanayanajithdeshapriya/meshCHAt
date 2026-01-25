
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Image as ImageIcon, Video, Check } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (file: File, type: 'image' | 'video') => void;
    onCancel: () => void;
    mode?: 'photo' | 'video';
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
    onCapture,
    onCancel,
    mode = 'photo'
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>(mode === 'photo' ? 'image' : 'video');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [recordingTime, setRecordingTime] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [facingMode]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: mediaType === 'video'
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Camera access failed:', error);
            alert('Failed to access camera. Please check permissions.');
            onCancel();
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedMedia(dataUrl);
        stopCamera();
    };

    const startVideoRecording = () => {
        if (!streamRef.current) return;

        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setCapturedMedia(url);
            stopCamera();
        };

        mediaRecorder.start(100);
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        timerRef.current = window.setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopVideoRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleCapture = () => {
        if (mediaType === 'image') {
            capturePhoto();
        } else {
            if (isRecording) {
                stopVideoRecording();
            } else {
                startVideoRecording();
            }
        }
    };

    const handleConfirm = async () => {
        if (!capturedMedia) return;

        try {
            const response = await fetch(capturedMedia);
            const blob = await response.blob();
            const filename = mediaType === 'image'
                ? `photo-${Date.now()}.jpg`
                : `video-${Date.now()}.webm`;
            const file = new File([blob], filename, {
                type: mediaType === 'image' ? 'image/jpeg' : 'video/webm'
            });

            onCapture(file, mediaType);
        } catch (error) {
            console.error('Failed to process captured media:', error);
            alert('Failed to process captured media');
        }
    };

    const handleRetake = () => {
        setCapturedMedia(null);
        setRecordingTime(0);
        startCamera();
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {mediaType === 'image' ? 'Capture Photo' : 'Record Video'}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMediaType(prev => prev === 'image' ? 'video' : 'image')}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                        title={`Switch to ${mediaType === 'image' ? 'video' : 'photo'} mode`}
                    >
                        {mediaType === 'image' ? <Video size={18} /> : <ImageIcon size={18} />}
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Camera Preview / Captured Media */}
            <div className="relative bg-slate-950/50 rounded-2xl overflow-hidden aspect-video">
                {!capturedMedia ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Recording indicator */}
                        {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-2 rounded-full">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                <span className="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
                            </div>
                        )}

                        {/* Flip camera button */}
                        <button
                            onClick={toggleFacingMode}
                            className="absolute top-4 right-4 p-3 bg-slate-900/80 hover:bg-slate-800 rounded-full text-white transition-all"
                        >
                            <RotateCw size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        {mediaType === 'image' ? (
                            <img src={capturedMedia} alt="Captured" className="w-full h-full object-cover" />
                        ) : (
                            <video src={capturedMedia} controls className="w-full h-full object-cover" />
                        )}
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                {!capturedMedia ? (
                    <button
                        onClick={handleCapture}
                        className={`p-6 rounded-full transition-all shadow-xl ${isRecording
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-blue-600 hover:bg-blue-500'
                            } text-white`}
                    >
                        <Camera size={32} />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleRetake}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-all flex items-center gap-2"
                        >
                            <RotateCw size={20} />
                            Retake
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all flex items-center gap-2"
                        >
                            <Check size={20} />
                            Use {mediaType === 'image' ? 'Photo' : 'Video'}
                        </button>
                    </>
                )}
            </div>

            {/* Tips */}
            <div className="text-center text-xs font-mono text-slate-600">
                {!capturedMedia && !isRecording && (
                    <p>Click camera to {mediaType === 'image' ? 'capture photo' : 'start recording'}</p>
                )}
                {isRecording && <p>Click camera again to stop recording</p>}
                {capturedMedia && <p>Review and confirm or retake</p>}
            </div>
        </div>
    );
};
