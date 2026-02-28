import { useCallback } from 'react';

interface HeaderProps {
    projectName: string | null;
    onExport: () => void;
}

export default function Header({ projectName, onExport }: HeaderProps) {
    const handleExport = useCallback(() => {
        onExport();
    }, [onExport]);

    return (
        <header className="h-14 min-h-[56px] bg-white border-b border-gray-200/80 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                {projectName ? (
                    <>
                        <span className="text-gray-400 text-sm font-medium">Workflows</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className="text-gray-800 text-sm font-semibold">{projectName}</span>
                    </>
                ) : (
                    <span className="text-gray-800 text-sm font-semibold">Dashboard</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {projectName && (
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export PNG
                    </button>
                )}
            </div>
        </header>
    );
}
