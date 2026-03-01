import { useState, useMemo, useRef, useEffect } from 'react';
import type { WorkflowNode } from '../../types';

interface NodeSearchSlideOutProps {
    nodes: WorkflowNode[];
    onCenterNode: (nodeId: string) => void;
    onHighlightNodes: (ids: Set<string>) => void;
}

export default function NodeSearchSlideOut({
    nodes,
    onCenterNode,
    onHighlightNodes,
}: NodeSearchSlideOutProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const searchMatches = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return nodes.filter(n => n.title.toLowerCase().includes(q));
    }, [nodes, searchQuery]);

    useEffect(() => {
        if (searchMatches.length > 0 && searchQuery.trim()) {
            onHighlightNodes(new Set(searchMatches.map(n => n.id)));
        } else {
            onHighlightNodes(new Set());
        }
    }, [searchMatches, searchQuery, onHighlightNodes]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    const handleSelectMatch = (nodeId: string) => {
        onCenterNode(nodeId);
        setSearchQuery('');
        setIsOpen(false);
    };

    return (
        <div className="flex items-center overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="canvas-btn rounded-r-none border-r-0 shrink-0"
                title="Find node"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
            </button>
            <div
                className="relative flex items-center transition-[width] duration-200 ease-out overflow-hidden"
                style={{ width: isOpen ? 200 : 0 }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find node..."
                    className="h-9 w-[200px] min-w-[200px] px-3 py-1.5 text-sm border-0 focus:outline-none focus:ring-0"
                />
                {isOpen && searchMatches.length > 0 && (
                    <ul className="absolute left-0 bottom-full mb-1 w-[200px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                        {searchMatches.slice(0, 8).map(node => (
                            <li key={node.id}>
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 cursor-pointer truncate"
                                    onMouseDown={() => handleSelectMatch(node.id)}
                                >
                                    {node.title || 'Untitled'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
