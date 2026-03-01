import { useState, useRef, useEffect } from 'react';
import type { NodeType } from '../../types';

export type AddNodeMode = false | Exclude<NodeType, 'start' | 'end'>;

export const NODE_TEMPLATES: { type: AddNodeMode; label: string; icon: React.ReactNode }[] = [
    { type: 'basic', label: 'Basic', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg> },
    { type: 'milestone', label: 'Milestone', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15 8l6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" /></svg> },
    { type: 'decision', label: 'Decision', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 9-7 9-7-9z" /></svg> },
    { type: 'deliverable', label: 'Deliverable', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8M16 17H8M10 9H8" /></svg> },
    { type: 'subflow', label: 'Subflow', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
];

interface CanvasControlsProps {
    zoom: number;
    addNodeMode: AddNodeMode;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitToScreen: () => void;
    onSetAddNodeMode: (mode: AddNodeMode) => void;
    onResetView?: () => void;
    /** When true, show Add node dropdown only (bottom-left). When false, show Zoom + Fit only (bottom-right). */
    showAddNode?: boolean;
}

export default function CanvasControls({
    zoom,
    addNodeMode,
    onZoomIn,
    onZoomOut,
    onFitToScreen,
    onSetAddNodeMode,
    onResetView,
    showAddNode = true,
}: CanvasControlsProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    if (showAddNode) {
        return (
            <div className="flex flex-col gap-2">
                <div className="relative" ref={dropdownRef}>
                    <button
                        className={`canvas-btn ${addNodeMode !== false ? 'active-mode' : ''}`}
                        onClick={() => setDropdownOpen(prev => !prev)}
                        title="Add node (N)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8M8 12h8" />
                        </svg>
                    </button>
                    {dropdownOpen && (
                        <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                            {NODE_TEMPLATES.map(({ type, label, icon }) => (
                                <button
                                    key={String(type)}
                                    type="button"
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer ${addNodeMode === type ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                                    onClick={() => {
                                        onSetAddNodeMode(addNodeMode === type ? false : type);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <span className="opacity-80">{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="canvas-controls">
            <button className="canvas-btn" onClick={onZoomIn} title="Zoom In">
                +
            </button>
            <div className="flex items-center justify-center text-[10px] text-gray-400 font-medium py-0.5">
                {Math.round(zoom * 100)}%
            </div>
            <button className="canvas-btn" onClick={onZoomOut} title="Zoom Out">
                −
            </button>
            <div className="h-1" />
            <button className="canvas-btn" onClick={onFitToScreen} title="Fit to Screen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
            </button>
            {onResetView && (
                <>
                    <div className="h-1" />
                    <button className="canvas-btn text-xs" onClick={onResetView} title="Reset view">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 119 9 9 9 0 01-9-9" />
                            <path d="M12 3v18M3 12h18" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
