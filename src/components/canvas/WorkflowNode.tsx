import { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowNode as NodeType, NodeStatus } from '../../types';

interface WorkflowNodeProps {
    node: NodeType;
    isSelected: boolean;
    isHighlighted?: boolean;
    zoom: number;
    onSelect: (nodeId: string, shiftKey: boolean) => void;
    onMove: (nodeId: string, x: number, y: number, prevX: number, prevY: number) => void;
    onUpdateTitle: (nodeId: string, title: string, prevTitle: string) => void;
    onUpdateStatus: (nodeId: string, status: NodeStatus, prevStatus: NodeStatus) => void;
    onStartEdge: (nodeId: string) => void;
    onEndEdge: (nodeId: string) => void;
    onOpenDrawer?: (nodeId: string) => void;
    onOpenSubflow?: (subflowId: string) => void;
    onDeleteNode?: (nodeId: string) => void;
}

const statusColors: Record<NodeStatus, { label: string; bg: string; text: string }> = {
    'not-started': { label: 'Not started', bg: 'bg-gray-100', text: 'text-gray-500' },
    'in-progress': { label: 'In progress', bg: 'bg-amber-50', text: 'text-amber-600' },
    done: { label: 'Done', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const statusCycle: NodeStatus[] = ['not-started', 'in-progress', 'done'];

export default function WorkflowNode({
    node,
    isSelected,
    isHighlighted = false,
    zoom,
    onSelect,
    onMove,
    onUpdateTitle,
    onUpdateStatus,
    onStartEdge,
    onEndEdge,
    onOpenDrawer,
    onOpenSubflow,
    onDeleteNode,
}: WorkflowNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(node.title);
    const [menuOpen, setMenuOpen] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
    const nodeRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [menuOpen]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isEditing) return;
            e.stopPropagation();
            onSelect(node.id, e.shiftKey);
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                nodeX: node.x,
                nodeY: node.y,
            };

            const handleMouseMove = (ev: MouseEvent) => {
                if (!dragRef.current) return;
                const dx = (ev.clientX - dragRef.current.startX) / zoom;
                const dy = (ev.clientY - dragRef.current.startY) / zoom;
                const newX = dragRef.current.nodeX + dx;
                const newY = dragRef.current.nodeY + dy;
                if (nodeRef.current) {
                    nodeRef.current.style.left = `${newX}px`;
                    nodeRef.current.style.top = `${newY}px`;
                }
            };

            const handleMouseUp = (ev: MouseEvent) => {
                if (!dragRef.current) return;
                const dx = (ev.clientX - dragRef.current.startX) / zoom;
                const dy = (ev.clientY - dragRef.current.startY) / zoom;
                const newX = dragRef.current.nodeX + dx;
                const newY = dragRef.current.nodeY + dy;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    onMove(node.id, newX, newY, dragRef.current.nodeX, dragRef.current.nodeY);
                }
                dragRef.current = null;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        },
        [isEditing, node.id, node.x, node.y, zoom, onSelect, onMove]
    );

    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (node.type === 'subflow' && node.subflowId && onOpenSubflow) {
                onOpenSubflow(node.subflowId);
                return;
            }
            if (onOpenDrawer) {
                onOpenDrawer(node.id);
                return;
            }
            setIsEditing(true);
            setEditTitle(node.title);
        },
        [node.id, node.title, node.type, node.subflowId, onOpenDrawer, onOpenSubflow]
    );

    const handleTitleBlur = useCallback(() => {
        const trimmed = editTitle.trim() || 'Untitled';
        if (trimmed !== node.title) {
            onUpdateTitle(node.id, trimmed, node.title);
        }
        setIsEditing(false);
    }, [editTitle, node.id, node.title, onUpdateTitle]);

    const handleTitleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleTitleBlur();
            }
            if (e.key === 'Escape') {
                setIsEditing(false);
                setEditTitle(node.title);
            }
        },
        [handleTitleBlur, node.title]
    );

    const handleStatusToggle = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const currentIdx = statusCycle.indexOf(node.status);
            const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
            onUpdateStatus(node.id, nextStatus, node.status);
        },
        [node.id, node.status, onUpdateStatus]
    );

    const handleCheckbox = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const newStatus: NodeStatus = node.status === 'done' ? 'not-started' : 'done';
            onUpdateStatus(node.id, newStatus, node.status);
        },
        [node.id, node.status, onUpdateStatus]
    );

    const handleOutputMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            onStartEdge(node.id);
        },
        [node.id, onStartEdge]
    );

    const handleInputMouseUp = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            onEndEdge(node.id);
        },
        [node.id, onEndEdge]
    );

    const statusInfo = statusColors[node.status];
    const isDone = node.status === 'done';
    const isSubflow = node.type === 'subflow' && node.subflowId;
    const typeClass = node.type ? `node-type-${node.type}` : '';

    return (
        <div
            ref={nodeRef}
            className={`node-card ${isSelected ? 'selected' : ''} ${isDone ? 'done' : ''} ${node.status === 'in-progress' ? 'in-progress' : ''} ${isSubflow ? 'subflow-node' : ''} ${typeClass} ${isHighlighted ? 'node-highlighted' : ''}`}
            style={{ left: node.x, top: node.y }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {/* Input Handle */}
            <div
                className="connector-handle input"
                onMouseUp={handleInputMouseUp}
                onMouseDown={e => e.stopPropagation()}
            />

            {/* Output Handle */}
            <div
                className="connector-handle output"
                onMouseDown={handleOutputMouseDown}
            />

            {/* Header */}
            <div className="flex items-start gap-2">
                <button
                    onClick={handleCheckbox}
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${isDone
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 hover:border-indigo-400'
                        }`}
                >
                    {isDone && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            className={`w-full text-sm font-semibold outline-none bg-transparent border-b border-indigo-300 pb-0.5 ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'
                                }`}
                        />
                    ) : (
                        <p
                            className={`text-sm font-semibold truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'
                                }`}
                        >
                            {node.title}
                        </p>
                    )}
                </div>

                {/* Three-dot menu */}
                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            setMenuOpen(prev => !prev);
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        aria-label="Node menu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="6" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="18" r="1.5" />
                        </svg>
                    </button>
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-full mt-0.5 z-50 min-w-[120px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onOpenDrawer?.(node.id);
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                Info
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setIsEditing(true);
                                    setEditTitle(node.title);
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Rename
                            </button>
                            {onDeleteNode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onDeleteNode(node.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Status + Subflow Open hint */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <button
                    onClick={handleStatusToggle}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.bg} ${statusInfo.text} transition-all cursor-pointer hover:opacity-80`}
                >
                    <div
                        className={`w-1.5 h-1.5 rounded-full ${node.status === 'done'
                            ? 'bg-emerald-500'
                            : node.status === 'in-progress'
                                ? 'bg-amber-500'
                                : 'bg-gray-400'
                            }`}
                    />
                    {statusInfo.label}
                </button>
                {isSubflow && onOpenSubflow && (
                    <span className="text-[10px] text-indigo-500 font-medium">Double-click to open</span>
                )}
            </div>
        </div>
    );
}
