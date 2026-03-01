import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import type { WorkflowNode } from '../../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const MINIMAP_SIZE = 140;
const PADDING = 40;

interface MinimapProps {
    nodes: WorkflowNode[];
    pan: { x: number; y: number };
    zoom: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onPanTo: (worldX: number, worldY: number) => void;
}

export default function Minimap({ nodes, pan, zoom, containerRef, onPanTo }: MinimapProps) {
    const minimapRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setContainerSize({ w: el.clientWidth, h: el.clientHeight });
        });
        ro.observe(el);
        setContainerSize({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, [containerRef]);

    const bounds = useMemo(() => {
        if (nodes.length === 0) {
            return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
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
        const width = Math.max(maxX - minX, 400);
        const height = Math.max(maxY - minY, 300);
        return { minX, minY, maxX: minX + width, maxY: minY + height };
    }, [nodes]);

    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;
    const scale = Math.min(
        (MINIMAP_SIZE - 4) / worldWidth,
        (MINIMAP_SIZE - 4) / worldHeight,
        1
    );
    const mapW = worldWidth * scale;
    const mapH = worldHeight * scale;
    const offsetX = (MINIMAP_SIZE - mapW) / 2;
    const offsetY = (MINIMAP_SIZE - mapH) / 2;

    const worldToMap = useCallback(
        (wx: number, wy: number) => ({
            x: offsetX + (wx - bounds.minX) * scale,
            y: offsetY + (wy - bounds.minY) * scale,
        }),
        [bounds.minX, bounds.minY, scale, offsetX, offsetY]
    );

    const mapToWorld = useCallback(
        (mx: number, my: number) => ({
            x: bounds.minX + (mx - offsetX) / scale,
            y: bounds.minY + (my - offsetY) / scale,
        }),
        [bounds.minX, bounds.minY, scale, offsetX, offsetY]
    );

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = minimapRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const { x: wx, y: wy } = mapToWorld(mx, my);
            onPanTo(wx, wy);
        },
        [mapToWorld, onPanTo]
    );

    const viewportLeft = (-pan.x) / zoom;
    const viewportTop = (-pan.y) / zoom;
    const viewportRight = viewportLeft + containerSize.w / zoom;
    const viewportBottom = viewportTop + containerSize.h / zoom;

    const vpMin = worldToMap(viewportLeft, viewportTop);
    const vpMax = worldToMap(viewportRight, viewportBottom);
    const vpStyle = {
        left: Math.max(0, vpMin.x),
        top: Math.max(0, vpMin.y),
        width: Math.max(4, vpMax.x - vpMin.x),
        height: Math.max(4, vpMax.y - vpMin.y),
    };

    return (
        <div
            ref={minimapRef}
            role="presentation"
            className="absolute bottom-5 right-20 z-10 rounded-lg border border-gray-200 bg-white/95 shadow overflow-hidden cursor-pointer"
            style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
            onClick={handleClick}
        >
            <svg width={MINIMAP_SIZE} height={MINIMAP_SIZE} className="block">
                <g transform={`translate(${offsetX},${offsetY}) scale(${scale}) translate(${-bounds.minX},${-bounds.minY})`}>
                    {nodes.map(node => (
                        <rect
                            key={node.id}
                            x={node.x}
                            y={node.y}
                            width={NODE_WIDTH}
                            height={NODE_HEIGHT}
                            fill="#e0e7ff"
                            stroke="#a5b4fc"
                            strokeWidth={2 / scale}
                            rx={4}
                        />
                    ))}
                </g>
            </svg>
            <div
                className="absolute border-2 border-indigo-500 rounded pointer-events-none bg-indigo-500/10"
                style={vpStyle}
            />
        </div>
    );
}
