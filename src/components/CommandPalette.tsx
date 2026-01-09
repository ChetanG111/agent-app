// Command Palette Component

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/store';
import { executeSlashCommand } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Command {
    id: string;
    label: string;
    shortcut?: string;
    action: () => void | Promise<void>;
    category: string;
}

export function CommandPalette() {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const {
        ui,
        toggleCommandPalette,
        closeAll,
        fetchAgents,
        fetchTasks,
        sendMessage,
    } = useStore();

    const commands: Command[] = useMemo(() => [
        {
            id: 'pause',
            label: 'Pause All Agents',
            shortcut: '/pause',
            category: 'Control',
            action: async () => {
                const result = await executeSlashCommand('/pause');
                await sendMessage(`[Command] /pause - ${result.message}`, 'master');
                toast.success(result.message, {
                    style: { background: '#1f2937', color: '#10b981', border: '1px solid #374151' },
                });
                toggleCommandPalette();
            },
        },
        {
            id: 'kill',
            label: 'Kill All Agents',
            shortcut: '/kill',
            category: 'Control',
            action: async () => {
                const result = await executeSlashCommand('/kill');
                await sendMessage(`[Command] /kill - ${result.message}`, 'master');
                toast.success(result.message, {
                    style: { background: '#1f2937', color: '#f87171', border: '1px solid #374151' },
                });
                toggleCommandPalette();
            },
        },
        {
            id: 'reassign',
            label: 'Reassign Tasks',
            shortcut: '/reassign',
            category: 'Control',
            action: async () => {
                const result = await executeSlashCommand('/reassign');
                await sendMessage(`[Command] /reassign - ${result.message}`, 'master');
                toast.success(result.message, {
                    style: { background: '#1f2937', color: '#10b981', border: '1px solid #374151' },
                });
                toggleCommandPalette();
            },
        },
        {
            id: 'refresh-agents',
            label: 'Refresh Agents',
            category: 'View',
            action: () => {
                fetchAgents();
                toast.success('Agents refreshed', {
                    style: { background: '#1f2937', color: '#10b981', border: '1px solid #374151' },
                });
                toggleCommandPalette();
            },
        },
        {
            id: 'refresh-tasks',
            label: 'Refresh Tasks',
            category: 'View',
            action: () => {
                fetchTasks();
                toast.success('Tasks refreshed', {
                    style: { background: '#1f2937', color: '#10b981', border: '1px solid #374151' },
                });
                toggleCommandPalette();
            },
        },
        {
            id: 'close-all',
            label: 'Close All Panels',
            shortcut: 'Esc',
            category: 'Navigation',
            action: () => {
                closeAll();
            },
        },
    ], [toggleCommandPalette, closeAll, fetchAgents, fetchTasks, sendMessage]);

    const filteredCommands = useMemo(() => {
        if (!search) return commands;
        const lower = search.toLowerCase();
        return commands.filter(
            cmd => cmd.label.toLowerCase().includes(lower) ||
                cmd.shortcut?.toLowerCase().includes(lower)
        );
    }, [commands, search]);

    // Focus input when opened
    useEffect(() => {
        if (ui.commandPaletteOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSearch('');
            setSelectedIndex(0);
        }
    }, [ui.commandPaletteOpen]);

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                toggleCommandPalette();
                break;
        }
    };

    if (!ui.commandPaletteOpen) return null;

    // Group commands by category
    const grouped = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    let flatIndex = -1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
            onClick={toggleCommandPalette}
        >
            <div
                className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center px-4 py-3 border-b border-gray-700">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands..."
                        className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
                    />
                </div>

                {/* Commands List */}
                <div ref={listRef} className="max-h-[300px] overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            No commands found
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, cmds]) => (
                            <div key={category}>
                                <div className="px-4 py-1 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    {category}
                                </div>
                                {cmds.map(cmd => {
                                    flatIndex++;
                                    const isSelected = flatIndex === selectedIndex;
                                    return (
                                        <button
                                            key={cmd.id}
                                            onClick={() => cmd.action()}
                                            className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${isSelected ? 'bg-gray-800 text-gray-100' : 'text-gray-400 hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <span>{cmd.label}</span>
                                            {cmd.shortcut && (
                                                <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                                                    {cmd.shortcut}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-600">
                    <span>↑↓ Navigate</span>
                    <span>↵ Select</span>
                    <span>Esc Close</span>
                </div>
            </div>
        </div>
    );
}
