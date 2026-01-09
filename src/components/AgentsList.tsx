// Agents List Component with Unique Colors

'use client';

import { useStore } from '@/store';
import { Badge, AgentSkeleton } from './ui';
import { Agent } from '@/types';
import { getAgentColor } from '@/lib/colors';

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function getStatusIndicator(status: Agent['status']): { ring: string; pulse: boolean } {
    switch (status) {
        case 'active': return { ring: 'ring-emerald-400/50', pulse: true };
        case 'stuck': return { ring: 'ring-red-400/50', pulse: true };
        case 'offline': return { ring: 'ring-gray-500/50', pulse: false };
        case 'idle': return { ring: 'ring-yellow-400/50', pulse: false };
        default: return { ring: 'ring-gray-400/50', pulse: false };
    }
}

interface AgentItemProps {
    agent: Agent;
    onClick: () => void;
}

function AgentItem({ agent, onClick }: AgentItemProps) {
    const color = getAgentColor(agent.id);
    const statusIndicator = getStatusIndicator(agent.status);

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 border-b border-gray-800 hover:bg-gradient-to-r ${color.gradient} transition-all duration-200 cursor-pointer group`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Agent color dot with status ring */}
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${color.dot} ring-2 ${statusIndicator.ring}`} />
                        {statusIndicator.pulse && (
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${color.dot} animate-ping opacity-50`} />
                        )}
                    </div>
                    <span className={`font-medium ${color.text} group-hover:brightness-110`}>
                        {agent.name}
                    </span>
                </div>
                {(agent.status === 'stuck' || agent.status === 'offline') && (
                    <Badge status={agent.status} />
                )}
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">{agent.currentTask}</span>
                <span className="text-gray-600">{formatTimeAgo(agent.lastActive)}</span>
            </div>
        </button>
    );
}

export function AgentsList() {
    const { agents, agentsLoading, openAgentDrawer } = useStore();

    if (agentsLoading) {
        return (
            <div className="flex flex-col">
                <AgentSkeleton />
                <AgentSkeleton />
                <AgentSkeleton />
                <AgentSkeleton />
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No agents registered</p>
                <p className="text-xs mt-1">Agents will appear here when they connect</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-y-auto">
            {agents.map(agent => (
                <AgentItem
                    key={agent.id}
                    agent={agent}
                    onClick={() => openAgentDrawer(agent.id)}
                />
            ))}
        </div>
    );
}
