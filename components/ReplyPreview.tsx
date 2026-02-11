import React from 'react';
import { X, Image, Mic, FileText, Video } from 'lucide-react';
import { ReplyInfo } from '../types';

interface ReplyPreviewProps {
    replyConfig: ReplyInfo;
    onCancel: () => void;
    isDark?: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
    replyConfig,
    onCancel,
    isDark = true
}) => {
    return (
        <div className={`
      flex items-center justify-between p-2 mb-2 rounded-lg border-l-4 
      ${isDark
                ? 'bg-slate-800/80 border-blue-500'
                : 'bg-white border-blue-500 shadow-sm'}
    `}>
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-xs font-bold text-blue-500 mb-0.5 truncate">
                    {replyConfig.senderName}
                    <span className="text-[9px] text-slate-500 ml-2 font-mono">
                        Replying...
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
                    {replyConfig.hasAttachment && (
                        <span className="flex-shrink-0 text-slate-400">
                            {replyConfig.attachmentType?.startsWith('image') && <Image size={14} />}
                            {replyConfig.attachmentType?.startsWith('audio') && <Mic size={14} />}
                            {replyConfig.attachmentType?.startsWith('video') && <Video size={14} />}
                            {!replyConfig.attachmentType?.match(/image|audio|video/) && <FileText size={14} />}
                        </span>
                    )}
                    <span className="truncate opacity-90">
                        {replyConfig.text || (replyConfig.hasAttachment ?
                            (replyConfig.attachmentType?.startsWith('image') ? 'Photo' :
                                replyConfig.attachmentType?.startsWith('audio') ? 'Voice Message' :
                                    replyConfig.attachmentType?.startsWith('video') ? 'Video' : 'File')
                            : '')}
                    </span>
                </div>
            </div>

            {replyConfig.thumbnail && (
                <div className="w-10 h-10 ml-3 rounded overflow-hidden flex-shrink-0 bg-slate-700">
                    <img src={replyConfig.thumbnail} alt="preview" className="w-full h-full object-cover" />
                </div>
            )}

            <button
                onClick={onCancel}
                className="ml-3 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-full transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};
