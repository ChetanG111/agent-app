// Agent Executor
// Runs agents with their assigned tools and Groq LLM

import { AgentRole, getAgentRole } from './roles';
import { searchDuckDuckGo, formatDuckDuckGoResults } from './tools/duckduckgo';
import { searchAndSummarize, formatWikipediaResults } from './tools/wikipedia';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface AgentInstance {
    id: string;
    role: AgentRole;
    name: string;
    status: 'active' | 'idle' | 'stuck' | 'offline';
    currentTask: string | null;
    createdAt: Date;
    lastActive: Date;
}

export interface TaskResult {
    success: boolean;
    output: string;
    sources?: string[];
    error?: string;
    toolsUsed: string[];
    duration: number;
}

// In-memory agent registry
const activeAgents = new Map<string, AgentInstance>();

/**
 * Spawn a new agent with the given role
 */
export function spawnAgent(role: AgentRole, customName?: string): AgentInstance {
    const roleConfig = getAgentRole(role);
    const id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const agent: AgentInstance = {
        id,
        role,
        name: customName || `${roleConfig.name}-${activeAgents.size + 1}`,
        status: 'idle',
        currentTask: null,
        createdAt: new Date(),
        lastActive: new Date(),
    };

    activeAgents.set(id, agent);
    console.log(`[Agent] Spawned ${agent.name} (${role})`);

    return agent;
}

/**
 * Get all active agents
 */
export function getActiveAgents(): AgentInstance[] {
    return Array.from(activeAgents.values());
}

/**
 * Get agent by ID
 */
export function getAgent(id: string): AgentInstance | undefined {
    return activeAgents.get(id);
}

/**
 * Update agent status
 */
export function updateAgentStatus(id: string, status: AgentInstance['status'], task?: string | null): void {
    const agent = activeAgents.get(id);
    if (agent) {
        agent.status = status;
        agent.lastActive = new Date();
        if (task !== undefined) {
            agent.currentTask = task;
        }
    }
}

/**
 * Execute a task with the given agent
 */
export async function executeTask(
    agentId: string,
    task: string,
    onProgress?: (message: string) => void
): Promise<TaskResult> {
    const agent = activeAgents.get(agentId);
    if (!agent) {
        return {
            success: false,
            output: 'Agent not found',
            error: 'Agent not found',
            toolsUsed: [],
            duration: 0,
        };
    }

    const startTime = Date.now();
    const roleConfig = getAgentRole(agent.role);
    const toolsUsed: string[] = [];
    const sources: string[] = [];

    // Update agent status
    updateAgentStatus(agentId, 'active', task);
    onProgress?.(`${agent.name} starting task: ${task}`);

    try {
        // Gather context from tools
        let toolContext = '';

        // Use DuckDuckGo if available
        if (roleConfig.tools.includes('duckduckgo')) {
            onProgress?.(`${agent.name} searching DuckDuckGo...`);
            const ddgResults = await searchDuckDuckGo(task);
            toolContext += '\n\n--- DuckDuckGo Results ---\n';
            toolContext += formatDuckDuckGoResults(ddgResults);
            toolsUsed.push('duckduckgo');

            if (ddgResults.abstractUrl) {
                sources.push(ddgResults.abstractUrl);
            }
            ddgResults.results.slice(0, 3).forEach(r => sources.push(r.url));
        }

        // Use Wikipedia if available
        if (roleConfig.tools.includes('wikipedia')) {
            onProgress?.(`${agent.name} searching Wikipedia...`);
            const wikiResults = await searchAndSummarize(task);
            toolContext += '\n\n--- Wikipedia Results ---\n';
            toolContext += formatWikipediaResults(wikiResults);
            toolsUsed.push('wikipedia');

            wikiResults.summaries.forEach(s => sources.push(s.url));
        }

        // Now use Groq LLM to process and respond
        onProgress?.(`${agent.name} analyzing results...`);

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'your_groq_api_key_here') {
            // Mock response if no API key
            const output = `**${agent.name} Report**\n\nTask: ${task}\n\n${toolContext}\n\n*Note: Using mock mode. Add GROQ_API_KEY for AI-powered analysis.*`;

            updateAgentStatus(agentId, 'idle', null);

            return {
                success: true,
                output,
                sources: [...new Set(sources)],
                toolsUsed,
                duration: Date.now() - startTime,
            };
        }

        // Call Groq for intelligent response
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: roleConfig.systemPrompt },
                    {
                        role: 'user',
                        content: `TASK: ${task}

TOOL RESULTS:
${toolContext}

Based on the above information, provide a comprehensive response to the task. Be concise but thorough. Cite sources where relevant.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const output = data.choices[0]?.message?.content || 'No response generated.';

        updateAgentStatus(agentId, 'idle', null);
        onProgress?.(`${agent.name} completed task`);

        return {
            success: true,
            output,
            sources: [...new Set(sources)],
            toolsUsed,
            duration: Date.now() - startTime,
        };

    } catch (error) {
        console.error(`[Agent ${agent.name}] Task failed:`, error);
        updateAgentStatus(agentId, 'stuck', task);

        return {
            success: false,
            output: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error: String(error),
            toolsUsed,
            duration: Date.now() - startTime,
        };
    }
}

/**
 * Kill an agent
 */
export function killAgent(id: string): boolean {
    const agent = activeAgents.get(id);
    if (agent) {
        updateAgentStatus(id, 'offline', null);
        console.log(`[Agent] Killed ${agent.name}`);
        return true;
    }
    return false;
}

/**
 * Kill all agents
 */
export function killAllAgents(): void {
    for (const id of activeAgents.keys()) {
        killAgent(id);
    }
}

/**
 * Remove offline agents
 */
export function cleanupAgents(): number {
    let removed = 0;
    for (const [id, agent] of activeAgents.entries()) {
        if (agent.status === 'offline') {
            activeAgents.delete(id);
            removed++;
        }
    }
    return removed;
}
