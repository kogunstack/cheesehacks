import { createContext, useContext } from 'react';
import type { WorkflowNode, WorkflowEdge } from '../types';

export interface WorkflowStoreValue {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    selectedNodeIds: Set<string>;
    selectedEdgeId: string | null;
    addNode: (x: number, y: number, partial?: Partial<WorkflowNode>) => WorkflowNode;
    deleteNodes: (nodeIds: string[]) => void;
    moveNode: (nodeId: string, x: number, y: number, prevX: number, prevY: number) => void;
    updateNodeTitle: (nodeId: string, title: string, prevTitle: string) => void;
    updateNodeStatus: (nodeId: string, status: import('../types').NodeStatus, prevStatus: import('../types').NodeStatus) => void;
    updateNode: (nodeId: string, partial: Partial<WorkflowNode>) => void;
    addEdge: (sourceId: string, targetId: string) => void;
    deleteEdge: (edgeId: string) => void;
    undo: () => void;
    redo: () => void;
    selectNode: (nodeId: string, shiftKey: boolean) => void;
    selectEdge: (edgeId: string) => void;
    clearSelection: () => void;
    setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<WorkflowEdge[]>>;
}

const WorkflowStoreContext = createContext<WorkflowStoreValue | null>(null);

export function useWorkflowStoreContext(): WorkflowStoreValue {
    const ctx = useContext(WorkflowStoreContext);
    if (!ctx) throw new Error('WorkflowStoreContext used outside provider');
    return ctx;
}

export const WorkflowStoreProvider = WorkflowStoreContext.Provider;
