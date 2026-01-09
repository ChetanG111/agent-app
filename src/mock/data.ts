// Mock Data Generators for Agent Coordination Dashboard

import { Agent, Task, Message, TaskEvent } from '@/types';

export const mockAgents: Agent[] = [
    {
        id: 'agent-1',
        name: 'Logic-Omega',
        currentTask: 'Revenue Projection',
        status: 'stuck',
        lastActive: new Date(Date.now() - 60000), // 1 min ago
    },
    {
        id: 'agent-2',
        name: 'Deployer-04',
        currentTask: 'Cloud Migration',
        status: 'offline',
        lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
        id: 'agent-3',
        name: 'Scout-01',
        currentTask: 'Q3 Market Data',
        status: 'active',
        lastActive: new Date(Date.now() - 30000), // 30 sec ago
    },
    {
        id: 'agent-4',
        name: 'Master Agent',
        currentTask: 'Cluster Coordination',
        status: 'active',
        lastActive: new Date(),
    },
    {
        id: 'agent-5',
        name: 'Analyzer-X',
        currentTask: 'Data Validation',
        status: 'idle',
        lastActive: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    },
];

export const mockTasks: Task[] = [
    {
        id: 'task-1',
        title: 'Revenue Projection Q4',
        assignedAgents: ['agent-1', 'agent-3'],
        status: 'in-progress',
        lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
        timeline: [
            { id: 'evt-1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'created', description: 'Task created by Human' },
            { id: 'evt-2', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), type: 'assigned', description: 'Assigned to Logic-Omega', agentId: 'agent-1' },
            { id: 'evt-3', timestamp: new Date(Date.now() - 60 * 60 * 1000), type: 'assigned', description: 'Assigned to Scout-01', agentId: 'agent-3' },
            { id: 'evt-4', timestamp: new Date(Date.now() - 30 * 60 * 1000), type: 'status-change', description: 'Status changed to in-progress' },
        ],
    },
    {
        id: 'task-2',
        title: 'Legacy DB Migration',
        assignedAgents: ['agent-2', 'agent-5', 'agent-1'],
        status: 'stuck',
        lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
        timeline: [
            { id: 'evt-5', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'created', description: 'Task created by Master Agent' },
            { id: 'evt-6', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), type: 'assigned', description: 'Assigned to Deployer-04', agentId: 'agent-2' },
            { id: 'evt-7', timestamp: new Date(Date.now() - 60 * 60 * 1000), type: 'status-change', description: 'Status changed to stuck' },
        ],
    },
    {
        id: 'task-3',
        title: 'API Integration Testing',
        assignedAgents: ['agent-3'],
        status: 'completed',
        lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        timeline: [
            { id: 'evt-8', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), type: 'created', description: 'Task created by Human' },
            { id: 'evt-9', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), type: 'assigned', description: 'Assigned to Scout-01', agentId: 'agent-3' },
            { id: 'evt-10', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'status-change', description: 'Status changed to completed' },
        ],
    },
];

export const mockMessages: Message[] = [
    {
        id: 'msg-1',
        sender: 'master',
        agentName: 'Master Agent',
        text: 'Cluster initialized. Waiting for task allocation.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
        id: 'msg-2',
        sender: 'agent',
        agentName: 'Scout-01',
        text: 'Acquiring market data for Q3 audit...',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
    },
    {
        id: 'msg-3',
        sender: 'human',
        text: 'Prioritize the tech sector specifically.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
        id: 'msg-4',
        sender: 'agent',
        agentName: 'Logic-Omega',
        text: 'ERROR: Timeout on calculation node 7.',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        isError: true,
    },
];

// Random message generators for WebSocket simulation
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
    return {
        agentId: mockAgents[Math.floor(Math.random() * mockAgents.length)].id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
    };
}
