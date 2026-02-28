import { useState, useRef, useCallback } from 'react';
import type { WorkflowNode as NodeType, NodeStatus } from '../../types';

interface WorkflowNodeProps {
    node: NodeType;
    isSelected: boolean;
    zoom: number;
    onSelect: (nodeId: string, shiftKey: boolean) => void;
    onMove: (nodeId: string, x: number, y: number, prevX: number, prevY: number) => void;
    onUpdateTitle: (nodeId: string, title: string, prevTitle: string) => void;
    onUpdateStatus: (nodeId: string, status: NodeStatus, prevStatus: NodeStatus) => void;
    onStartEdge: (nodeId: string) => void;
    onEndEdge: (nodeId: string) => void;
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
    zoom,
    onSelect,
    onMove,
    onUpdateTitle,
    onUpdateStatus,
    onStartEdge,
    onEndEdge,
}: WorkflowNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(node.title);
    const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
    const nodeRef = useRef<HTMLDivElement>(null);

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
            setIsEditing(true);
            setEditTitle(node.title);
        },
        [node.title]
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

    return (
        <div
            ref={nodeRef}
            className={`node-card ${isSelected ? 'selected' : ''} ${isDone ? 'done' : ''} ${node.status === 'in-progress' ? 'in-progress' : ''}`}
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
            </div>

            {/* Status */}
            <button
                onClick={handleStatusToggle}
                className={`mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.bg} ${statusInfo.text} transition-all cursor-pointer hover:opacity-80`}
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
        </div>
    );
}
