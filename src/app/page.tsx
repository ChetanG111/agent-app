// Main Dashboard Page

'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { useKeyboardShortcuts, useSocket } from '@/hooks';
import {
  Header,
  AgentsList,
  TasksPanel,
  FeedStream,
  MessageInput,
  AgentDrawer,
  TaskModal,
  TaskThread,
  CommandPalette,
} from '@/components';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { fetchAgents, fetchTasks, fetchMessages } = useStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize WebSocket connection
  const { isConnected } = useSocket();

  // Fetch initial data
  useEffect(() => {
    setMounted(true);
    fetchAgents();
    fetchTasks();
    fetchMessages();
  }, [fetchAgents, fetchTasks, fetchMessages]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0f14] text-gray-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Agents */}
        <div className="w-1/2 border-r border-gray-800 flex flex-col overflow-hidden">
          <AgentsList />
        </div>

        {/* Right Panel - Tasks */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <TasksPanel />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col border-t border-gray-800">
        {/* Feed Stream */}
        <FeedStream isConnected={isConnected} />

        {/* Message Input */}
        <MessageInput />
      </div>

      {/* Modals and Drawers */}
      <AgentDrawer />
      <TaskModal />
      <TaskThread />
      <CommandPalette />
    </div>
  );
}
