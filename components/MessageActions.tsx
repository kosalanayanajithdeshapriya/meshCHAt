import React, { useState, useRef, useEffect } from 'react';
import {
    Reply,
    Smile,
    Trash2,
    Copy,
    Forward,
    MoreVertical,
    Info,
    Edit2
} from 'lucide-react';
import { Message, User } from '../types';

interface MessageActionsProps {
    message: Message;
    currentUser: User;
    onReply: (message: Message) => void;
    onReact: (message: Message, emoji: string) => void;
    onDelete: (message: Message, forEveryone: boolean) => void;
    onForward: (message: Message) => void;
    onCopy: (text: string) => void;
    onInfo?: (message: Message) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
    message,
    currentUser,
    onReply,
    onReact,
    onDelete,
    onForward,
    onCopy,
    onInfo
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteSubmenu, setShowDeleteSubmenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isMe = message.senderId === currentUser.uid;
    const canDeleteForEveryone = isMe && (Date.now() - message.timestamp < 15 * 60 * 1000); // 15 mins

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowDeleteSubmenu(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
        setShowDeleteSubmenu(false);
    };

    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    return (
        <div className="relative group/actions" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          p-1 rounded-full hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100
          ${isOpen ? 'opacity-100 bg-slate-800' : ''}
          ${isMe ? 'text-slate-300' : 'text-slate-400'}
        `}
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className={`
          absolute z-50 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-1
          ${isMe ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
          top-full mt-1
        `}>
                    {/* Quick Reactions */}
                    <div className="px-2 py-2 mb-1 flex justify-between border-b border-slate-700">
                        {commonEmojis.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleAction(() => onReact(message, emoji))}
                                className="hover:scale-125 transition-transform text-lg"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handleAction(() => onReply(message))}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm"
                    >
                        <Reply size={16} />
                        <span>Reply</span>
                    </button>

                    <button
                        onClick={() => handleAction(() => onCopy(message.text))}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm"
                    >
                        <Copy size={16} />
                        <span>Copy</span>
                    </button>

                    <button
                        onClick={() => handleAction(() => onForward(message))}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm"
                    >
                        <Forward size={16} />
                        <span>Forward</span>
                    </button>

                    {isMe && onInfo && (
                        <button
                            onClick={() => handleAction(() => onInfo(message))}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm"
                        >
                            <Info size={16} />
                            <span>Info</span>
                        </button>
                    )}

                    <div className="h-px bg-slate-700/50 my-1"></div>

                    <div className="relative">
                        <button
                            onClick={() => setShowDeleteSubmenu(!showDeleteSubmenu)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 size={16} />
                                <span>Delete</span>
                            </div>
                        </button>

                        {showDeleteSubmenu && (
                            <div className="absolute left-full top-0 ml-1 w-40 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-1 overflow-hidden">
                                <button
                                    onClick={() => handleAction(() => onDelete(message, false))}
                                    className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm"
                                >
                                    Delete for me
                                </button>
                                {canDeleteForEveryone && (
                                    <button
                                        onClick={() => handleAction(() => onDelete(message, true))}
                                        className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                                    >
                                        Delete for everyone
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
