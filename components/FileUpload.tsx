
import React, { useState, useRef, DragEvent } from 'react';
import { Upload, X, File, Image, Video, Music, FileText } from 'lucide-react';
import { validateFile, formatFileSize, getFileIcon } from '../utils/fileHandler';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFilesSelected,
    maxFiles = 5,
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = (files: File[]) => {
        const validFiles: File[] = [];

        for (const file of files) {
            if (selectedFiles.length + validFiles.length >= maxFiles) {
                alert(`Maximum ${maxFiles} files allowed`);
                break;
            }

            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                alert(`${file.name}: ${validation.error}`);
            }
        }

        if (validFiles.length > 0) {
            const newFiles = [...selectedFiles, ...validFiles];
            setSelectedFiles(newFiles);
            onFilesSelected(newFiles);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    const getFileTypeIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
        if (file.type.startsWith('video/')) return <Video size={20} className="text-purple-500" />;
        if (file.type.startsWith('audio/')) return <Music size={20} className="text-green-500" />;
        if (file.type.startsWith('text/') || file.type.includes('pdf')) return <FileText size={20} className="text-orange-500" />;
        return <File size={20} className="text-slate-500" />;
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${isDragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-600'}`} />
                <p className="text-slate-300 font-bold mb-2">
                    {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
                </p>
                <p className="text-slate-600 text-sm font-mono">
                    Max {maxFiles} files • 10MB per file
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.txt,.json"
                    disabled={disabled}
                />
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Selected Files ({selectedFiles.length})
                    </p>
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3"
                        >
                            {getFileTypeIcon(file)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{file.name}</p>
                                <p className="text-xs font-mono text-slate-600">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
