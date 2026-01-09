// Badge Component

import { AgentStatus, TaskStatus } from '@/types';

interface BadgeProps {
    status: AgentStatus | TaskStatus;
    className?: string;
}

const statusStyles: Record<AgentStatus | TaskStatus, string> = {
    'active': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'stuck': 'bg-red-500/20 text-red-400 border-red-500/30',
    'offline': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'idle': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'pending': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusLabels: Partial<Record<AgentStatus | TaskStatus, string>> = {
    'in-progress': 'IN PROGRESS',
};

export function Badge({ status, className = '' }: BadgeProps) {
    const label = statusLabels[status] || status.toUpperCase();

    return (
        <span
            className={`
        inline-flex items-center px-2 py-0.5 
        text-xs font-medium uppercase tracking-wide
        rounded border
        ${statusStyles[status]}
        ${className}
      `}
        >
            {label}
        </span>
    );
}
