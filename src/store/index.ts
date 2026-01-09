// Zustand Store for Agent Coordination Dashboard

import { create } from 'zustand';
import { Agent, Task, Message, UIState, TaskStatus, SenderType } from '@/types';
import * as api from '@/lib/api';

interface StoreState {
    // Data
    agents: Agent[];
    tasks: Task[];
    messages: Message[];

    // Loading states
    agentsLoading: boolean;
    tasksLoading: boolean;
    messagesLoading: boolean;

    // UI State
    ui: UIState;

    // Actions - Data fetching
    fetchAgents: () => Promise<void>;
    fetchTasks: () => Promise<void>;
    fetchMessages: () => Promise<void>;

    // Actions - Mutations
    updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
    updateAgentStatus: (agentId: string, status: Agent['status']) => void;
    sendMessage: (text: string, sender: SenderType, taskId?: string) => Promise<void>;
    addMessage: (message: Message) => void;

    // Actions - UI
    openAgentDrawer: (agentId: string) => void;
    closeAgentDrawer: () => void;
    openTaskModal: (taskId: string, type: 'task-view' | 'task-thread') => void;
    closeModal: () => void;
    toggleCommandPalette: () => void;
    setActiveSender: (sender: 'human' | 'master') => void;
    closeAll: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
    // Initial data
    agents: [],
    tasks: [],
    messages: [],

    // Initial loading states
    agentsLoading: false,
    tasksLoading: false,
    messagesLoading: false,

    // Initial UI state
    ui: {
        drawerOpen: false,
        selectedAgentId: null,
        modalType: null,
        selectedTaskId: null,
        commandPaletteOpen: false,
        activeSender: 'human',
    },

    // Data fetching actions
    fetchAgents: async () => {
        set({ agentsLoading: true });
        try {
            const agents = await api.fetchAgents();
            set({ agents, agentsLoading: false });
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            set({ agentsLoading: false });
        }
    },

    fetchTasks: async () => {
        set({ tasksLoading: true });
        try {
            const tasks = await api.fetchTasks();
            set({ tasks, tasksLoading: false });
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            set({ tasksLoading: false });
        }
    },

    fetchMessages: async () => {
        set({ messagesLoading: true });
        try {
            const messages = await api.fetchMessages();
            set({ messages, messagesLoading: false });
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            set({ messagesLoading: false });
        }
    },

    // Mutation actions
    updateTaskStatus: async (taskId, status) => {
        try {
            const updatedTask = await api.updateTaskStatus(taskId, status);
            set(state => ({
                tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
            }));
        } catch (error) {
            console.error('Failed to update task status:', error);
            throw error;
        }
    },

    updateAgentStatus: (agentId, status) => {
        set(state => ({
            agents: state.agents.map(a =>
                a.id === agentId ? { ...a, status, lastActive: new Date() } : a
            ),
        }));
    },

    sendMessage: async (text, sender, taskId) => {
        try {
            const message = await api.sendMessage(text, sender, taskId);
            set(state => ({
                messages: [...state.messages, message],
            }));
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    },

    addMessage: (message) => {
        set(state => ({
            messages: [...state.messages, message],
        }));
    },

    // UI actions
    openAgentDrawer: (agentId) => {
        set(state => ({
            ui: {
                ...state.ui,
                drawerOpen: true,
                selectedAgentId: agentId,
                modalType: null,
                selectedTaskId: null,
            },
        }));
    },

    closeAgentDrawer: () => {
        set(state => ({
            ui: {
                ...state.ui,
                drawerOpen: false,
                selectedAgentId: null,
            },
        }));
    },

    openTaskModal: (taskId, type) => {
        set(state => ({
            ui: {
                ...state.ui,
                modalType: type,
                selectedTaskId: taskId,
                drawerOpen: false,
                selectedAgentId: null,
            },
        }));
    },

    closeModal: () => {
        set(state => ({
            ui: {
                ...state.ui,
                modalType: null,
                selectedTaskId: null,
            },
        }));
    },

    toggleCommandPalette: () => {
        set(state => ({
            ui: {
                ...state.ui,
                commandPaletteOpen: !state.ui.commandPaletteOpen,
            },
        }));
    },

    setActiveSender: (sender) => {
        set(state => ({
            ui: {
                ...state.ui,
                activeSender: sender,
            },
        }));
    },

    closeAll: () => {
        set(state => ({
            ui: {
                ...state.ui,
                drawerOpen: false,
                selectedAgentId: null,
                modalType: null,
                selectedTaskId: null,
                commandPaletteOpen: false,
            },
        }));
    },
}));

// Selectors
export const selectSelectedAgent = (state: StoreState) =>
    state.agents.find(a => a.id === state.ui.selectedAgentId);

export const selectSelectedTask = (state: StoreState) =>
    state.tasks.find(t => t.id === state.ui.selectedTaskId);

export const selectAgentMessages = (agentName: string) => (state: StoreState) =>
    state.messages.filter(m => m.agentName === agentName);

export const selectTaskMessages = (taskId: string) => (state: StoreState) =>
    state.messages.filter(m => m.taskId === taskId);
