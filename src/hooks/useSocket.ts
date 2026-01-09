// WebSocket Hook for real-time updates

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { mockSocket } from '@/lib/socket';
import { toast } from 'react-hot-toast';

export function useSocket() {
    const { addMessage, updateAgentStatus, agents } = useStore();
    const connectedRef = useRef(false);

    useEffect(() => {
        if (connectedRef.current) return;
        connectedRef.current = true;

        mockSocket.connect();

        mockSocket.subscribe({
            onMessage: (message) => {
                addMessage(message);
                if (message.isError) {
                    toast.error(`${message.agentName}: ${message.text}`, {
                        duration: 4000,
                        style: {
                            background: '#1f2937',
                            color: '#f87171',
                            border: '1px solid #374151',
                        },
                    });
                }
            },
            onStatusUpdate: (agentId, status) => {
                updateAgentStatus(agentId, status);
            },
            onAgentStuck: (agentId) => {
                const agent = agents.find(a => a.id === agentId);
                if (agent) {
                    toast(`${agent.name} is now stuck!`, {
                        icon: '⚠️',
                        duration: 5000,
                        style: {
                            background: '#1f2937',
                            color: '#fbbf24',
                            border: '1px solid #374151',
                        },
                    });
                }
            },
        });

        return () => {
            mockSocket.disconnect();
            connectedRef.current = false;
        };
    }, [addMessage, updateAgentStatus, agents]);

    return { isConnected: mockSocket.isConnected() };
}
