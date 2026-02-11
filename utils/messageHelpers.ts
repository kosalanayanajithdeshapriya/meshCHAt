import { Message, MessageStatus, Reaction } from '../types';

export const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatSmartTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
        return formatTime(timestamp);
    }

    if (diff < oneDay * 2 && date.getDate() === now.getDate() - 1) {
        return 'Yesterday';
    }

    if (diff < oneDay * 7) {
        return date.toLocaleDateString([], { weekday: 'long' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const groupMessages = (messages: Message[]): Message[][] => {
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];

    messages.forEach((msg, index) => {
        if (index === 0) {
            currentGroup.push(msg);
            return;
        }

        const prevMsg = messages[index - 1];
        const isSameSender = msg.senderId === prevMsg.senderId;
        const isWithinTimeWindow = msg.timestamp - prevMsg.timestamp < 60000; // 1 minute

        if (isSameSender && isWithinTimeWindow && prevMsg.messageType !== 'system' && msg.messageType !== 'system') {
            currentGroup.push(msg);
        } else {
            groups.push([...currentGroup]);
            currentGroup = [msg];
        }
    });

    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
};

export const getMessagePreview = (msg: Message): string => {
    if (msg.messageType === 'voice') return '🎤 Voice Message';
    if (msg.messageType === 'image') return '📷 Image';
    if (msg.messageType === 'video') return '📹 Video';
    if (msg.messageType === 'file') return '📁 File';
    if (msg.attachments && msg.attachments.length > 0) return '📎 Attachment';
    return msg.text;
};

export const hasReactionFromUser = (reactions: Reaction[] | undefined, userId: string, emoji: string): boolean => {
    if (!reactions) return false;
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction ? reaction.users.includes(userId) : false;
};
