import type { WorkflowNode } from '../../types';
import NodeDetailsDrawer from './NodeDetailsDrawer';

const STATUS_LABELS: Record<string, string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    done: 'Done',
};

export interface DrawerStackItem {
    nodeId: string;
    collapsed: boolean;
}

interface NodeDetailsDrawerStackProps {
    stack: DrawerStackItem[];
    nodes: WorkflowNode[];
    onUpdateNode: (nodeId: string, partial: Partial<WorkflowNode>) => void;
    onRemoveFromStack: (nodeId: string) => void;
    onToggleCollapsed: (nodeId: string) => void;
    onCloseAll: () => void;
}

export default function NodeDetailsDrawerStack({
    stack,
    nodes,
    onUpdateNode,
    onRemoveFromStack,
    onToggleCollapsed,
    onCloseAll,
}: NodeDetailsDrawerStackProps) {
    if (stack.length === 0) return null;

    const getNode = (nodeId: string) => nodes.find(n => n.id === nodeId) || null;

    return (
        <div className="w-[380px] flex-shrink-0 h-full flex flex-col bg-white border-l border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Node details</h2>
                <button
                    type="button"
                    onClick={onCloseAll}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-xs font-medium"
                    aria-label="Close all"
                >
                    Close all
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {stack.map(({ nodeId, collapsed }) => {
                    const node = getNode(nodeId);
                    if (!node) return null;
                    return (
                        <div
                            key={nodeId}
                            className="border-b border-gray-100 last:border-b-0"
                        >
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 hover:bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => onToggleCollapsed(nodeId)}
                                    className="p-0.5 rounded text-gray-500 hover:text-gray-700 cursor-pointer"
                                    aria-label={collapsed ? 'Expand' : 'Collapse'}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        style={{
                                            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.15s ease',
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                <span className="flex-1 min-w-0 truncate text-sm font-medium text-gray-800">
                                    {node.title || 'Untitled'}
                                </span>
                                <span className="text-[10px] font-medium text-gray-400 shrink-0">
                                    {STATUS_LABELS[node.status] ?? node.status}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveFromStack(nodeId)}
                                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                                    aria-label="Remove from stack"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            {!collapsed && (
                                <NodeDetailsDrawer
                                    node={node}
                                    onUpdateNode={onUpdateNode}
                                    showHeader={false}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
