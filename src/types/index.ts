// Agent Coordination Dashboard - Type Definitions

export type AgentStatus = 'active' | 'stuck' | 'offline' | 'idle';
export type TaskStatus = 'in-progress' | 'stuck' | 'completed' | 'pending';
export type SenderType = 'human' | 'master' | 'agent';

export interface Agent {
    id: string;
    name: string;
    currentTask: string;
    status: AgentStatus;
    lastActive: Date;
}

export interface Task {
    id: string;
    title: string;
    assignedAgents: string[];
    status: TaskStatus;
    lastUpdate: Date;
    timeline?: TaskEvent[];
}

export interface TaskEvent {
    id: string;
    timestamp: Date;
    type: 'created' | 'assigned' | 'status-change' | 'message';
    description: string;
    agentId?: string;
}

export interface Message {
    id: string;
    sender: SenderType;
    agentName?: string;
    text: string;
    timestamp: Date;
    taskId?: string;
    isError?: boolean;
}

export interface UIState {
    drawerOpen: boolean;
    selectedAgentId: string | null;
    modalType: 'task-view' | 'task-thread' | null;
    selectedTaskId: string | null;
    commandPaletteOpen: boolean;
    activeSender: 'human' | 'master';
}
