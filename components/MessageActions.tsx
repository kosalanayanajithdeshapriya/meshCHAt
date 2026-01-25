
import React, { useState } from 'react';
import { Reply, Edit2, Trash2, Copy, Pin, MoreVertical, Check, X } from 'lucide-react';
import { Message } from '../types';

interface MessageActionsProps {
    message: Message;
    currentUserId: string;
    onReply: (messageId: string) => void;
    onEdit: (messageId: string, newText: string) => void;
    onDelete: (messageId: string) => void;
    onPin: (messageId: string) => void;
    onCopy: (text: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
    message,
    currentUserId,
    onReply,
    onEdit,
    onDelete,
    onPin,
    onCopy
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);

    const isOwnMessage = message.senderId === currentUserId;

    const handleEdit = () => {
        if (editText.trim() && editText !== message.text) {
            onEdit(message.id, editText);
        }
        setIsEditing(false);
        setShowMenu(false);
    };

    const handleDelete = () => {
        if (confirm('Delete this message?')) {
            onDelete(message.id);
            setShowMenu(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 mt-2">
                <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEdit();
                        if (e.key === 'Escape') setIsEditing(false);
                    }}
                />
                <button
                    onClick={handleEdit}
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setEditText(message.text);
                    }}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 rounded-lg text-slate-400 transition-all"
            >
                <MoreVertical size={16} />
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 min-w-[180px]">
                        <button
                            onClick={() => {
                                onReply(message.id);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                        >
                            <Reply size={16} />
                            <span>Reply</span>
                        </button>

                        {isOwnMessage && (
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                            >
                                <Edit2 size={16} />
                                <span>Edit</span>
                            </button>
                        )}

                        <button
                            onClick={() => {
                                onCopy(message.text);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                        >
                            <Copy size={16} />
                            <span>Copy Text</span>
                        </button>

                        <button
                            onClick={() => {
                                onPin(message.id);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                        >
                            <Pin size={16} />
                            <span>{message.isPinned ? 'Unpin' : 'Pin'} Message</span>
                        </button>

                        {isOwnMessage && (
                            <>
                                <div className="h-px bg-slate-700 my-2" />
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-400 text-sm transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
