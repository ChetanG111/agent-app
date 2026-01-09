// Keyboard Shortcuts Hook

import { useEffect, useCallback } from 'react';
import { useStore } from '@/store';

export function useKeyboardShortcuts() {
    const { toggleCommandPalette, closeAll, ui } = useStore();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Cmd/Ctrl + K - Toggle command palette
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleCommandPalette();
            return;
        }

        // Escape - Close modals and drawers
        if (e.key === 'Escape') {
            e.preventDefault();
            closeAll();
            return;
        }
    }, [toggleCommandPalette, closeAll]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { ui };
}
