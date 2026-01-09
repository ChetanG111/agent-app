// Message Input Component

'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { executeSlashCommand } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function MessageInput() {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { ui, setActiveSender, sendMessage } = useStore();

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
                    `[Command] ${text} - ${result.message}`,
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
                    placeholder="Type instruction... (Cmd+Enter to send)"
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
                />
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
