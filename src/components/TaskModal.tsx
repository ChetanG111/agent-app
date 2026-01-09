// Task Modal Component (VIEW mode)

'use client';

import { useStore, selectSelectedTask } from '@/store';
import { Modal, Badge } from './ui';
import { TaskEvent } from '@/types';

function formatTimestamp(date: Date): string {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getEventIcon(type: TaskEvent['type']): string {
    switch (type) {
        case 'created': return '📋';
        case 'assigned': return '👤';
        case 'status-change': return '🔄';
        case 'message': return '💬';
        default: return '•';
    }
}

export function TaskModal() {
    const { ui, closeModal, agents } = useStore();
    const selectedTask = useStore(selectSelectedTask);

    if (!selectedTask || ui.modalType !== 'task-view') return null;

    const assignedAgentNames = selectedTask.assignedAgents
        .map(id => agents.find(a => a.id === id)?.name || 'Unknown')
        .join(', ');

    return (
        <Modal
            isOpen={ui.modalType === 'task-view'}
            onClose={closeModal}
            title={selectedTask.title}
            size="lg"
        >
            {/* Task Info */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-gray-500 uppercase">Status</span>
                        <div className="mt-1">
                            <Badge status={selectedTask.status} />
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 uppercase">Last Updated</span>
                        <p className="mt-1 text-sm text-gray-300">
                            {formatTimestamp(selectedTask.lastUpdate)}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs text-gray-500 uppercase">Assigned Agents</span>
                        <p className="mt-1 text-sm text-gray-300">
                            {assignedAgentNames || 'None assigned'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4">Timeline</h3>

                {!selectedTask.timeline || selectedTask.timeline.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No timeline events
                    </div>
                ) : (
                    <div className="relative pl-6 border-l border-gray-700 space-y-4">
                        {selectedTask.timeline.map((event, index) => (
                            <div key={event.id} className="relative">
                                {/* Timeline dot */}
                                <div className="absolute -left-[25px] w-3 h-3 bg-gray-700 border-2 border-gray-600 rounded-full" />

                                {/* Event content */}
                                <div className="pb-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span>{getEventIcon(event.type)}</span>
                                        <span className="text-gray-300">{event.description}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {formatTimestamp(event.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
