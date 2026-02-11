import React from 'react';
import { Plus } from 'lucide-react';
import { Reaction } from '../types';

interface MessageReactionsProps {
    reactions?: Reaction[];
    currentUserId: string;
    onReact: (emoji: string) => void;
    onRemoveReaction: (emoji: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
    reactions,
    currentUserId,
    onReact,
    onRemoveReaction
}) => {
    if (!reactions || reactions.length === 0) return null;

    const handleReactionClick = (reaction: Reaction) => {
        if (reaction.users.includes(currentUserId)) {
            onRemoveReaction(reaction.emoji);
        } else {
            onReact(reaction.emoji);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 mt-1 mb-1">
            {reactions.map((reaction, index) => {
                const isMe = reaction.users.includes(currentUserId);
                return (
                    <button
                        key={`${reaction.emoji}-${index}`}
                        onClick={() => handleReactionClick(reaction)}
                        className={`
              flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all
              ${isMe
                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-100 hover:bg-blue-500/30'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                            }
            `}
                        title={reaction.users.includes(currentUserId) ? 'You reacted (Click to remove)' : `${reaction.users.length} reaction${reaction.users.length > 1 ? 's' : ''}`}
                    >
                        <span>{reaction.emoji}</span>
                        {reaction.users.length > 0 && (
                            <span className={isMe ? 'text-blue-200' : 'text-slate-500'}>
                                {reaction.users.length}
                            </span>
                        )}
                    </button>
                );
            })}

            <button
                onClick={() => {
                    // This will be handled by the parent opening the full picker
                    // For now it toggles the most common or opens menu
                    onReact('👍');
                }}
                className="px-1.5 py-0.5 rounded-full bg-slate-800/30 border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
                <Plus size={10} />
            </button>
        </div>
    );
};
