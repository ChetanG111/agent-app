// Skeleton Loading Component

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gray-700/50 rounded ${className}`}
        />
    );
}

export function AgentSkeleton() {
    return (
        <div className="p-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="w-24 h-4" />
                </div>
                <Skeleton className="w-16 h-5" />
            </div>
            <div className="mt-2 flex items-center justify-between">
                <Skeleton className="w-32 h-3" />
                <Skeleton className="w-12 h-3" />
            </div>
        </div>
    );
}

export function TaskSkeleton() {
    return (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="w-40 h-5" />
                <Skeleton className="w-16 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-6 h-6 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-7" />
                <Skeleton className="w-16 h-7" />
                <Skeleton className="w-24 h-7 ml-auto" />
            </div>
        </div>
    );
}

export function MessageSkeleton() {
    return (
        <div className="flex gap-2 px-4 py-1">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-48 h-4" />
        </div>
    );
}
