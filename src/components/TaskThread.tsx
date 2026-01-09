// Task Thread Component (THREAD mode)

'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore, selectSelectedTask } from '@/store';
import { Modal, Button } from './ui';
import { fetchTaskThread, sendMessage as apiSendMessage } from '@/lib/api';
import { Message } from '@/types';
import { toast } from 'react-hot-toast';

function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function getSenderColor(sender: Message['sender']): string {
    switch (sender) {
        case 'human': return 'text-yellow-400';
        case 'master': return 'text-emerald-400';
        case 'agent': return 'text-cyan-400';
        default: return 'text-gray-400';
    }
}

export function TaskThread() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { ui, closeModal, addMessage: addToGlobalFeed } = useStore();
    const selectedTask = useStore(selectSelectedTask);

    // Fetch thread messages when modal opens
    useEffect(() => {
        if (ui.modalType === 'task-thread' && selectedTask) {
            setLoading(true);
            fetchTaskThread(selectedTask.id)
                .then(setMessages)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [ui.modalType, selectedTask]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !selectedTask || sending) return;

        setSending(true);
        try {
            const message = await apiSendMessage(input, 'human', selectedTask.id);
            setMessages(prev => [...prev, message]);
            addToGlobalFeed(message);
            setInput('');
        } catch (error) {
            toast.error('Failed to send message', {
                style: { background: '#1f2937', color: '#f87171', border: '1px solid #374151' },
            });
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    if (!selectedTask || ui.modalType !== 'task-thread') return null;

    return (
        <Modal
            isOpen={ui.modalType === 'task-thread'}
            onClose={closeModal}
            title={`Thread: ${selectedTask.title}`}
            size="lg"
        >
            {/* Messages */}
            <div className="h-[300px] overflow-y-auto mb-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Loading thread...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No messages in this thread yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map(msg => (
                            <div key={msg.id} className="flex gap-2 text-sm">
                                <span className="text-gray-600 shrink-0">
                                    [{formatTimestamp(msg.timestamp)}]
                                </span>
                                <span className={`shrink-0 ${getSenderColor(msg.sender)}`}>
                                    {msg.sender === 'human' ? 'Human' : msg.agentName || 'Master Agent'}:
                                </span>
                                <span className={msg.isError ? 'text-red-300' : 'text-gray-300'}>
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Cmd+Enter to send)"
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
                />
                <Button onClick={handleSend} disabled={!input.trim() || sending}>
                    Send
                </Button>
            </div>
        </Modal>
    );
}
