export type NodeStatus = 'not-started' | 'in-progress' | 'done';

export interface WorkflowNode {
    id: string;
    title: string;
    status: NodeStatus;
    x: number;
    y: number;
}

export interface WorkflowEdge {
    id: string;
    sourceId: string;
    targetId: string;
}

export interface WorkflowProject {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface Friend {
    id: string;
    name: string;
    avatar: string;
    currentProject: string;
    status: 'online' | 'offline';
}

export interface CommunityGoal {
    id: string;
    text: string;
    completedBy: string[];
}

export interface Community {
    id: string;
    name: string;
    description: string;
    members: string[];
    goals: CommunityGoal[];
    createdAt: number;
}

export type ActionType =
    | { type: 'ADD_NODE'; node: WorkflowNode }
    | { type: 'DELETE_NODES'; nodeIds: string[] }
    | { type: 'MOVE_NODE'; nodeId: string; x: number; y: number; prevX: number; prevY: number }
    | { type: 'UPDATE_NODE_TITLE'; nodeId: string; title: string; prevTitle: string }
    | { type: 'UPDATE_NODE_STATUS'; nodeId: string; status: NodeStatus; prevStatus: NodeStatus }
    | { type: 'ADD_EDGE'; edge: WorkflowEdge }
    | { type: 'DELETE_EDGE'; edge: WorkflowEdge };
