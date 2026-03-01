import { useState, useRef, useCallback, useEffect } from 'react';
import type { NodeStatus, NodeType } from '../../types';
import CanvasControls, { NODE_TEMPLATES, type AddNodeMode } from './CanvasControls';
import { useWorkflowStoreContext } from '../../contexts/WorkflowStoreContext';
import WorkflowNode from './WorkflowNode';
import EdgeRenderer from './EdgeRenderer';
import MiniMapAndFind from './MiniMapAndFind';
import NodeSearchSlideOut from './NodeSearchSlideOut';

interface WorkflowCanvasProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    onOpenDrawer?: (nodeId: string) => void;
    onOpenSubflow?: (subflowId: string) => void;
    onAddNode?: (x: number, y: number, type: NodeType) => void;
}

export default function WorkflowCanvas({
    canvasRef,
    onOpenDrawer,
    onOpenSubflow,
    onAddNode,
}: WorkflowCanvasProps) {
    const {
        nodes,
        edges,
        selectedNodeIds,
        selectedEdgeId,
        addNode,
        deleteNodes,
        moveNode,
        updateNodeTitle,
        updateNodeStatus,
        addEdge,
        deleteEdge,
        undo,
        redo,
        selectNode,
        selectEdge,
        clearSelection,
    } = useWorkflowStoreContext();

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [addNodeMode, setAddNodeMode] = useState<AddNodeMode>(false);
    const [isPanning, setIsPanning] = useState(false);
    const [tempEdge, setTempEdge] = useState<{
        sourceId: string;
        mouseX: number;
        mouseY: number;
    } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [highlightNodeIds, setHighlightNodeIds] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ screenX: number; screenY: number; worldX: number; worldY: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const r = el.getBoundingClientRect();
            setContainerSize({ width: r.width, height: r.height });
        });
        ro.observe(el);
        const r = el.getBoundingClientRect();
        setContainerSize({ width: r.width, height: r.height });
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        document.addEventListener('click', close);
        document.addEventListener('contextmenu', close);
        return () => {
            document.removeEventListener('click', close);
            document.removeEventListener('contextmenu', close);
        };
    }, [contextMenu]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.node-card') || target.closest('.canvas-controls') || target.closest('.canvas-controls-left') || target.closest('[data-minimap]')) return;
            e.preventDefault();
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const worldX = (e.clientX - rect.left - pan.x) / zoom;
            const worldY = (e.clientY - rect.top - pan.y) / zoom;
            setContextMenu({ screenX: e.clientX, screenY: e.clientY, worldX, worldY });
        },
        [pan, zoom]
    );

    const handleContextMenuAdd = useCallback(
        (type: AddNodeMode) => {
            if (contextMenu && onAddNode && type !== false) {
                onAddNode(contextMenu.worldX, contextMenu.worldY, type);
                setAddNodeMode(false);
            }
            setContextMenu(null);
        },
        [contextMenu, onAddNode]
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't capture when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (e.key === 'n' || e.key === 'N') {
                setAddNodeMode(prev => (prev === false ? 'basic' : prev === 'subflow' ? false : prev === 'deliverable' ? 'subflow' : prev === 'decision' ? 'deliverable' : prev === 'milestone' ? 'decision' : 'milestone'));
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeIds.size > 0) {
                    deleteNodes(Array.from(selectedNodeIds));
                }
                if (selectedEdgeId) {
                    deleteEdge(selectedEdgeId);
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            if (e.key === 'Escape') {
                setAddNodeMode(false);
                setTempEdge(null);
                clearSelection();
            }
            if (e.key === 'Enter' && selectedNodeIds.size === 1) {
                const nodeId = Array.from(selectedNodeIds)[0];
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                    if (node.type === 'subflow' && node.subflowId && onOpenSubflow) {
                        onOpenSubflow(node.subflowId);
                    } else if (onOpenDrawer) {
                        onOpenDrawer(nodeId);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, nodes, deleteNodes, deleteEdge, undo, redo, clearSelection, onOpenDrawer, onOpenSubflow]);

    // Canvas mouse down (pan or add node)
    const handleCanvasMouseDown = useCallback(
        (e: React.MouseEvent) => {
            // Only handle left-clicks on the canvas background
            if (e.button !== 0) return;
            const target = e.target as HTMLElement;
            if (target !== containerRef.current && target.tagName !== 'svg' && !target.closest('svg')) {
                // Clicked on something that's not the canvas background
                if (!target.closest('.node-card')) {
                    clearSelection();
                }
                return;
            }

            if (addNodeMode !== false && onAddNode) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = (e.clientX - rect.left - pan.x) / zoom;
                const y = (e.clientY - rect.top - pan.y) / zoom;
                onAddNode(x, y, addNodeMode);
                setAddNodeMode(false);
                return;
            }
            if (addNodeMode !== false && !onAddNode) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = (e.clientX - rect.left - pan.x) / zoom;
                const y = (e.clientY - rect.top - pan.y) / zoom;
                addNode(x, y, { type: addNodeMode, title: addNodeMode === 'basic' ? 'New Node' : addNodeMode.charAt(0).toUpperCase() + addNodeMode.slice(1) });
                setAddNodeMode(false);
                return;
            }

            // Start panning
            clearSelection();
            setIsPanning(true);
            panStart.current = {
                x: e.clientX,
                y: e.clientY,
                panX: pan.x,
                panY: pan.y,
            };
        },
        [addNodeMode, pan, zoom, addNode, clearSelection, onAddNode]
    );

    // Canvas mouse move (panning or temp edge)
    const handleCanvasMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isPanning && panStart.current) {
                const dx = e.clientX - panStart.current.x;
                const dy = e.clientY - panStart.current.y;
                setPan({
                    x: panStart.current.panX + dx,
                    y: panStart.current.panY + dy,
                });
            }

            if (tempEdge) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = (e.clientX - rect.left - pan.x) / zoom;
                const y = (e.clientY - rect.top - pan.y) / zoom;
                setTempEdge(prev => prev ? { ...prev, mouseX: x, mouseY: y } : null);
            }
        },
        [isPanning, tempEdge, pan, zoom]
    );

    // Canvas mouse up
    const handleCanvasMouseUp = useCallback(() => {
        setIsPanning(false);
        panStart.current = null;
        if (tempEdge) {
            setTempEdge(null);
        }
    }, [tempEdge]);

    // Zoom with mouse wheel
    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            setZoom(prev => Math.min(3, Math.max(0.1, prev + delta)));
        },
        []
    );

    // Edge creation
    const handleStartEdge = useCallback((nodeId: string) => {
        setTempEdge({ sourceId: nodeId, mouseX: 0, mouseY: 0 });
    }, []);

    const handleEndEdge = useCallback(
        (nodeId: string) => {
            if (tempEdge) {
                addEdge(tempEdge.sourceId, nodeId);
                setTempEdge(null);
            }
        },
        [tempEdge, addEdge]
    );

    // Controls
    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(3, prev + 0.15));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(0.1, prev - 0.15));
    }, []);

    const centerOnNode = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const nodeCenterX = node.x + 110;
        const nodeCenterY = node.y + 40;
        setPan({
            x: rect.width / 2 - nodeCenterX * zoom,
            y: rect.height / 2 - nodeCenterY * zoom,
        });
    }, [nodes, zoom]);

    const panTo = useCallback((worldX: number, worldY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPan({
            x: rect.width / 2 - worldX * zoom,
            y: rect.height / 2 - worldY * zoom,
        });
    }, [zoom]);

    const resetView = useCallback(() => {
        setPan({ x: 0, y: 0 });
        setZoom(1);
    }, []);

    const handleFitToScreen = useCallback(() => {
        if (nodes.length === 0) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            return;
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const nodeWidth = 220;
        const nodeHeight = 80;
        const padding = 80;

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + nodeWidth);
            maxY = Math.max(maxY, n.y + nodeHeight);
        });

        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        const scaleX = rect.width / contentWidth;
        const scaleY = rect.height / contentHeight;
        const newZoom = Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY)));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setPan({
            x: rect.width / 2 - centerX * newZoom,
            y: rect.height / 2 - centerY * newZoom,
        });
        setZoom(newZoom);
    }, [nodes]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden ${addNodeMode !== false ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            style={{
                background: `
          radial-gradient(circle, #e2e4ec 1px, transparent 1px)
        `,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                backgroundColor: 'var(--color-canvas-bg)',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
        >
            {/* Canvas content */}
            <div
                ref={canvasRef}
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '1px',
                    height: '1px',
                }}
            >
                {/* Edge SVG layer */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '99999px',
                        height: '99999px',
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                >
                    <g style={{ pointerEvents: 'auto' }}>
                        <EdgeRenderer
                            edges={edges}
                            nodes={nodes}
                            selectedEdgeId={selectedEdgeId}
                            onSelectEdge={selectEdge}
                            onDeleteEdge={deleteEdge}
                            tempEdge={tempEdge}
                        />
                    </g>
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                    <WorkflowNode
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeIds.has(node.id)}
                        isHighlighted={highlightNodeIds.has(node.id)}
                        zoom={zoom}
                        onSelect={selectNode}
                        onMove={moveNode}
                        onUpdateTitle={updateNodeTitle}
                        onUpdateStatus={(id: string, status: NodeStatus, prevStatus: NodeStatus) =>
                            updateNodeStatus(id, status, prevStatus)
                        }
                        onStartEdge={handleStartEdge}
                        onEndEdge={handleEndEdge}
                        onOpenDrawer={onOpenDrawer}
                        onOpenSubflow={onOpenSubflow}
                    />
                ))}
            </div>

            {/* Bottom-left: Add node + Search (slide-out) */}
            <div className="canvas-controls-left flex flex-row items-center gap-2">
                <CanvasControls
                    zoom={zoom}
                    addNodeMode={addNodeMode}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitToScreen={handleFitToScreen}
                    onSetAddNodeMode={setAddNodeMode}
                    onResetView={resetView}
                    showAddNode={true}
                />
                <NodeSearchSlideOut
                    nodes={nodes}
                    onCenterNode={centerOnNode}
                    onHighlightNodes={setHighlightNodeIds}
                />
            </div>

            {/* Bottom-right: Zoom + Fit only */}
            <CanvasControls
                zoom={zoom}
                addNodeMode={false}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitToScreen={handleFitToScreen}
                onSetAddNodeMode={setAddNodeMode}
                onResetView={resetView}
                showAddNode={false}
            />

            {/* Right-click context menu */}
            {contextMenu && (
                <div
                    className="fixed z-[100] py-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px]"
                    style={{ left: contextMenu.screenX, top: contextMenu.screenY }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Add node
                    </div>
                    {NODE_TEMPLATES.map(({ type, label, icon }) => (
                        <button
                            key={String(type)}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer text-gray-700"
                            onClick={() => handleContextMenuAdd(type)}
                        >
                            <span className="opacity-80">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Add node mode indicator */}
            {addNodeMode !== false && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Click to place {addNodeMode} node
                    <span className="text-indigo-200 text-xs ml-1">(N cycle · ESC cancel)</span>
                </div>
            )}

            {/* Mini-map + Find */}
            {containerSize.width > 0 && containerSize.height > 0 && (
                <MiniMapAndFind
                    nodes={nodes}
                    pan={pan}
                    zoom={zoom}
                    containerWidth={containerSize.width}
                    containerHeight={containerSize.height}
                    onPanTo={panTo}
                    highlightNodeIds={highlightNodeIds}
                />
            )}
        </div>
    );
}
