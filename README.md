# Agent Control – Coordination Dashboard

A fully interactive internal tool for managing and coordinating AI agents, built with Next.js 14+, TypeScript, Tailwind CSS, and Zustand.

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
| `/kill` | Terminate all agents |
| `/reassign` | Initiate task reassignment |

## Connecting a Real Backend

The app uses a mock API layer by default. To connect to a real backend:

1. **Update environment variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api.com
   NEXT_PUBLIC_WS_URL=wss://your-api.com
   NEXT_PUBLIC_MOCK_MODE=false
   ```

2. **Replace mock API** in `src/lib/api.ts`:
   ```typescript
   export async function fetchAgents(): Promise<Agent[]> {
     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`);
     return res.json();
   }
   ```

3. **Replace WebSocket simulation** in `src/lib/socket.ts`:
   ```typescript
   const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
   socket.onmessage = (event) => {
     const data = JSON.parse(event.data);
     // Handle incoming messages
   };
   ```

## API Reference

The mock API expects/returns these shapes:

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
- **Notifications**: react-hot-toast

## License

Internal tool – not for public distribution.
