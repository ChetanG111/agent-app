// Feed Stream Component with Agent Colors

'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { MessageSkeleton } from './ui';
import { Message, SenderType } from '@/types';
import { getAgentColorByName } from '@/lib/colors';

function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

function getSenderColor(message: Message): string {
    if (message.isError) return 'text-red-400';

    switch (message.sender) {
        case 'master': return 'text-emerald-400';
        case 'human': return 'text-yellow-400';
        case 'agent': {
            // Use unique color for each agent
            if (message.agentName) {
                const agentColor = getAgentColorByName(message.agentName);
                return agentColor.text;
            }
            return 'text-cyan-400';
        }
        default: return 'text-gray-400';
    }
}

function getSenderName(message: Message): string {
    if (message.sender === 'human') return 'Human';
    if (message.sender === 'master') return 'Master Agent';
    return message.agentName || 'Agent';
}

interface FeedMessageProps {
    message: Message;
}

function FeedMessage({ message }: FeedMessageProps) {
    const senderColor = getSenderColor(message);

    return (
        <div className="flex gap-2 px-4 py-0.5 font-mono text-sm hover:bg-gray-800/30 transition-colors">
            <span className="text-gray-600 shrink-0">
                [{formatTimestamp(message.timestamp)}]
            </span>
            <span className={`shrink-0 font-medium ${senderColor}`}>
                {getSenderName(message)}:
            </span>
            <span className={message.isError ? 'text-red-300' : 'text-gray-300'}>
                {message.text}
            </span>
        </div>
    );
}

interface FeedStreamProps {
    isConnected?: boolean;
}

export function FeedStream({ isConnected = true }: FeedStreamProps) {
    const { messages, messagesLoading } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScroll = useRef(true);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (containerRef.current && shouldAutoScroll.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    // Check if user has scrolled up
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 50;
        }
    };

    return (
        <div className="flex flex-col border-t border-gray-800 bg-gray-900/50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live Feedback Stream
                </span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className={`text-xs ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto py-2 min-h-[120px] max-h-[200px]"
            >
                {messagesLoading ? (
                    <>
                        <MessageSkeleton />
                        <MessageSkeleton />
                        <MessageSkeleton />
                    </>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm py-8">
                        <span>Awaiting agent communications...</span>
                        <span className="text-xs text-gray-700 mt-1">Messages will appear here in real-time</span>
                    </div>
                ) : (
                    messages.map(message => (
                        <FeedMessage key={message.id} message={message} />
                    ))
                )}
            </div>
        </div>
    );
}
