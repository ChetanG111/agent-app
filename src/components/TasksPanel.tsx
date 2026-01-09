// Tasks Panel Component

'use client';

import { useStore } from '@/store';
import { Badge, Button, TaskSkeleton } from './ui';
import { Task } from '@/types';
import { toast } from 'react-hot-toast';

interface TaskCardProps {
    task: Task;
    onView: () => void;
    onThread: () => void;
    onMarkStuck: () => void;
}

function TaskCard({ task, onView, onThread, onMarkStuck }: TaskCardProps) {
    const isStuck = task.status === 'stuck';

    return (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-200">{task.title}</h3>
                {isStuck && (
                    <div className="flex items-center gap-1 text-red-400 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span>STUCK</span>
                    </div>
                )}
            </div>

            {/* Assigned */}
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                <span>ASSIGNED:</span>
                <span className="flex items-center justify-center w-6 h-6 bg-gray-700 rounded-full text-gray-300 text-xs">
                    {task.assignedAgents.length}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onView}>
                    VIEW
                </Button>
                <Button variant="outline" size="sm" onClick={onThread}>
                    THREAD
                </Button>
                <Button
                    variant={isStuck ? 'danger' : 'outline'}
                    size="sm"
                    className="ml-auto"
                    onClick={onMarkStuck}
                >
                    MARK STUCK
                </Button>
            </div>
        </div>
    );
}

export function TasksPanel() {
    const { tasks, tasksLoading, openTaskModal, updateTaskStatus, sendMessage, agents } = useStore();

    const handleMarkStuck = async (task: Task) => {
        try {
            await updateTaskStatus(task.id, 'stuck');

            // Add event to feed
            await sendMessage(
                `Task "${task.title}" has been marked as STUCK.`,
                'master'
            );

            toast.success(`Task marked as stuck: ${task.title}`, {
                style: {
                    background: '#1f2937',
                    color: '#f87171',
                    border: '1px solid #374151',
                },
            });
        } catch (error) {
            toast.error('Failed to update task status. Please try again.', {
                style: {
                    background: '#1f2937',
                    color: '#f87171',
                    border: '1px solid #374151',
                },
            });
        }
    };

    if (tasksLoading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <TaskSkeleton />
                <TaskSkeleton />
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks available</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 overflow-y-auto">
            {tasks.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onView={() => openTaskModal(task.id, 'task-view')}
                    onThread={() => openTaskModal(task.id, 'task-thread')}
                    onMarkStuck={() => handleMarkStuck(task)}
                />
            ))}
        </div>
    );
}
