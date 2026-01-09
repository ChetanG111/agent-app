// Header Component

'use client';

import { useStore } from '@/store';
import { Button } from './ui';

export function Header() {
    const { toggleCommandPalette } = useStore();

    return (
        <header className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white font-bold text-sm">
                    A
                </div>
                <h1 className="text-lg font-semibold text-gray-100">Agent Control</h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Search Actions Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleCommandPalette}
                    className="gap-2"
                >
                    <span className="text-gray-500">Cmd K</span>
                    <span>Search Actions</span>
                </Button>

                {/* Master Agent Toggle */}
                <Button variant="default" size="sm">
                    Master Agent
                </Button>

                {/* Comment Icon */}
                <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>

                {/* Settings Icon */}
                <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
