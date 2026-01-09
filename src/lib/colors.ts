// Agent Colors - Unique color assignments for each agent
// Each agent gets a distinct color that persists across the UI

export interface AgentColor {
    bg: string;         // Background color class
    text: string;       // Text color class
    border: string;     // Border color class
    dot: string;        // Status dot accent
    gradient: string;   // Gradient for highlights
    hex: string;        // Raw hex for custom styling
}

// Vibrant, distinct color palette for agents
const AGENT_COLORS: AgentColor[] = [
    {
        bg: 'bg-violet-500/20',
        text: 'text-violet-400',
        border: 'border-violet-500/50',
        dot: 'bg-violet-400',
        gradient: 'from-violet-500/20 to-violet-600/10',
        hex: '#8b5cf6',
    },
    {
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400',
        border: 'border-cyan-500/50',
        dot: 'bg-cyan-400',
        gradient: 'from-cyan-500/20 to-cyan-600/10',
        hex: '#06b6d4',
    },
    {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
        dot: 'bg-amber-400',
        gradient: 'from-amber-500/20 to-amber-600/10',
        hex: '#f59e0b',
    },
    {
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
        dot: 'bg-rose-400',
        gradient: 'from-rose-500/20 to-rose-600/10',
        hex: '#f43f5e',
    },
    {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/50',
        dot: 'bg-emerald-400',
        gradient: 'from-emerald-500/20 to-emerald-600/10',
        hex: '#10b981',
    },
    {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/50',
        dot: 'bg-blue-400',
        gradient: 'from-blue-500/20 to-blue-600/10',
        hex: '#3b82f6',
    },
    {
        bg: 'bg-pink-500/20',
        text: 'text-pink-400',
        border: 'border-pink-500/50',
        dot: 'bg-pink-400',
        gradient: 'from-pink-500/20 to-pink-600/10',
        hex: '#ec4899',
    },
    {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/50',
        dot: 'bg-orange-400',
        gradient: 'from-orange-500/20 to-orange-600/10',
        hex: '#f97316',
    },
    {
        bg: 'bg-teal-500/20',
        text: 'text-teal-400',
        border: 'border-teal-500/50',
        dot: 'bg-teal-400',
        gradient: 'from-teal-500/20 to-teal-600/10',
        hex: '#14b8a6',
    },
    {
        bg: 'bg-indigo-500/20',
        text: 'text-indigo-400',
        border: 'border-indigo-500/50',
        dot: 'bg-indigo-400',
        gradient: 'from-indigo-500/20 to-indigo-600/10',
        hex: '#6366f1',
    },
];

// Cache for consistent agent-to-color mapping
const agentColorCache = new Map<string, AgentColor>();
let nextColorIndex = 0;

/**
 * Get a unique color for an agent. 
 * Once assigned, an agent always gets the same color.
 */
export function getAgentColor(agentId: string): AgentColor {
    if (agentColorCache.has(agentId)) {
        return agentColorCache.get(agentId)!;
    }

    // Assign next available color
    const color = AGENT_COLORS[nextColorIndex % AGENT_COLORS.length];
    agentColorCache.set(agentId, color);
    nextColorIndex++;

    return color;
}

/**
 * Get color by agent name (for messages where we only have the name)
 */
export function getAgentColorByName(agentName: string): AgentColor {
    // Check if we already have a color for an agent with this name
    for (const [, color] of agentColorCache.entries()) {
        // Simple hash based on name
        const hash = agentName.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        if (Math.abs(hash) % AGENT_COLORS.length === AGENT_COLORS.indexOf(color)) {
            return color;
        }
    }

    // Generate consistent color from name hash
    const hash = agentName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);

    return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
}

/**
 * Pre-assign colors to a list of agents (call on initial load)
 */
export function initializeAgentColors(agentIds: string[]): void {
    agentIds.forEach(id => getAgentColor(id));
}

/**
 * Reset color assignments (for testing)
 */
export function resetAgentColors(): void {
    agentColorCache.clear();
    nextColorIndex = 0;
}

/**
 * Get all currently assigned colors (for debugging)
 */
export function getAssignedColors(): Map<string, AgentColor> {
    return new Map(agentColorCache);
}
