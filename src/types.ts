export type NodeStatus = 'not-started' | 'in-progress' | 'done';

export type NodeType = 'start' | 'end' | 'basic' | 'milestone' | 'decision' | 'deliverable' | 'subflow';

export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface WorkflowNode {
    id: string;
    title: string;
    status: NodeStatus;
    x: number;
    y: number;
    type?: NodeType;
    subflowId?: string;
    description?: string;
    checklist?: ChecklistItem[];
    tags?: string[];
    links?: string[];
}

export interface WorkflowEdge {
    id: string;
    sourceId: string;
    targetId: string;
}

/** A workflow graph (root or nested subflow) with its own nodes and edges */
export interface WorkflowGraph {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface WorkflowProject {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    /** Nested subflow graphs keyed by subflow id */
    subflows?: Record<string, WorkflowGraph>;
}

export type ActionType =
    | { type: 'ADD_NODE'; node: WorkflowNode }
    | { type: 'DELETE_NODES'; nodeIds: string[] }
    | { type: 'MOVE_NODE'; nodeId: string; x: number; y: number; prevX: number; prevY: number }
    | { type: 'UPDATE_NODE_TITLE'; nodeId: string; title: string; prevTitle: string }
    | { type: 'UPDATE_NODE_STATUS'; nodeId: string; status: NodeStatus; prevStatus: NodeStatus }
    | { type: 'ADD_EDGE'; edge: WorkflowEdge }
    | { type: 'DELETE_EDGE'; edge: WorkflowEdge };
