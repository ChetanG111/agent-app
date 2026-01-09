// Message Input Component with Master Agent Integration

'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { executeSlashCommand, addAgent } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Agent } from '@/types';

interface MasterAgentResult {
    response: string;
    agentUsed?: {
        id: string;
        name: string;
        role: string;
    };
}

export function MessageInput() {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { ui, setActiveSender, sendMessage, addMessage, agents, tasks, messages } = useStore();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get Master Agent response from API
    const getMasterAgentResponse = async (humanMessage: string): Promise<MasterAgentResult | null> => {
        try {
            const response = await fetch('/api/master-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: humanMessage,
                    agents: agents.map(a => ({
                        id: a.id,
                        name: a.name,
                        status: a.status,
                        currentTask: a.currentTask,
                    })),
                    tasks: tasks.map(t => ({
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        assignedAgents: t.assignedAgents,
                    })),
                    recentMessages: messages.slice(-10).map(m => ({
                        sender: m.sender,
                        agentName: m.agentName,
                        text: m.text,
                    })),
                }),
            });

            if (!response.ok) {
                console.error('[Master Agent] API error:', response.status);
                return null;
            }

            const data = await response.json();

            // If an agent was spawned, add it to local state
            if (data.agentUsed) {
                const newAgent: Agent = {
                    id: data.agentUsed.id,
                    name: data.agentUsed.name,
                    currentTask: `Completed (${data.agentUsed.role})`,
                    status: 'idle',
                    lastActive: new Date(),
                };
                addAgent(newAgent);
                console.log('[MessageInput] Agent spawned and added:', newAgent.name);
            }

            return {
                response: data.response,
                agentUsed: data.agentUsed,
            };
        } catch (error) {
            console.error('[Master Agent] Request failed:', error);
            return null;
        }
    };

    const handleSubmit = async () => {
        const text = message.trim();
        if (!text || isLoading) return;

        setIsLoading(true);

        try {
            // Check for slash commands
            if (text.startsWith('/')) {
                const result = await executeSlashCommand(text);

                // Add command result to feed
                await sendMessage(
                    `[Command] ${text} → ${result.message}`,
                    'master'
                );

                if (result.success) {
                    toast.success(result.message, {
                        style: {
                            background: '#1f2937',
                            color: '#10b981',
                            border: '1px solid #374151',
                        },
                    });

                    // Refresh agents after command (for status changes)
                    if (result.action === 'PAUSE_ALL' || result.action === 'RESUME_ALL' || result.action === 'KILL_ALL') {
                        // Trigger a re-fetch (store will handle)
                        useStore.getState().fetchAgents();
                    }
                } else {
                    toast.error(result.message, {
                        style: {
                            background: '#1f2937',
                            color: '#f87171',
                            border: '1px solid #374151',
                        },
                    });
                }
            } else {
                // Regular message
                await sendMessage(text, ui.activeSender);

                // If sender is Human, get Master Agent response
                if (ui.activeSender === 'human') {
                    const masterResponse = await getMasterAgentResponse(text);

                    if (masterResponse) {
                        // Add Master Agent response to the feed
                        addMessage({
                            id: `msg-master-${Date.now()}`,
                            sender: 'master',
                            agentName: 'Master Agent',
                            text: masterResponse.response,
                            timestamp: new Date(),
                        });

                        // Refresh agents list (Master Agent may have spawned new agents)
                        useStore.getState().fetchAgents();
                    }
                }
            }

            setMessage('');
        } catch (error) {
            toast.error('Failed to send message. Please try again.', {
                style: {
                    background: '#1f2937',
                    color: '#f87171',
                    border: '1px solid #374151',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Cmd/Ctrl + Enter to send
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-800 bg-gray-900">
            {/* Sender Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                    <span className={ui.activeSender === 'human' ? 'text-yellow-400' : 'text-emerald-400'}>
                        {ui.activeSender === 'human' ? 'Human' : 'Master'}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 w-32 bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
                        <button
                            onClick={() => { setActiveSender('human'); setShowDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${ui.activeSender === 'human' ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                        >
                            Human
                        </button>
                        <button
                            onClick={() => { setActiveSender('master'); setShowDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${ui.activeSender === 'master' ? 'text-emerald-400' : 'text-gray-300'
                                }`}
                        >
                            Master
                        </button>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex-1 relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLoading ? "Processing..." : "Type instruction... (Cmd+Enter to send)"}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
                />

                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Send Button */}
            <button
                onClick={handleSubmit}
                disabled={!message.trim() || isLoading}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>
        </div>
    );
}
