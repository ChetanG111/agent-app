// Agent Drawer Component

'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore, selectSelectedAgent, selectAgentMessages } from '@/store';
import { Drawer, Badge, Button } from './ui';
import { fetchAgentHistory, sendMessage } from '@/lib/api';
import { Message } from '@/types';
import { toast } from 'react-hot-toast';

function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function AgentDrawer() {
    const [agentInput, setAgentInput] = useState('');
    const [history, setHistory] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { ui, closeAgentDrawer, addMessage } = useStore();
    const selectedAgent = useStore(selectSelectedAgent);

    // Fetch agent history when drawer opens
    useEffect(() => {
        if (ui.drawerOpen && selectedAgent) {
            setLoading(true);
            fetchAgentHistory(selectedAgent.id)
                .then(setHistory)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [ui.drawerOpen, selectedAgent]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSendMessage = async () => {
        if (!agentInput.trim() || !selectedAgent || sending) return;

        setSending(true);
        try {
            const message = await sendMessage(agentInput, 'human');
            setHistory(prev => [...prev, message]);
            addMessage(message);
            setAgentInput('');
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
            handleSendMessage();
        }
    };

    if (!selectedAgent) return null;

    return (
        <Drawer
            isOpen={ui.drawerOpen}
            onClose={closeAgentDrawer}
            title={selectedAgent.name}
        >
            {/* Agent Status */}
            <div className="px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Status</span>
                    <Badge status={selectedAgent.status} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Current Task</span>
                    <span className="text-sm text-gray-200">{selectedAgent.currentTask}</span>
                </div>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message History
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                        Loading...
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                        No messages with this agent
                    </div>
                ) : (
                    history.map(msg => (
                        <div
                            key={msg.id}
                            className={`p-2 rounded text-sm ${msg.sender === 'human'
                                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                                    : 'bg-gray-800 border border-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={msg.sender === 'human' ? 'text-yellow-400' : 'text-cyan-400'}>
                                    {msg.sender === 'human' ? 'You' : selectedAgent.name}
                                </span>
                                <span className="text-xs text-gray-600">
                                    {formatTimestamp(msg.timestamp)}
                                </span>
                            </div>
                            <p className={msg.isError ? 'text-red-300' : 'text-gray-300'}>{msg.text}</p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={agentInput}
                        onChange={(e) => setAgentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message agent... (Cmd+Enter)"
                        disabled={sending}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
                    />
                    <Button onClick={handleSendMessage} disabled={!agentInput.trim() || sending}>
                        Send
                    </Button>
                </div>
            </div>
        </Drawer>
    );
}
