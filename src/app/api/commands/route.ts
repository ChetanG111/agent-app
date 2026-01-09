// API Route: Execute Slash Commands
// POST /api/commands
// Uses Groq API for intelligent command parsing

import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface Agent {
    id: string;
    name: string;
    status: string;
}

interface Task {
    id: string;
    title: string;
    status: string;
}

interface RequestBody {
    command: string;
    agents: Agent[];
    tasks: Task[];
}

// Fast path for simple commands (no LLM needed)
function handleSimpleCommand(command: string): { handled: boolean; result?: { success: boolean; message: string; action: string } } {
    const cmd = command.toLowerCase().trim();

    if (cmd === '/pause') {
        return { handled: true, result: { success: true, message: 'All agents paused.', action: 'PAUSE_ALL' } };
    }
    if (cmd === '/resume') {
        return { handled: true, result: { success: true, message: 'All agents resumed.', action: 'RESUME_ALL' } };
    }
    if (cmd === '/kill') {
        return { handled: true, result: { success: true, message: 'All agents terminated.', action: 'KILL_ALL' } };
    }
    if (cmd === '/status') {
        return { handled: true, result: { success: true, message: 'Status check requested.', action: 'STATUS' } };
    }
    if (cmd === '/help') {
        return {
            handled: true,
            result: {
                success: true,
                message: 'Commands: /pause, /resume, /kill, /reassign [task] to [agent], /status, /help',
                action: 'HELP'
            }
        };
    }

    return { handled: false };
}

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();
        const { command, agents, tasks } = body;

        if (!command) {
            return NextResponse.json(
                { error: 'Command is required' },
                { status: 400 }
            );
        }

        // Try simple command first (no LLM)
        const simple = handleSimpleCommand(command);
        if (simple.handled) {
            return NextResponse.json(simple.result);
        }

        // For complex commands, use LLM
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            // Fallback without LLM
            return NextResponse.json({
                success: false,
                message: `Unknown command: ${command}. Try /help for available commands.`,
                action: 'UNKNOWN'
            });
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a command interpreter for an agent control system.
Available commands:
- /pause [agent] - Pause agent(s)
- /resume [agent] - Resume agent(s)
- /kill [agent] - Terminate agent(s)
- /reassign [task] to [agent] - Reassign a task
- /status - Get system status
- /help - List commands

Parse the user command and respond with JSON only:
{ "action": "ACTION_TYPE", "target": "agent_or_task_id_if_applicable", "message": "human readable response" }

Valid actions: PAUSE_ALL, PAUSE_AGENT, RESUME_ALL, RESUME_AGENT, KILL_ALL, KILL_AGENT, REASSIGN, STATUS, HELP, UNKNOWN`
                    },
                    {
                        role: 'user',
                        content: `Command: ${command}
                        
Available agents: ${agents.map(a => `${a.name} (${a.id})`).join(', ')}
Available tasks: ${tasks.map(t => `${t.title} (${t.id})`).join(', ')}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 150,
            }),
        });

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                message: `Failed to process command: ${command}`,
                action: 'ERROR'
            });
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '{}';

        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

            return NextResponse.json({
                success: result.action !== 'UNKNOWN',
                message: result.message || 'Command processed.',
                action: result.action,
                target: result.target,
            });
        } catch {
            return NextResponse.json({
                success: false,
                message: content,
                action: 'UNKNOWN'
            });
        }
    } catch (error) {
        console.error('[Commands] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
