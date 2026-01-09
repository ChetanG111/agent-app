// API Layer - Supports both Mock and Real Backend modes
// Toggle via NEXT_PUBLIC_MOCK_MODE environment variable

import { Agent, Task, Message, TaskStatus, SenderType } from '@/types';
import { mockAgents, mockTasks, mockMessages } from '@/mock/data';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

// Simulate network latency (mock mode only)
const delay = (min: number, max: number) =>
    new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

// Simulate random failures (mock mode only, 10% chance)
const mayFail = () => {
    if (Math.random() < 0.1) {
        throw new Error('Network request failed. Please try again.');
    }
};

// In-memory state for mock mode
let agents = [...mockAgents];
let tasks = [...mockTasks];
let messages = [...mockMessages];

// Helper for real API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `API error: ${response.status}`);
    }

    return response.json();
}

// ============================================================================
// FETCH OPERATIONS
// ============================================================================

export async function fetchAgents(): Promise<Agent[]> {
    // Always try to get from real agent API first
    try {
        const response = await fetch('/api/agents/spawn');
        if (response.ok) {
            const data = await response.json();
            console.log('[API] Fetched agents from server:', data);

            if (data.agents && data.agents.length > 0) {
                // Map executor agents to frontend Agent type
                const serverAgents = data.agents.map((a: { id: string; name: string; role: string; status: string; currentTask: string | null; lastActive: string }) => ({
                    id: a.id,
                    name: a.name,
                    currentTask: a.currentTask || `Idle (${a.role})`,
                    status: a.status as Agent['status'],
                    lastActive: new Date(a.lastActive),
                }));

                // Sync to local state for socket simulation
                agents = serverAgents;

                return serverAgents;
            }
        }
    } catch (e) {
        console.log('[API] Could not fetch from agent executor:', e);
    }

    // Return local state
    return agents.map(a => ({ ...a }));
}

export async function fetchTasks(): Promise<Task[]> {
    if (USE_MOCK) {
        await delay(200, 600);
        return tasks.map(t => ({ ...t }));
    }

    const data = await apiCall<Task[]>('/tasks');
    return data.map(t => ({
        ...t,
        lastUpdate: new Date(t.lastUpdate),
        timeline: t.timeline?.map(e => ({
            ...e,
            timestamp: new Date(e.timestamp),
        })),
    }));
}

export async function fetchMessages(): Promise<Message[]> {
    if (USE_MOCK) {
        await delay(200, 400);
        return messages.map(m => ({ ...m }));
    }

    const data = await apiCall<Message[]>('/messages');
    return data.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
    }));
}

export async function fetchAgentHistory(agentId: string): Promise<Message[]> {
    if (USE_MOCK) {
        await delay(200, 500);
        return messages
            .filter(m => m.agentName === agents.find(a => a.id === agentId)?.name)
            .map(m => ({ ...m }));
    }

    const data = await apiCall<Message[]>(`/agents/${agentId}/messages`);
    return data.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
    }));
}

export async function fetchTaskThread(taskId: string): Promise<Message[]> {
    if (USE_MOCK) {
        await delay(200, 500);
        return messages
            .filter(m => m.taskId === taskId)
            .map(m => ({ ...m }));
    }

    const data = await apiCall<Message[]>(`/tasks/${taskId}/messages`);
    return data.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
    }));
}

