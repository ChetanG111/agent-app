// WebSocket Simulation for real-time updates

import { Message, Agent } from '@/types';
import { generateRandomMessage, generateStatusUpdate } from '@/mock/data';
import { getCurrentAgents, addMessage, updateAgentStatus } from '@/lib/api';

type MessageCallback = (message: Message) => void;
type StatusCallback = (agentId: string, status: Agent['status']) => void;
type StuckCallback = (agentId: string) => void;

interface SocketCallbacks {
    onMessage?: MessageCallback;
    onStatusUpdate?: StatusCallback;
    onAgentStuck?: StuckCallback;
}

class MockWebSocket {
    private callbacks: SocketCallbacks = {};
    private messageInterval: NodeJS.Timeout | null = null;
    private statusInterval: NodeJS.Timeout | null = null;
    private connected = false;

    connect() {
        if (this.connected) return;
        this.connected = true;

        // Simulate new messages every 8-20 seconds
        this.messageInterval = setInterval(() => {
            if (!this.connected) return;

            const agents = getCurrentAgents();
            const message = generateRandomMessage(agents);
            addMessage(message);

            if (this.callbacks.onMessage) {
                this.callbacks.onMessage(message);
            }
        }, Math.random() * 12000 + 8000);

        // Simulate status updates every 5-15 seconds
        this.statusInterval = setInterval(async () => {
            if (!this.connected) return;

            const update = generateStatusUpdate();

            try {
                await updateAgentStatus(update.agentId, update.status);

                if (this.callbacks.onStatusUpdate) {
                    this.callbacks.onStatusUpdate(update.agentId, update.status);
                }

                // Trigger stuck callback for stuck status
                if (update.status === 'stuck' && this.callbacks.onAgentStuck) {
                    this.callbacks.onAgentStuck(update.agentId);
                }
            } catch (error) {
                console.error('Failed to update agent status:', error);
            }
        }, Math.random() * 10000 + 5000);

        console.log('[Socket] Connected to mock WebSocket');
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

        console.log('[Socket] Disconnected from mock WebSocket');
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

    // Manually emit a message (for testing)
    emitMessage(message: Message) {
        if (this.callbacks.onMessage) {
            this.callbacks.onMessage(message);
        }
    }

    // Manually trigger a stuck event
    emitStuck(agentId: string) {
        if (this.callbacks.onAgentStuck) {
            this.callbacks.onAgentStuck(agentId);
        }
    }
}

// Singleton instance
export const mockSocket = new MockWebSocket();
