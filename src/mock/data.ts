// Initial Data for Agent Coordination Dashboard
// Empty state - agents will be populated when they connect

import { Agent, Task, Message } from '@/types';

// Start with empty arrays - real agents will connect dynamically
export const mockAgents: Agent[] = [];

export const mockTasks: Task[] = [];

export const mockMessages: Message[] = [];

// Random message generators for WebSocket simulation (when needed)
const agentMessages = [
    'Processing data batch {n}...',
    'Completed checkpoint {n}.',
    'Analyzing results from sector {n}.',
    'Syncing with cluster node {n}.',
    'Executing subtask {n} of {m}.',
    'Waiting for upstream dependency.',
    'Memory optimization in progress.',
    'Cache invalidation complete.',
];

const errorMessages = [
    'ERROR: Connection timeout on node {n}.',
    'ERROR: Retry limit exceeded for batch {n}.',
    'WARNING: High latency detected.',
    'ERROR: Failed to acquire lock on resource {n}.',
];

export function generateRandomMessage(agents: Agent[]): Message {
    if (agents.length === 0) {
        return {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: 'master',
            agentName: 'System',
            text: 'Waiting for agents to connect...',
            timestamp: new Date(),
        };
    }

    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'stuck');
    const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)] || agents[0];

    const isError = Math.random() < 0.15;
    const templates = isError ? errorMessages : agentMessages;
    const template = templates[Math.floor(Math.random() * templates.length)];

    const text = template
        .replace('{n}', String(Math.floor(Math.random() * 20) + 1))
        .replace('{m}', String(Math.floor(Math.random() * 10) + 5));

    return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: 'agent',
        agentName: agent.name,
        text,
        timestamp: new Date(),
        isError,
    };
}

export function generateStatusUpdate(): { agentId: string; status: Agent['status'] } {
    const statuses: Agent['status'][] = ['active', 'idle', 'stuck'];
    // This will be called only if there are agents
    return {
        agentId: 'agent-1', // Placeholder - will be replaced by actual agent
        status: statuses[Math.floor(Math.random() * statuses.length)],
    };
}
