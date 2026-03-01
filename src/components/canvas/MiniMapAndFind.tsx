import { useMemo } from 'react';
import type { WorkflowNode } from '../../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const MINIMAP_WIDTH = 140;
const MINIMAP_HEIGHT = 90;
const PADDING = 40;

interface MiniMapAndFindProps {
    nodes: WorkflowNode[];
    pan: { x: number; y: number };
    zoom: number;
    containerWidth: number;
    containerHeight: number;
    onPanTo: (worldX: number, worldY: number) => void;
    highlightNodeIds: Set<string>;
}

export default function MiniMapAndFind({
    nodes,
    pan,
    zoom,
    containerWidth,
    containerHeight,
    onPanTo,
    highlightNodeIds,
}: MiniMapAndFindProps) {
    const bounds = useMemo(() => {
        if (nodes.length === 0) {
            return { minX: 0, minY: 0, maxX: 1000, maxY: 800 };
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + NODE_WIDTH);
            maxY = Math.max(maxY, n.y + NODE_HEIGHT);
        });
        minX -= PADDING;
        minY -= PADDING;
        maxX += PADDING;
        maxY += PADDING;
        return { minX, minY, maxX, maxY };
    }, [nodes]);

    const viewportWorld = useMemo(() => ({
        x: -pan.x / zoom,
        y: -pan.y / zoom,
        w: containerWidth / zoom,
        h: containerHeight / zoom,
    }), [pan, zoom, containerWidth, containerHeight]);

    const scaleX = MINIMAP_WIDTH / (bounds.maxX - bounds.minX);
    const scaleY = MINIMAP_HEIGHT / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (MINIMAP_WIDTH - (bounds.maxX - bounds.minX) * scale) / 2;
    const offsetY = (MINIMAP_HEIGHT - (bounds.maxY - bounds.minY) * scale) / 2;

    const toMinimap = (wx: number, wy: number) => ({
        x: offsetX + (wx - bounds.minX) * scale,
        y: offsetY + (wy - bounds.minY) * scale,
    });

    const fromMinimap = (mx: number, my: number) => ({
        x: bounds.minX + (mx - offsetX) / scale,
        y: bounds.minY + (my - offsetY) / scale,
    });

    return (
        <div className="absolute bottom-4 right-20 flex flex-col gap-2 z-10" data-minimap>
            {/* Mini-map - click to jump view */}
            <div
                className="bg-white/95 border border-gray-200 rounded-lg shadow-sm overflow-hidden cursor-pointer"
                style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    const world = fromMinimap(mx, my);
                    onPanTo(world.x, world.y);
                }}
            >
                <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} className="block pointer-events-none">
                    {/* Content area */}
                    <rect
                        x={0}
                        y={0}
                        width={MINIMAP_WIDTH}
                        height={MINIMAP_HEIGHT}
                        fill="#f8fafc"
                    />
                    {/* Nodes as small rects */}
                    {nodes.map(node => {
                        const { x, y } = toMinimap(node.x, node.y);
                        const w = Math.max(4, NODE_WIDTH * scale);
                        const h = Math.max(3, NODE_HEIGHT * scale);
                        return (
                            <rect
                                key={node.id}
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                fill={highlightNodeIds.has(node.id) ? '#6366f1' : '#cbd5e1'}
                                stroke={highlightNodeIds.has(node.id) ? '#4f46e5' : '#94a3b8'}
                                strokeWidth={1}
                                rx={2}
                            />
                        );
                    })}
                    {/* Viewport rect */}
                    <rect
                        x={toMinimap(viewportWorld.x, viewportWorld.y).x}
                        y={toMinimap(viewportWorld.x, viewportWorld.y).y}
                        width={viewportWorld.w * scale}
                        height={viewportWorld.h * scale}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth={2}
                        opacity={0.8}
                    />
                </svg>
            </div>
        </div>
    );
}