// ============================================================================
// MUTATION OPERATIONS
// ============================================================================

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    if (USE_MOCK) {
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

    const data = await apiCall<Task>(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

    return {
        ...data,
        lastUpdate: new Date(data.lastUpdate),
        timeline: data.timeline?.map(e => ({
            ...e,
            timestamp: new Date(e.timestamp),
        })),
    };
}

export async function updateAgentStatus(agentId: string, status: Agent['status']): Promise<Agent | null> {
    if (USE_MOCK) {
        await delay(200, 400);

        const agentIndex = agents.findIndex(a => a.id === agentId);
        if (agentIndex === -1) {
            // Agent not found - return null instead of throwing
            return null;
        }

        agents[agentIndex] = {
            ...agents[agentIndex],
            status,
            lastActive: new Date(),
        };

        return { ...agents[agentIndex] };
    }

    const data = await apiCall<Agent>(`/agents/${agentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

    return {
        ...data,
        lastActive: new Date(data.lastActive),
    };
}

export async function sendMessage(
    text: string,
    sender: SenderType,
    taskId?: string
): Promise<Message> {
    if (USE_MOCK) {
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

    const data = await apiCall<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify({ text, sender, taskId }),
    });

    return {
        ...data,
        timestamp: new Date(data.timestamp),
    };
}

// ============================================================================
// COMMAND OPERATIONS
// ============================================================================

export async function executeSlashCommand(
    command: string
): Promise<{ success: boolean; message: string; action?: string }> {
    if (USE_MOCK) {
        await delay(300, 600);

        const cmd = command.toLowerCase().trim();

        if (cmd === '/pause') {
            agents = agents.map(a => ({ ...a, status: 'idle' as const }));
            return { success: true, message: 'All agents paused.', action: 'PAUSE_ALL' };
        }

        if (cmd === '/kill') {
            agents = agents.map(a => ({ ...a, status: 'offline' as const }));
            return { success: true, message: 'All agents terminated.', action: 'KILL_ALL' };
        }

        if (cmd === '/resume') {
            agents = agents.map(a => ({ ...a, status: 'active' as const }));
            return { success: true, message: 'All agents resumed.', action: 'RESUME_ALL' };
        }

        if (cmd.startsWith('/reassign')) {
            return { success: true, message: 'Task reassignment initiated.', action: 'REASSIGN' };
        }

        if (cmd === '/status') {
            const active = agents.filter(a => a.status === 'active').length;
            const stuck = agents.filter(a => a.status === 'stuck').length;
            const offline = agents.filter(a => a.status === 'offline').length;
            return {
                success: true,
                message: `Status: ${active} active, ${stuck} stuck, ${offline} offline.`,
                action: 'STATUS'
            };
        }

        if (cmd === '/help') {
            return {
                success: true,
                message: 'Commands: /pause, /resume, /kill, /reassign, /status, /help',
                action: 'HELP'
            };
        }

        return { success: false, message: `Unknown command: ${command}` };
    }

    // Real backend call
    return apiCall('/commands', {
        method: 'POST',
        body: JSON.stringify({ command }),
    });
}

// ============================================================================
// BATCH OPERATIONS (for bulk agent control)
// ============================================================================

export async function pauseAllAgents(): Promise<void> {
    if (USE_MOCK) {
        agents = agents.map(a => ({ ...a, status: 'idle' as const }));
        return;
    }

    await apiCall('/agents/pause', { method: 'POST' });
}

export async function resumeAllAgents(): Promise<void> {
    if (USE_MOCK) {
        agents = agents.map(a => ({ ...a, status: 'active' as const }));
        return;
    }

    await apiCall('/agents/resume', { method: 'POST' });
}

export async function killAllAgents(): Promise<void> {
    if (USE_MOCK) {
        agents = agents.map(a => ({ ...a, status: 'offline' as const }));
        return;
    }

    await apiCall('/agents/kill', { method: 'POST' });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Reset to initial state (useful for testing)
export function resetMockState() {
    agents = [...mockAgents];
    tasks = [...mockTasks];
    messages = [...mockMessages];
}

// Get current state (for socket simulation in mock mode)
export function getCurrentAgents() {
    return agents;
}

export function getCurrentTasks() {
    return tasks;
}

export function addMessage(message: Message) {
    messages.push(message);
}

// Check if running in mock mode
export function isMockMode(): boolean {
    return USE_MOCK;
}

// Add agent to local state (for syncing spawned agents)
export function addAgent(agent: Agent): void {
    const existingIndex = agents.findIndex(a => a.id === agent.id);
    if (existingIndex >= 0) {
        agents[existingIndex] = agent;
    } else {
        agents.push(agent);
    }
    console.log('[API] Added agent to local state:', agent.name);
}

// Remove agent from local state
export function removeAgent(agentId: string): void {
    agents = agents.filter(a => a.id !== agentId);
}
