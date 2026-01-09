// WebSocket Layer - Supports both Mock and Real WebSocket modes
// Toggle via NEXT_PUBLIC_MOCK_MODE environment variable

import { Message, Agent, Task } from '@/types';
import { generateRandomMessage, generateStatusUpdate } from '@/mock/data';
import { getCurrentAgents, addMessage, updateAgentStatus, isMockMode } from '@/lib/api';

// WebSocket event types
export type SocketEventType =
    | 'agent_update'
    | 'task_update'
    | 'message'
    | 'agent_stuck'
    | 'connection_status';

export interface SocketEvent {
    type: SocketEventType;
    payload: unknown;
    timestamp: Date;
}

// Callback types
type MessageCallback = (message: Message) => void;
type AgentStatusCallback = (agentId: string, status: Agent['status']) => void;
type TaskStatusCallback = (taskId: string, status: Task['status']) => void;
type StuckCallback = (agentId: string) => void;
type ConnectionCallback = (connected: boolean) => void;

interface SocketCallbacks {
    onMessage?: MessageCallback;
    onAgentUpdate?: AgentStatusCallback;
    onTaskUpdate?: TaskStatusCallback;
    onAgentStuck?: StuckCallback;
    onConnectionChange?: ConnectionCallback;
}

// ============================================================================
// MOCK WEBSOCKET (for development)
// ============================================================================

class MockWebSocket {
    private callbacks: SocketCallbacks = {};
    private messageInterval: NodeJS.Timeout | null = null;
    private statusInterval: NodeJS.Timeout | null = null;
    private connected = false;

    connect() {
        if (this.connected) return;
        this.connected = true;

        console.log('[MockSocket] Connected');
        this.callbacks.onConnectionChange?.(true);

        // Simulate new messages every 8-20 seconds (only if agents exist)
        this.messageInterval = setInterval(() => {
            if (!this.connected) return;

            const agents = getCurrentAgents();
            if (agents.length === 0) return; // Skip if no agents

            const message = generateRandomMessage(agents);
            addMessage(message);

            this.callbacks.onMessage?.(message);
        }, Math.random() * 12000 + 8000);

        // Simulate status updates every 5-15 seconds (only if agents exist)
        this.statusInterval = setInterval(async () => {
            if (!this.connected) return;

            const agents = getCurrentAgents();
            if (agents.length === 0) return; // Skip if no agents

            // Pick a random existing agent
            const randomAgent = agents[Math.floor(Math.random() * agents.length)];
            const statuses: ('active' | 'idle' | 'stuck')[] = ['active', 'idle', 'stuck'];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

            try {
                await updateAgentStatus(randomAgent.id, newStatus);
                this.callbacks.onAgentUpdate?.(randomAgent.id, newStatus);

                // Trigger stuck callback for stuck status
                if (newStatus === 'stuck') {
                    this.callbacks.onAgentStuck?.(randomAgent.id);
                }
            } catch (error) {
                // Silently ignore - agent may have been removed
            }
        }, Math.random() * 10000 + 5000);
    }

    disconnect() {
        this.connected = false;

        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
        }

        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }

        console.log('[MockSocket] Disconnected');
        this.callbacks.onConnectionChange?.(false);
    }

    subscribe(callbacks: SocketCallbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    unsubscribe(callbackType: keyof SocketCallbacks) {
        delete this.callbacks[callbackType];
    }

    isConnected() {
        return this.connected;
    }

    // Manual emit for testing
    emitMessage(message: Message) {
        this.callbacks.onMessage?.(message);
    }

    emitStuck(agentId: string) {
        this.callbacks.onAgentStuck?.(agentId);
    }
}

// ============================================================================
// REAL WEBSOCKET (for production)
// ============================================================================

class RealWebSocket {
    private ws: WebSocket | null = null;
    private callbacks: SocketCallbacks = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private url: string;

