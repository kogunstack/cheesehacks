import type { WorkflowNode, WorkflowEdge } from '../../types';
import { getHandlePosition, getBezierPath } from '../../utils/geometry';

interface EdgeRendererProps {
    edges: WorkflowEdge[];
    nodes: WorkflowNode[];
    selectedEdgeId: string | null;
    onSelectEdge: (edgeId: string) => void;
    onDeleteEdge: (edgeId: string) => void;
    tempEdge: { sourceId: string; mouseX: number; mouseY: number } | null;
}

export default function EdgeRenderer({
    edges,
    nodes,
    selectedEdgeId,
    onSelectEdge,
    onDeleteEdge,
    tempEdge,
}: EdgeRendererProps) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    return (
        <>
            {/* Rendered edges */}
            {edges.map(edge => {
                const source = nodeMap.get(edge.sourceId);
                const target = nodeMap.get(edge.targetId);
                if (!source || !target) return null;

                const s = getHandlePosition(source, 'output');
                const t = getHandlePosition(target, 'input');
                const path = getBezierPath(s.x, s.y, t.x, t.y);
                const isSelected = selectedEdgeId === edge.id;

                const mid = {
                    x: (s.x + t.x) / 2,
                    y: (s.y + t.y) / 2,
                };

                return (
                    <g key={edge.id}>
                        {/* Invisible wider path for easier clicking */}
                        <path
                            d={path}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="16"
                            className="cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectEdge(edge.id);
                            }}
                        />
                        {/* Visible path - pointer-events: none so the hit area above receives clicks */}
                        <path
                            d={path}
                            fill="none"
                            stroke={isSelected ? '#6366f1' : '#cbd5e1'}
                            strokeWidth={isSelected ? 2.5 : 2}
                            strokeLinecap="round"
                            className="transition-all duration-150"
                            style={{
                                filter: isSelected ? 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.3))' : 'none',
                                pointerEvents: 'none',
                            }}
                        />
                        {/* Arrow */}
                        <circle
                            cx={t.x - 3}
                            cy={t.y}
                            r="3"
                            fill={isSelected ? '#6366f1' : '#cbd5e1'}
                            className="transition-all duration-150"
                            style={{ pointerEvents: 'none' }}
                        />
                        {/* Delete button (shown on select) */}
                        {isSelected && (
                            <g
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEdge(edge.id);
                                }}
                                className="cursor-pointer"
                            >
                                <circle cx={mid.x} cy={mid.y} r="10" fill="white" stroke="#e2e4ec" strokeWidth="1.5" />
                                <line
                                    x1={mid.x - 3}
                                    y1={mid.y - 3}
                                    x2={mid.x + 3}
                                    y2={mid.y + 3}
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                <line
                                    x1={mid.x + 3}
                                    y1={mid.y - 3}
                                    x2={mid.x - 3}
                                    y2={mid.y + 3}
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </g>
                        )}
                    </g>
                );
            })}

            {/* Temporary edge while dragging */}
            {tempEdge && (() => {
                const source = nodeMap.get(tempEdge.sourceId);
                if (!source) return null;
                const s = getHandlePosition(source, 'output');
                const path = getBezierPath(s.x, s.y, tempEdge.mouseX, tempEdge.mouseY);
                return (
                    <path
                        d={path}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        opacity="0.6"
                    />
                );
            })()}
        </>
    );
}
