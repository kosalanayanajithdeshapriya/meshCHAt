import React, { useState, useEffect } from 'react';
import {
    Terminal,
    Cpu,
    Shield,
    Check,
    CheckCheck,
    Clock
} from 'lucide-react';
import { Message, User } from '../types';
import { decryptMessage, ENCRYPTION_PREFIX } from '../utils/crypto';
import { AudioPlayer } from './AudioPlayer';
import { FileMessage } from './FileMessage';
import { MessageActions } from './MessageActions';
import { MessageReactions } from './MessageReactions';
import { getMessagePreview, hasReactionFromUser } from '../utils/messageHelpers';

interface TransmissionProps {
    m: Message;
    currentUser: User;
    secret?: string;
    previousMessage?: Message;
    onReply: (message: Message) => void;
    onReact: (message: Message, emoji: string) => void;
    onRemoveReaction: (message: Message, emoji: string) => void;
    onDelete: (message: Message, forEveryone: boolean) => void;
    onForward: (message: Message) => void;
    onCopy: (text: string) => void;
}

export const Transmission: React.FC<TransmissionProps> = ({
    m,
    currentUser,
    secret,
    previousMessage,
    onReply,
    onReact,
    onRemoveReaction,
    onDelete,
    onForward,
    onCopy
}) => {
    const isMe = m.senderId === currentUser.uid;
    const isAI = m.senderId === 'gemini-ai';
    // Check if messageType is 'system' OR if senderId is 'system' (legacy support)
    const isSystem = m.messageType === 'system' || m.senderId === 'system';

    const [content, setContent] = useState<string>(m.text);
    const [loading, setLoading] = useState(false);

    // Grouping logic
    const isSameSender = previousMessage && previousMessage.senderId === m.senderId;
    const isWithinTime = previousMessage && (m.timestamp - previousMessage.timestamp < 60 * 1000);
    const showTail = !isSameSender || !isWithinTime;
    const showAvatar = !isSameSender || !isWithinTime;
    const showName = (!isSameSender || !isWithinTime) && !isMe;

    useEffect(() => {
        if (m.text.startsWith(ENCRYPTION_PREFIX)) {
            if (secret) {
                setLoading(true);
                decryptMessage(m.text, secret, m.channelId).then(res => {
                    setContent(res);
                    setLoading(false);
                });
            } else {
                setContent('[🔒 PACKET_ENCRYPTED_MISSING_KEY]');
            }
        } else {
            setContent(m.text);
        }
    }, [m.text, secret, m.channelId]);

    if (isSystem) {
        return (
            <div className="flex justify-center my-4 opacity-75">
                <div className="bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800 flex items-center gap-2">
                    <Terminal size={12} className="text-blue-500" />
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">{content}</span>
                </div>
            </div>
        );
    }

    // Status Icon
    const StatusIcon = () => {
        if (!isMe) return null;
        if (m.status === 'read') return <CheckCheck size={14} className="text-blue-400" />;
        if (m.status === 'delivered') return <CheckCheck size={14} className="text-slate-400" />;
        if (m.status === 'sent') return <Check size={14} className="text-slate-400" />;
        return <Clock size={12} className="text-slate-500" />;
    };

    return (
        <div
            className={`
        flex items-start gap-2 mb-1 group relative
        ${isMe ? 'flex-row-reverse' : 'flex-row'}
        ${showTail ? 'mt-3' : 'mt-0.5'}
      `}
        >
            {/* Avatar (Only show for first message in group) */}
            <div className={`flex-shrink-0 w-8 ${!showAvatar ? 'invisible' : ''}`}>
                {isAI ? (
                    <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/30">
                        <Cpu size={16} />
                    </div>
                ) : (
                    <img
                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.senderId}`}
                        className={`w-8 h-8 rounded-full bg-slate-800 border border-slate-800 ${isMe ? 'grayscale-0' : 'grayscale'}`}
                        alt={m.senderName}
                    />
                )}
            </div>

            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] md:max-w-[65%]`}>
                {showName && (
                    <span className={`text-[10px] font-bold mb-1 ml-1 ${isAI ? 'text-blue-400' : 'text-slate-400'}`}>
                        {m.senderName}
                    </span>
                )}

                <div className="relative group/bubble flex flex-col">
                    <div className={`
             message-bubble px-3 py-2 rounded-lg text-[15px] leading-relaxed relative
             ${isMe
                            ? 'bg-[#005c4b] text-white rounded-tr-none' // Dark WhatsApp Green
                            : 'bg-slate-800 text-slate-100 rounded-tl-none' // Dark WhatsApp Received
                        }
             ${showTail && isMe ? 'message-tail-out' : ''}
             ${showTail && !isMe ? 'message-tail-in' : ''}
             ${!showTail && isMe ? 'rounded-tr-lg mr-[8px]' : ''} /* Adjust for missing tail */
             ${!showTail && !isMe ? 'rounded-tl-lg ml-[8px]' : ''}
             ${loading ? 'animate-pulse' : ''}
          `}>
                        {/* Reply Preview Context */}
                        {/* Note: We need reply info in message object to show this properly */}
                        {m.replyTo && ( // Assuming we updated types
                            <div className="mb-2 p-1.5 rounded bg-black/20 text-xs border-l-2 border-white/50 cursor-pointer opacity-90">
                                <span className="font-bold text-blue-300 block mb-0.5">{m.replyTo.senderName}</span>
                                <span className="line-clamp-1 opacity-80">{m.replyTo.text}</span>
                            </div>
                        )}

                        {/* Text content */}
                        {content && <div className="whitespace-pre-wrap break-words">{content}</div>}

                        {/* File attachments */}
                        {m.attachments && m.attachments.length > 0 && (
                            <div className={`${content ? 'mt-2' : ''} space-y-2`}>
                                {m.attachments.map((attachment) => {
                                    if (m.messageType === 'voice' || attachment.type.startsWith('audio/')) {
                                        return (
                                            <AudioPlayer
                                                key={attachment.id}
                                                audioUrl={attachment.url}
                                                encrypted={attachment.encrypted}
                                                secret={secret}
                                                channelId={m.channelId}
                                            />
                                        );
                                    }
                                    return (
                                        <FileMessage
                                            key={attachment.id}
                                            attachment={attachment}
                                            secret={secret}
                                            channelId={m.channelId}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 space-x-1">
                            {m.text.startsWith(ENCRYPTION_PREFIX) && (
                                <Shield size={10} className="text-green-400 opacity-70" />
                            )}
                            <span className="text-[10px] text-white/50 min-w-[45px] text-right flex items-center justify-end gap-1">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                {isMe && <StatusIcon />}
                            </span>
                        </div>

                        {/* Context Menu Trigger */}
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2 z-10">
                            <MessageActions
                                message={m}
                                currentUser={currentUser}
                                onReply={onReply}
                                onReact={onReact}
                                onDelete={onDelete}
                                onForward={onForward}
                                onCopy={onCopy}
                            />
                        </div>
                    </div>

                    {/* Reactions */}
                    <MessageReactions
                        reactions={m.reactions}
                        currentUserId={currentUser.uid}
                        onReact={(emoji) => onReact(m, emoji)}
                        onRemoveReaction={(emoji) => onRemoveReaction(m, emoji)}
                    />
                </div>
            </div>
        </div>
    );
};
