// API Route: Spawn Agent
// POST /api/agents/spawn

import { NextRequest, NextResponse } from 'next/server';
import { spawnAgent, getActiveAgents } from '@/agents/executor';
import { AgentRole, getSpawnableRoles } from '@/agents/roles';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role, name } = body as { role?: AgentRole; name?: string };

        if (!role) {
            return NextResponse.json(
                { error: 'Role is required' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = getSpawnableRoles();
        if (!validRoles.find(r => r.id === role)) {
            return NextResponse.json(
                {
                    error: `Invalid role: ${role}`,
                    validRoles: validRoles.map(r => r.id),
                },
                { status: 400 }
            );
        }

        const agent = spawnAgent(role, name);

        return NextResponse.json({
            success: true,
            agent: {
                id: agent.id,
                role: agent.role,
                name: agent.name,
                status: agent.status,
                createdAt: agent.createdAt,
            },
        });
    } catch (error) {
        console.error('[API] Spawn agent error:', error);
        return NextResponse.json(
            { error: 'Failed to spawn agent' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const agents = getActiveAgents();
        const roles = getSpawnableRoles();

        return NextResponse.json({
            agents: agents.map(a => ({
                id: a.id,
                role: a.role,
                name: a.name,
                status: a.status,
                currentTask: a.currentTask,
                lastActive: a.lastActive,
            })),
            availableRoles: roles.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                tools: r.tools,
            })),
        });
    } catch (error) {
        console.error('[API] Get agents error:', error);
        return NextResponse.json(
            { error: 'Failed to get agents' },
            { status: 500 }
        );
    }
}
