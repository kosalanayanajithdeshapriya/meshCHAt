
import React, { useState } from 'react';
import { Download, File, Image as ImageIcon, Video, Music, FileText, Eye, X } from 'lucide-react';
import { FileAttachment } from '../types';
import { formatFileSize } from '../utils/fileHandler';

interface FileMessageProps {
    attachment: FileAttachment;
    onDownload?: () => void;
    isEncrypted?: boolean;
}

export const FileMessage: React.FC<FileMessageProps> = ({
    attachment,
    onDownload,
    isEncrypted = false
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getFileIcon = () => {
        if (attachment.type.startsWith('image/')) return <ImageIcon size={24} className="text-blue-500" />;
        if (attachment.type.startsWith('video/')) return <Video size={24} className="text-purple-500" />;
        if (attachment.type.startsWith('audio/')) return <Music size={24} className="text-green-500" />;
        if (attachment.type.startsWith('text/') || attachment.type.includes('pdf'))
            return <FileText size={24} className="text-orange-500" />;
        return <File size={24} className="text-slate-500" />;
    };

    const isPreviewable = attachment.type.startsWith('image/') || attachment.type.startsWith('video/');

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            if (onDownload) {
                await onDownload();
            } else {
                // Direct download from URL
                const link = document.createElement('a');
                link.href = attachment.url;
                link.download = attachment.name;
                link.click();
            }
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 max-w-sm">
                {/* Thumbnail for images */}
                {attachment.thumbnail && (
                    <div className="mb-3 relative group">
                        <img
                            src={attachment.thumbnail}
                            alt={attachment.name}
                            className="w-full h-48 object-cover rounded-xl cursor-pointer"
                            onClick={() => setShowPreview(true)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <Eye size={32} className="text-white" />
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                        {getFileIcon()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate mb-1">{attachment.name}</p>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                            <span>{formatFileSize(attachment.size)}</span>
                            {isEncrypted && (
                                <>
                                    <span>•</span>
                                    <span className="text-green-500">🔒 Encrypted</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={isLoading}
                        className="flex-shrink-0 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50"
                        title="Download"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download size={20} />
                        )}
                    </button>
                </div>

                {/* Preview button for previewable files without thumbnail */}
                {isPreviewable && !attachment.thumbnail && (
                    <button
                        onClick={() => setShowPreview(true)}
                        className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <button
                        onClick={() => setShowPreview(false)}
                        className="absolute top-4 right-4 p-3 bg-slate-900 hover:bg-slate-800 rounded-full text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        {attachment.type.startsWith('image/') && (
                            <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-auto rounded-xl"
                            />
                        )}
                        {attachment.type.startsWith('video/') && (
                            <video
                                src={attachment.url}
                                controls
                                className="w-full h-auto rounded-xl"
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
