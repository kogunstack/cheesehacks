import { useCallback, useRef, useState, useEffect } from 'react';
import type { WorkflowNode, WorkflowEdge, ActionType, NodeStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useWorkflowStore(
    initialNodes: WorkflowNode[],
    initialEdges: WorkflowEdge[],
    onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void
) {
    const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
    const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

    const undoStack = useRef<ActionType[]>([]);
    const redoStack = useRef<ActionType[]>([]);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges]);

    const save = useCallback(
        (n: WorkflowNode[], e: WorkflowEdge[]) => {
            onSave(n, e);
        },
        [onSave]
    );

    const pushUndo = useCallback((action: ActionType) => {
        undoStack.current.push(action);
        redoStack.current = [];
    }, []);

    // Node operations
    const addNode = useCallback(
        (x: number, y: number, partial?: Partial<WorkflowNode>) => {
            const node: WorkflowNode = {
                id: uuidv4(),
                title: partial?.title ?? 'New Node',
                status: (partial?.status as NodeStatus) ?? 'not-started',
                x,
                y,
                type: partial?.type ?? 'basic',
                ...partial,
            };
            setNodes(prev => {
                const next = [...prev, node];
                save(next, edges);
                return next;
            });
            pushUndo({ type: 'ADD_NODE', node });
            return node;
        },
        [edges, pushUndo, save]
    );

    const deleteNodes = useCallback(
        (nodeIds: string[]) => {
            if (nodeIds.length === 0) return;
            setNodes(prev => {
                const next = prev.filter(n => !nodeIds.includes(n.id));
                setEdges(prevEdges => {
                    const nextEdges = prevEdges.filter(
                        e => !nodeIds.includes(e.sourceId) && !nodeIds.includes(e.targetId)
                    );
                    save(next, nextEdges);
                    return nextEdges;
                });
                return next;
            });
            pushUndo({ type: 'DELETE_NODES', nodeIds });
            setSelectedNodeIds(new Set());
        },
        [pushUndo, save]
    );

    const moveNode = useCallback(
        (nodeId: string, x: number, y: number, prevX: number, prevY: number) => {
            setNodes(prev => {
                const next = prev.map(n => (n.id === nodeId ? { ...n, x, y } : n));
                save(next, edges);
                return next;
            });
            pushUndo({ type: 'MOVE_NODE', nodeId, x, y, prevX, prevY });
        },
        [edges, pushUndo, save]
    );

    const updateNodeTitle = useCallback(
        (nodeId: string, title: string, prevTitle: string) => {
            setNodes(prev => {
                const next = prev.map(n => (n.id === nodeId ? { ...n, title } : n));
                save(next, edges);
                return next;
            });
            pushUndo({ type: 'UPDATE_NODE_TITLE', nodeId, title, prevTitle });
        },
        [edges, pushUndo, save]
    );

    const updateNodeStatus = useCallback(
        (nodeId: string, status: NodeStatus, prevStatus: NodeStatus) => {
            setNodes(prev => {
                const next = prev.map(n => (n.id === nodeId ? { ...n, status } : n));
                save(next, edges);
                return next;
            });
            pushUndo({ type: 'UPDATE_NODE_STATUS', nodeId, status, prevStatus });
        },
        [edges, pushUndo, save]
    );

    /** Partial update for node details (drawer). Persists immediately, no undo. */
    const updateNode = useCallback(
        (nodeId: string, partial: Partial<WorkflowNode>) => {
            setNodes(prev => {
                const next = prev.map(n =>
                    n.id === nodeId ? { ...n, ...partial } : n
                );
                save(next, edges);
                return next;
            });
        },
        [edges, save]
    );

    // Edge operations
    const addEdge = useCallback(
        (sourceId: string, targetId: string) => {
            // Prevent duplicate and self-links
            if (sourceId === targetId) return;
            const exists = edges.some(e => e.sourceId === sourceId && e.targetId === targetId);
            if (exists) return;

            const edge: WorkflowEdge = { id: uuidv4(), sourceId, targetId };
            setEdges(prev => {
                const next = [...prev, edge];
                save(nodes, next);
                return next;
            });
            pushUndo({ type: 'ADD_EDGE', edge });
        },
        [edges, nodes, pushUndo, save]
    );

    const deleteEdge = useCallback(
        (edgeId: string) => {
            const edge = edges.find(e => e.id === edgeId);
            if (!edge) return;
            setEdges(prev => {
                const next = prev.filter(e => e.id !== edgeId);
                save(nodes, next);
                return next;
            });
            pushUndo({ type: 'DELETE_EDGE', edge });
            setSelectedEdgeId(null);
        },
        [edges, nodes, pushUndo, save]
    );

    // Undo
    const undo = useCallback(() => {
        const action = undoStack.current.pop();
        if (!action) return;
        redoStack.current.push(action);

        switch (action.type) {
            case 'ADD_NODE':
                setNodes(prev => {
                    const next = prev.filter(n => n.id !== action.node.id);
                    setEdges(prevE => {
                        const nextE = prevE.filter(
                            e => e.sourceId !== action.node.id && e.targetId !== action.node.id
                        );
                        save(next, nextE);
                        return nextE;
                    });
                    return next;
                });
                break;
            case 'DELETE_NODES':
                // Can't fully undo multi-delete without storing deleted nodes — simplified
                break;
            case 'MOVE_NODE':
                setNodes(prev => {
                    const next = prev.map(n =>
                        n.id === action.nodeId ? { ...n, x: action.prevX, y: action.prevY } : n
                    );
                    save(next, edges);
                    return next;
                });
                break;
            case 'UPDATE_NODE_TITLE':
                setNodes(prev => {
                    const next = prev.map(n =>
                        n.id === action.nodeId ? { ...n, title: action.prevTitle } : n
                    );
                    save(next, edges);
                    return next;
                });
                break;
            case 'UPDATE_NODE_STATUS':
                setNodes(prev => {
                    const next = prev.map(n =>
                        n.id === action.nodeId ? { ...n, status: action.prevStatus } : n
                    );
                    save(next, edges);
                    return next;
                });
                break;
            case 'ADD_EDGE':
                setEdges(prev => {
                    const next = prev.filter(e => e.id !== action.edge.id);
                    save(nodes, next);
                    return next;
                });
                break;
            case 'DELETE_EDGE':
                setEdges(prev => {
                    const next = [...prev, action.edge];
                    save(nodes, next);
                    return next;
                });
                break;
        }
    }, [edges, nodes, save]);

    // Redo
    const redo = useCallback(() => {
        const action = redoStack.current.pop();
        if (!action) return;
        undoStack.current.push(action);

        switch (action.type) {
            case 'ADD_NODE':
                setNodes(prev => {
                    const next = [...prev, action.node];
                    save(next, edges);
                    return next;
                });
                break;
            case 'MOVE_NODE':
                setNodes(prev => {
                    const next = prev.map(n =>
                        n.id === action.nodeId ? { ...n, x: action.x, y: action.y } : n
                    );
                    save(next, edges);
                    return next;
                });
                break;
            case 'UPDATE_NODE_TITLE':
                setNodes(prev => {
                    const next = prev.map(n =>
                        n.id === action.nodeId ? { ...n, title: action.title } : n
                    );
                    save(next, edges);
                    return next;
                });
                break;
            case 'UPDATE_NODE_STATUS':
                setNodes(prev => {
                    const next = prev.map(n =>
                        n.id === action.nodeId ? { ...n, status: action.status } : n
                    );
                    save(next, edges);
                    return next;
                });
                break;
            case 'ADD_EDGE':
                setEdges(prev => {
                    const next = [...prev, action.edge];
                    save(nodes, next);
                    return next;
                });
                break;
            case 'DELETE_EDGE':
                setEdges(prev => {
                    const next = prev.filter(e => e.id !== action.edge.id);
                    save(nodes, next);
                    return next;
                });
                break;
            default:
                break;
        }
    }, [edges, nodes, save]);

    // Selection
    const selectNode = useCallback(
        (nodeId: string, shiftKey: boolean) => {
            setSelectedEdgeId(null);
            if (shiftKey) {
                setSelectedNodeIds(prev => {
                    const next = new Set(prev);
                    if (next.has(nodeId)) next.delete(nodeId);
                    else next.add(nodeId);
                    return next;
                });
            } else {
                setSelectedNodeIds(new Set([nodeId]));
            }
        },
        []
    );

    const selectEdge = useCallback((edgeId: string) => {
        setSelectedNodeIds(new Set());
        setSelectedEdgeId(edgeId);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNodeIds(new Set());
        setSelectedEdgeId(null);
    }, []);

    return {
        nodes,
        edges,
        selectedNodeIds,
        selectedEdgeId,
        addNode,
        deleteNodes,
        moveNode,
        updateNodeTitle,
        updateNodeStatus,
        updateNode,
        addEdge,
        deleteEdge,
        undo,
        redo,
        selectNode,
        selectEdge,
        clearSelection,
        setNodes,
        setEdges,
    };
}
