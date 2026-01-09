// API Route: Master Agent Chat
// POST /api/master-agent
// Coordinates agents and handles task delegation

import { NextRequest, NextResponse } from 'next/server';
import { spawnAgent, executeTask, getActiveAgents, getAgent } from '@/agents/executor';
import { AgentRole, getSpawnableRoles } from '@/agents/roles';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MASTER_AGENT_SYSTEM_PROMPT = `You are the Master Agent - the coordinator of an autonomous agent swarm.

Your role:
- Parse human requests to identify required tasks
- Spawn appropriate agents for each task
- Coordinate multi-agent workflows
- Report results back to humans

AVAILABLE AGENT TYPES:
1. web-searcher (Scout) - Searches DuckDuckGo and Wikipedia for information
2. researcher (Sage) - Analyzes and synthesizes information
3. code-writer (Forge) - Generates and explains code
4. analyst (Oracle) - Analyzes data and provides recommendations

When you receive a request:
1. Determine which agent type is best suited
2. Respond with a JSON action block if you need to spawn an agent or execute a task
3. If you can answer directly, do so

RESPONSE FORMAT:
For spawning agents or executing tasks, include a JSON block:
\`\`\`json
{"action": "spawn_and_task", "role": "web-searcher", "task": "search query here"}
\`\`\`

For direct responses (no agent needed):
Just respond normally with your analysis or answer.

Be concise and actionable.`;

interface RequestBody {
    message: string;
    agents: Array<{ id: string; name: string; status: string; currentTask: string }>;
    tasks: Array<{ id: string; title: string; status: string; assignedAgents: string[] }>;
    recentMessages: Array<{ sender: string; agentName?: string; text: string }>;
}

// Parse JSON action from LLM response
function parseAction(text: string): { role: AgentRole; task: string } | null {
    try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            const json = JSON.parse(jsonMatch[1]);
            if (json.action === 'spawn_and_task' && json.role && json.task) {
                return { role: json.role, task: json.task };
            }
        }

        // Also try to find inline JSON
        const inlineMatch = text.match(/\{[^}]*"action"\s*:\s*"spawn_and_task"[^}]*\}/);
        if (inlineMatch) {
            const json = JSON.parse(inlineMatch[0]);
            if (json.role && json.task) {
                return { role: json.role, task: json.task };
            }
        }
    } catch (e) {
        // Not valid JSON, that's okay
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();
        const { message, agents = [], tasks = [], recentMessages = [] } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GROQ_API_KEY;
        const activeAgentsList = getActiveAgents();

        // Build context
        const agentContext = activeAgentsList.length > 0
            ? activeAgentsList.map(a => `- ${a.name} (${a.role}): ${a.status}${a.currentTask ? ` | Task: ${a.currentTask}` : ''}`).join('\n')
            : 'No agents currently active.';

        const availableRoles = getSpawnableRoles().map(r => `- ${r.id}: ${r.description}`).join('\n');

        // If no API key, use simple logic
        if (!apiKey || apiKey === 'your_groq_api_key_here') {
            // Simple keyword matching for task routing
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look up') || lowerMessage.includes('what is')) {
                // Spawn web searcher and execute
                const agent = spawnAgent('web-searcher');

                const result = await executeTask(agent.id, message, (msg) => {
                    console.log(`[Master] ${msg}`);
                });

                return NextResponse.json({
                    response: result.success
                        ? `**${agent.name} Report:**\n\n${result.output}\n\n*Sources: ${result.sources?.join(', ') || 'N/A'}*`
                        : `Task failed: ${result.error}`,
                    agentUsed: { id: agent.id, name: agent.name, role: agent.role },
                    taskResult: result,
                });
            }

            // No specific task detected
            return NextResponse.json({
                response: `I understand your request: "${message}"\n\nTo proceed, I can spawn one of these agents:\n${availableRoles}\n\nTry asking me to "search for X" or "look up Y" to activate the web searcher.`,
                agents: activeAgentsList.map(a => ({ id: a.id, name: a.name, role: a.role, status: a.status })),
            });
        }

        // Use Groq for intelligent routing
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: MASTER_AGENT_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `CURRENT AGENTS:
${agentContext}

AVAILABLE AGENT TYPES:
${availableRoles}

HUMAN REQUEST: ${message}

Analyze this request. If it requires an agent, include a JSON action block to spawn one. Otherwise, respond directly.`
                    }
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[Master Agent] Groq API error:', error);

            // Fallback to simple routing
            return NextResponse.json({
                response: `I'll help with: "${message}". Let me search for information...`,
                fallback: true,
            });
        }

        const data = await response.json();
        const llmResponse = data.choices[0]?.message?.content || '';

        // Check if LLM wants to spawn an agent
        const action = parseAction(llmResponse);

        if (action) {
            // Spawn agent and execute task
            const agent = spawnAgent(action.role);

            const result = await executeTask(agent.id, action.task, (msg) => {
                console.log(`[Master] ${msg}`);
            });

            // Clean response (remove JSON block)
            const cleanResponse = llmResponse.replace(/```json[\s\S]*?```/g, '').trim();

            return NextResponse.json({
                response: result.success
                    ? `${cleanResponse}\n\n**${agent.name} Report:**\n\n${result.output}\n\n*Sources: ${result.sources?.join(', ') || 'N/A'}*`
                    : `${cleanResponse}\n\n*Task failed: ${result.error}*`,
                agentUsed: { id: agent.id, name: agent.name, role: agent.role },
                taskResult: result,
            });
        }

        // Direct response from Master Agent
        return NextResponse.json({
            response: llmResponse,
            agents: activeAgentsList.map(a => ({ id: a.id, name: a.name, role: a.role, status: a.status })),
        });

    } catch (error) {
        console.error('[Master Agent] Error:', error);
        return NextResponse.json({
            response: 'Master Agent encountered an error. Please try again.',
            error: String(error),
        });
    }
}
