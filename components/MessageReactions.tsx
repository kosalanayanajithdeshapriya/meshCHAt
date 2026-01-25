
import React from 'react';

interface MessageReactionsProps {
    reactions?: Record<string, string[]>;
    currentUserId: string;
    onReact: (emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
    reactions = {},
    currentUserId,
    onReact
}) => {
    const [showPicker, setShowPicker] = React.useState(false);

    const hasReactions = Object.keys(reactions).length > 0;

    return (
        <div className="relative">
            {/* Existing Reactions */}
            {hasReactions && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(reactions).map(([emoji, users]) => {
                        const hasReacted = users.includes(currentUserId);
                        return (
                            <button
                                key={emoji}
                                onClick={() => onReact(emoji)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-all ${hasReacted
                                        ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                            >
                                <span>{emoji}</span>
                                <span className="text-xs font-mono">{users.length}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Add Reaction Button */}
            <div className="relative inline-block mt-2">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-full text-xs transition-all"
                >
                    + 😊
                </button>

                {/* Quick Reaction Picker */}
                {showPicker && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowPicker(false)}
                        />
                        <div className="absolute left-0 bottom-full mb-2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 flex gap-1">
                            {QUICK_REACTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        onReact(emoji);
                                        setShowPicker(false);
                                    }}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-2xl transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
