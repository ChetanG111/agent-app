// Mock API Layer with simulated latency and random failures

import { Agent, Task, Message, TaskStatus, SenderType } from '@/types';
import { mockAgents, mockTasks, mockMessages } from '@/mock/data';

// Simulate network latency
const delay = (min: number, max: number) =>
    new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

// Simulate random failures (10% chance)
const mayFail = () => {
    if (Math.random() < 0.1) {
        throw new Error('Network request failed. Please try again.');
    }
};

// In-memory state (simulates server-side state)
let agents = [...mockAgents];
let tasks = [...mockTasks];
let messages = [...mockMessages];

export async function fetchAgents(): Promise<Agent[]> {
    await delay(300, 800);
    return agents.map(a => ({ ...a }));
}

export async function fetchTasks(): Promise<Task[]> {
    await delay(200, 600);
    return tasks.map(t => ({ ...t }));
}

export async function fetchMessages(): Promise<Message[]> {
    await delay(200, 400);
    return messages.map(m => ({ ...m }));
}

export async function fetchAgentHistory(agentId: string): Promise<Message[]> {
    await delay(200, 500);
    return messages
        .filter(m => m.agentName === agents.find(a => a.id === agentId)?.name)
        .map(m => ({ ...m }));
}

export async function fetchTaskThread(taskId: string): Promise<Message[]> {
    await delay(200, 500);
    return messages
        .filter(m => m.taskId === taskId)
        .map(m => ({ ...m }));
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    await delay(300, 600);
    mayFail();

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        throw new Error('Task not found');
    }

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        status,
        lastUpdate: new Date(),
        timeline: [
            ...(tasks[taskIndex].timeline || []),
            {
                id: `evt-${Date.now()}`,
                timestamp: new Date(),
                type: 'status-change',
                description: `Status changed to ${status}`,
            },
        ],
    };

    return { ...tasks[taskIndex] };
}

export async function updateAgentStatus(agentId: string, status: Agent['status']): Promise<Agent> {
    await delay(200, 400);

    const agentIndex = agents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) {
        throw new Error('Agent not found');
    }

    agents[agentIndex] = {
        ...agents[agentIndex],
        status,
        lastActive: new Date(),
    };

    return { ...agents[agentIndex] };
}

export async function sendMessage(
    text: string,
    sender: SenderType,
    taskId?: string
): Promise<Message> {
    await delay(150, 350);
    mayFail();

    const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender,
        text,
        timestamp: new Date(),
        taskId,
    };

    messages.push(newMessage);
    return { ...newMessage };
}

export async function executeSlashCommand(
    command: string
): Promise<{ success: boolean; message: string }> {
    await delay(300, 600);

    const cmd = command.toLowerCase().trim();

    if (cmd === '/pause') {
        agents = agents.map(a => ({ ...a, status: 'idle' as const }));
        return { success: true, message: 'All agents paused.' };
    }

    if (cmd === '/kill') {
        agents = agents.map(a => ({ ...a, status: 'offline' as const }));
        return { success: true, message: 'All agents terminated.' };
    }

    if (cmd.startsWith('/reassign')) {
        return { success: true, message: 'Task reassignment initiated.' };
    }

    return { success: false, message: `Unknown command: ${command}` };
}

// Reset to initial state (useful for testing)
export function resetMockState() {
    agents = [...mockAgents];
    tasks = [...mockTasks];
    messages = [...mockMessages];
}

// Get current state (for socket simulation)
export function getCurrentAgents() {
    return agents;
}

export function addMessage(message: Message) {
    messages.push(message);
}
