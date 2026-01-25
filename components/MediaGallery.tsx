
import React, { useState, useMemo } from 'react';
import { X, Image as ImageIcon, Video, Music, FileText, Download, ZoomIn } from 'lucide-react';
import { FileAttachment, Message } from '../types';

interface MediaGalleryProps {
    messages: Message[];
    onClose: () => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ messages, onClose }) => {
    const [selectedMedia, setSelectedMedia] = useState<FileAttachment | null>(null);
    const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'audio' | 'files'>('all');

    // Extract all media from messages
    const allMedia = useMemo(() => {
        const media: Array<FileAttachment & { timestamp: number; senderName: string }> = [];
        messages.forEach(msg => {
            if (msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(attachment => {
                    media.push({
                        ...attachment,
                        timestamp: msg.timestamp,
                        senderName: msg.senderName
                    });
                });
            }
        });
        return media.reverse(); // Most recent first
    }, [messages]);

    // Filter media by type
    const filteredMedia = useMemo(() => {
        if (filter === 'all') return allMedia;

        return allMedia.filter(item => {
            if (filter === 'images') return item.type.startsWith('image/');
            if (filter === 'videos') return item.type.startsWith('video/');
            if (filter === 'audio') return item.type.startsWith('audio/');
            if (filter === 'files') return !item.type.startsWith('image/') && !item.type.startsWith('video/') && !item.type.startsWith('audio/');
            return true;
        });
    }, [allMedia, filter]);

    const getMediaIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon size={20} />;
        if (type.startsWith('video/')) return <Video size={20} />;
        if (type.startsWith('audio/')) return <Music size={20} />;
        return <FileText size={20} />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white">Media Gallery</h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">
                            {filteredMedia.length} {filter === 'all' ? 'items' : filter}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="px-6 py-4 border-b border-slate-800 flex gap-2 overflow-x-auto">
                    {(['all', 'images', 'videos', 'audio', 'files'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${filter === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Media Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredMedia.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                            <ImageIcon size={64} className="text-slate-600 mb-4" />
                            <p className="text-slate-500 font-mono">No {filter === 'all' ? 'media' : filter} found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredMedia.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all cursor-pointer"
                                    onClick={() => setSelectedMedia(item)}
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-slate-950/50 flex items-center justify-center relative">
                                        {item.type.startsWith('image/') ? (
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-slate-600">
                                                {getMediaIcon(item.type)}
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn size={32} className="text-white" />
                                        </div>

                                        {/* Encrypted badge */}
                                        {item.encrypted && (
                                            <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/50 rounded-lg px-2 py-1">
                                                <span className="text-[8px] font-black text-green-400 uppercase">🔒</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 space-y-1">
                                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{formatFileSize(item.size)}</p>
                                        <p className="text-[9px] text-slate-600 font-mono">{formatDate(item.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Media Preview Modal */}
                {selectedMedia && (
                    <div
                        className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <div
                            className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Preview Header */}
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{selectedMedia.name}</h3>
                                    <p className="text-sm text-slate-500 font-mono mt-1">
                                        {formatFileSize(selectedMedia.size)} • {formatDate(selectedMedia.timestamp)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={selectedMedia.url}
                                        download={selectedMedia.name}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                    >
                                        <Download size={20} />
                                    </a>
                                    <button
                                        onClick={() => setSelectedMedia(null)}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Content */}
                            <div className="p-6 max-h-[70vh] overflow-auto">
                                {selectedMedia.type.startsWith('image/') && (
                                    <img
                                        src={selectedMedia.url}
                                        alt={selectedMedia.name}
                                        className="w-full rounded-2xl"
                                    />
                                )}
                                {selectedMedia.type.startsWith('video/') && (
                                    <video
                                        src={selectedMedia.url}
                                        controls
                                        className="w-full rounded-2xl"
                                    />
                                )}
                                {selectedMedia.type.startsWith('audio/') && (
                                    <div className="flex items-center justify-center p-12">
                                        <audio src={selectedMedia.url} controls className="w-full" />
                                    </div>
                                )}
                                {!selectedMedia.type.startsWith('image/') &&
                                    !selectedMedia.type.startsWith('video/') &&
                                    !selectedMedia.type.startsWith('audio/') && (
                                        <div className="flex flex-col items-center justify-center p-12 text-center">
                                            {getMediaIcon(selectedMedia.type)}
                                            <p className="text-slate-400 mt-4">Preview not available</p>
                                            <a
                                                href={selectedMedia.url}
                                                download={selectedMedia.name}
                                                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-all"
                                            >
                                                Download File
                                            </a>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
