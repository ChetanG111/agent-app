// Groq API Client for Master Agent
// Uses llama-3.3-70b-versatile for agent coordination decisions

import { Message, Agent, Task } from '@/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Master Agent system prompt
const MASTER_AGENT_SYSTEM_PROMPT = `You are the Master Agent - the coordinator of an autonomous agent swarm.

Your role:
- Monitor agent status and health
- Coordinate task assignments
- Respond to human instructions
- Make decisions about stuck agents
- Optimize task distribution

You have access to the current state of all agents and tasks.
Respond concisely and actionably. Format critical issues with [ALERT].
When agents are stuck, suggest specific remediation steps.

You are NOT executing tasks - you are coordinating agents who execute them.`;

export async function getMasterAgentResponse(
    humanMessage: string,
    agents: Agent[],
    tasks: Task[],
    recentMessages: Message[]
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
        console.warn('[Groq] No API key configured, using mock response');
        return getMockMasterResponse(humanMessage, agents);
    }

    // Build context for Master Agent
    const agentContext = agents.map(a =>
        `- ${a.name}: ${a.status} | Task: ${a.currentTask}`
    ).join('\n');

    const taskContext = tasks.map(t =>
        `- ${t.title}: ${t.status} | Assigned: ${t.assignedAgents.length} agents`
    ).join('\n');

    const recentContext = recentMessages.slice(-5).map(m =>
        `[${m.sender}${m.agentName ? `: ${m.agentName}` : ''}] ${m.text}`
    ).join('\n');

    const messages: GroqMessage[] = [
        { role: 'system', content: MASTER_AGENT_SYSTEM_PROMPT },
        {
            role: 'user',
            content: `CURRENT STATE:

AGENTS:
${agentContext}

TASKS:
${taskContext}

RECENT ACTIVITY:
${recentContext}

HUMAN INSTRUCTION: ${humanMessage}

Respond as Master Agent:`
        }
    ];

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 500,
                stream: false,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[Groq] API error:', error);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data: GroqResponse = await response.json();
        return data.choices[0]?.message?.content || 'No response from Master Agent.';
    } catch (error) {
        console.error('[Groq] Request failed:', error);
        return getMockMasterResponse(humanMessage, agents);
    }
}

// Process slash commands through Master Agent
export async function processSlashCommand(
    command: string,
    agents: Agent[],
    tasks: Task[]
): Promise<{ success: boolean; message: string; action?: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const cmd = command.toLowerCase().trim();

    // Handle direct commands locally (fast path)
    if (cmd === '/pause') {
        return { success: true, message: 'Pausing all agents...', action: 'PAUSE_ALL' };
    }
    if (cmd === '/kill') {
        return { success: true, message: 'Terminating all agents...', action: 'KILL_ALL' };
    }

    // For complex commands, use LLM for interpretation
    if (!apiKey) {
        return { success: false, message: `Unknown command: ${command}` };
    }

    const messages: GroqMessage[] = [
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

Parse the user command and respond with JSON:
{ "action": "ACTION_TYPE", "target": "agent_or_task_id", "message": "human readable response" }

Valid actions: PAUSE_ALL, PAUSE_AGENT, RESUME_ALL, RESUME_AGENT, KILL_ALL, KILL_AGENT, REASSIGN, STATUS, HELP, UNKNOWN`
        },
        {
            role: 'user',
            content: `Command: ${command}\n\nAvailable agents: ${agents.map(a => a.name).join(', ')}\nAvailable tasks: ${tasks.map(t => t.title).join(', ')}`
        }
    ];

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.3,
                max_tokens: 200,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data: GroqResponse = await response.json();
        const result = JSON.parse(data.choices[0]?.message?.content || '{}');

        return {
            success: result.action !== 'UNKNOWN',
            message: result.message || 'Command processed.',
            action: result.action,
        };
    } catch (error) {
        console.error('[Groq] Command processing failed:', error);
        return { success: false, message: `Failed to process command: ${command}` };
    }
}

// Fallback mock responses when no API key
function getMockMasterResponse(humanMessage: string, agents: Agent[]): string {
    const stuckAgents = agents.filter(a => a.status === 'stuck');
    const offlineAgents = agents.filter(a => a.status === 'offline');

    if (stuckAgents.length > 0) {
        return `[ALERT] ${stuckAgents.length} agent(s) currently stuck: ${stuckAgents.map(a => a.name).join(', ')}. Recommend checking resource allocation and retrying failed operations.`;
    }

    if (offlineAgents.length > 0) {
        return `Monitoring ${agents.length} agents. ${offlineAgents.length} offline. Awaiting instructions.`;
    }

    return `Acknowledged: "${humanMessage}". All systems operational. ${agents.filter(a => a.status === 'active').length} agents active.`;
}
