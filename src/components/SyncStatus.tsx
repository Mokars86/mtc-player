import React from 'react';
import { Icons } from './Icon';

interface SyncStatusProps {
    status: 'idle' | 'syncing' | 'synced' | 'error';
}

export const SyncStatus = ({ status }: SyncStatusProps) => {
    if (status === 'idle') return null;

    return (
        <div className={`fixed top-4 right-4 z-[90] flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-500 ${status === 'syncing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                status === 'synced' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            {status === 'syncing' && <Icons.Disc className="w-3 h-3 animate-spin" />}
            {status === 'synced' && <Icons.Gauge className="w-3 h-3" />}
            <span className="text-xs font-bold uppercase tracking-wider">
                {status === 'syncing' ? 'Syncing...' : status === 'synced' ? 'Cloud Synced' : 'Sync Error'}
            </span>
        </div>
    );
};
