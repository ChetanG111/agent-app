// API Route: Execute Task
// POST /api/agents/task

import { NextRequest, NextResponse } from 'next/server';
import { executeTask, getActiveAgents, spawnAgent, getAgent } from '@/agents/executor';
import { AgentRole } from '@/agents/roles';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, task, role } = body as {
            agentId?: string;
            task: string;
            role?: AgentRole;
        };

        if (!task) {
            return NextResponse.json(
                { error: 'Task is required' },
                { status: 400 }
            );
        }

        let targetAgentId = agentId;

        // If no agent specified, spawn one based on role
        if (!targetAgentId) {
            // Default to web-searcher if no role specified
            const targetRole: AgentRole = role || 'web-searcher';

            // Check if there's an idle agent of this role
            const agents = getActiveAgents();
            const idleAgent = agents.find(a => a.role === targetRole && a.status === 'idle');

            if (idleAgent) {
                targetAgentId = idleAgent.id;
            } else {
                // Spawn a new agent
                const newAgent = spawnAgent(targetRole);
                targetAgentId = newAgent.id;
            }
        }

        const agent = getAgent(targetAgentId);
        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        // Execute the task
        const progressMessages: string[] = [];
        const result = await executeTask(targetAgentId, task, (msg) => {
            progressMessages.push(msg);
        });

        return NextResponse.json({
            success: result.success,
            agent: {
                id: agent.id,
                name: agent.name,
                role: agent.role,
            },
            task,
            result: {
                output: result.output,
                sources: result.sources,
                toolsUsed: result.toolsUsed,
                duration: result.duration,
            },
            progress: progressMessages,
            error: result.error,
        });
    } catch (error) {
        console.error('[API] Task execution error:', error);
        return NextResponse.json(
            { error: 'Failed to execute task' },
            { status: 500 }
        );
    }
}
