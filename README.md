# Agent Control – Coordination Dashboard

A control plane for autonomous LLM agents, built with Next.js 14+, TypeScript, Tailwind CSS, Zustand, and **Groq API** (llama-3.3-70b-versatile).

![Dashboard Preview](./docs/preview.png)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Real-time Agent Monitoring** – View agent status, current tasks, and activity timestamps
- **Task Management** – View task details, timelines, and mark tasks as stuck
- **Live Feed Stream** – Auto-scrolling, color-coded message feed
- **Agent Drawer** – Click any agent to view history and send direct messages
- **Task Threads** – Open dedicated chat threads for specific tasks
- **Command Palette** – Press `Cmd+K` for quick actions
- **Slash Commands** – `/pause`, `/reassign`, `/kill` for agent control
- **Keyboard Shortcuts** – `Cmd+K`, `Cmd+Enter`, `Esc`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles (dark theme)
├── components/             # React components
│   ├── ui/                 # Reusable UI primitives
│   │   ├── Badge.tsx       # Status badges
│   │   ├── Button.tsx      # Button variants
│   │   ├── Modal.tsx       # Modal dialogs
│   │   ├── Drawer.tsx      # Slide-in panels
│   │   └── Skeleton.tsx    # Loading skeletons
│   ├── Header.tsx          # Top navigation bar
│   ├── AgentsList.tsx      # Left panel – agent list
│   ├── TasksPanel.tsx      # Right panel – task cards
│   ├── FeedStream.tsx      # Live message feed
│   ├── MessageInput.tsx    # Input with sender toggle
│   ├── AgentDrawer.tsx     # Agent detail drawer
│   ├── TaskModal.tsx       # Task timeline modal
│   ├── TaskThread.tsx      # Task chat modal
│   └── CommandPalette.tsx  # Cmd+K command menu
├── store/                  # State management
│   └── index.ts            # Zustand store
├── hooks/                  # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   └── useSocket.ts
├── lib/                    # Utilities
│   ├── api.ts              # Mock API layer
│   └── socket.ts           # WebSocket simulation
├── types/                  # TypeScript definitions
│   └── index.ts
└── mock/                   # Mock data
    └── data.ts
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + K` | Open command palette |
| `Cmd + Enter` | Send message |
| `Esc` | Close modals/drawers |

## Slash Commands

| Command | Effect |
|---------|--------|
| `/pause` | Pause all agents |
| `/resume` | Resume all agents |
| `/kill` | Terminate all agents |
| `/reassign` | Initiate task reassignment |
| `/status` | Get system status |
| `/help` | List available commands |

## Master Agent (Groq Integration)

The Master Agent uses **Groq API** with `llama-3.3-70b-versatile` to:

- Respond intelligently to human instructions
- Analyze agent and task states
- Suggest remediation for stuck agents
- Parse complex slash commands

### Setup

1. Get a Groq API key from [console.groq.com](https://console.groq.com)

2. Create `.env.local`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   NEXT_PUBLIC_MOCK_MODE=true
   ```

3. When you send a message as "Human", the Master Agent automatically responds.

## Connecting a Real Backend

Toggle mock mode off to use real endpoints:

```env
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_WS_URL=wss://your-api.com/ws
NEXT_PUBLIC_MOCK_MODE=false
```

The API layer (`src/lib/api.ts`) and WebSocket layer (`src/lib/socket.ts`) automatically switch between mock and real based on this flag.

### API Endpoints (Expected)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents` | GET | List all agents |
| `/agents/:id/status` | PATCH | Update agent status |
| `/tasks` | GET | List all tasks |
| `/tasks/:id/status` | PATCH | Update task status |
| `/messages` | GET/POST | Get/send messages |
| `/commands` | POST | Execute slash command |

### WebSocket Events (Expected)

```typescript
// Server → Client events
{ type: 'agent_update', payload: { agentId, status } }
{ type: 'task_update', payload: { taskId, status } }
{ type: 'message', payload: Message }
{ type: 'agent_stuck', payload: { agentId } }
```

## API Reference

```typescript
interface Agent {
  id: string;
  name: string;
  currentTask: string;
  status: 'active' | 'stuck' | 'offline' | 'idle';
  lastActive: Date;
}

interface Task {
  id: string;
  title: string;
  assignedAgents: string[];
  status: 'in-progress' | 'stuck' | 'completed' | 'pending';
  lastUpdate: Date;
  timeline?: TaskEvent[];
}

interface Message {
  id: string;
  sender: 'human' | 'master' | 'agent';
  agentName?: string;
  text: string;
  timestamp: Date;
  taskId?: string;
  isError?: boolean;
}
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **LLM**: Groq API (llama-3.3-70b-versatile)
- **Notifications**: react-hot-toast

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Control Plane)            │
├─────────────────────────────────────────────────────────┤
│  UI Components → Zustand Store → API/Socket Layer       │
│                        ↓                                │
│              ┌────────────────────┐                     │
│              │   Mock Backend     │  (Phase 1)          │
│              │   or               │                     │
│              │   Real Backend     │  (Phase 2)          │
│              └────────────────────┘                     │
│                        ↓                                │
│              ┌────────────────────┐                     │
│              │   Groq API         │                     │
│              │   (Master Agent)   │                     │
│              └────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## License

Internal tool – not for public distribution.