    constructor() {
        this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    }

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        console.log('[RealSocket] Connecting to', this.url);

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[RealSocket] Connected');
                this.reconnectAttempts = 0;
                this.callbacks.onConnectionChange?.(true);
            };

            this.ws.onclose = (event) => {
                console.log('[RealSocket] Disconnected:', event.code, event.reason);
                this.callbacks.onConnectionChange?.(false);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[RealSocket] Error:', error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        } catch (error) {
            console.error('[RealSocket] Failed to connect:', error);
            this.attemptReconnect();
        }
    }

    private handleMessage(data: string) {
        try {
            const event: SocketEvent = JSON.parse(data);

            switch (event.type) {
                case 'message': {
                    const message = event.payload as Message;
                    message.timestamp = new Date(message.timestamp);
                    this.callbacks.onMessage?.(message);
                    break;
                }

                case 'agent_update': {
                    const { agentId, status } = event.payload as { agentId: string; status: Agent['status'] };
                    this.callbacks.onAgentUpdate?.(agentId, status);
                    if (status === 'stuck') {
                        this.callbacks.onAgentStuck?.(agentId);
                    }
                    break;
                }

                case 'task_update': {
                    const { taskId, status } = event.payload as { taskId: string; status: Task['status'] };
                    this.callbacks.onTaskUpdate?.(taskId, status);
                    break;
                }

                case 'agent_stuck': {
                    const { agentId } = event.payload as { agentId: string };
                    this.callbacks.onAgentStuck?.(agentId);
                    break;
                }

                default:
                    console.warn('[RealSocket] Unknown event type:', event.type);
            }
        } catch (error) {
            console.error('[RealSocket] Failed to parse message:', error, data);
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[RealSocket] Max reconnect attempts reached');
            return;
        }

        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;

        console.log(`[RealSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        console.log('[RealSocket] Disconnected');
        this.callbacks.onConnectionChange?.(false);
    }

    subscribe(callbacks: SocketCallbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    unsubscribe(callbackType: keyof SocketCallbacks) {
        delete this.callbacks[callbackType];
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // Send message to server
    send(type: string, payload: unknown) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[RealSocket] Cannot send, not connected');
            return;
        }

        this.ws.send(JSON.stringify({ type, payload, timestamp: new Date() }));
    }

    // Manual emit for testing
    emitMessage(message: Message) {
        this.callbacks.onMessage?.(message);
    }

    emitStuck(agentId: string) {
        this.callbacks.onAgentStuck?.(agentId);
    }
}

// ============================================================================
// SOCKET MANAGER (auto-selects based on mode)
// ============================================================================

interface SocketInterface {
    connect: () => void;
    disconnect: () => void;
    subscribe: (callbacks: SocketCallbacks) => void;
    unsubscribe: (callbackType: keyof SocketCallbacks) => void;
    isConnected: () => boolean;
    emitMessage: (message: Message) => void;
    emitStuck: (agentId: string) => void;
}

// Create socket instance based on mode
function createSocket(): SocketInterface {
    if (isMockMode()) {
        console.log('[Socket] Using mock WebSocket');
        return new MockWebSocket();
    } else {
        console.log('[Socket] Using real WebSocket');
        return new RealWebSocket();
    }
}

// Singleton instance - defer creation until after environment is loaded
let socketInstance: SocketInterface | null = null;

export function getSocket(): SocketInterface {
    if (!socketInstance) {
        socketInstance = createSocket();
    }
    return socketInstance;
}

// Legacy export for backward compatibility
export const mockSocket = {
    connect: () => getSocket().connect(),
    disconnect: () => getSocket().disconnect(),
    subscribe: (callbacks: SocketCallbacks) => getSocket().subscribe(callbacks),
    unsubscribe: (callbackType: keyof SocketCallbacks) => getSocket().unsubscribe(callbackType),
    isConnected: () => getSocket().isConnected(),
    emitMessage: (message: Message) => getSocket().emitMessage(message),
    emitStuck: (agentId: string) => getSocket().emitStuck(agentId),
};
