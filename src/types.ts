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

export type ActionType =
    | { type: 'ADD_NODE'; node: WorkflowNode }
    | { type: 'DELETE_NODES'; nodeIds: string[] }
    | { type: 'MOVE_NODE'; nodeId: string; x: number; y: number; prevX: number; prevY: number }
    | { type: 'UPDATE_NODE_TITLE'; nodeId: string; title: string; prevTitle: string }
    | { type: 'UPDATE_NODE_STATUS'; nodeId: string; status: NodeStatus; prevStatus: NodeStatus }
    | { type: 'ADD_EDGE'; edge: WorkflowEdge }
    | { type: 'DELETE_EDGE'; edge: WorkflowEdge };

// --- Supabase-backed types ---

export interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_emoji: string;
    created_at: string;
}

export interface Community {
    id: string;
    user_id: string;
    name: string;
    description: string;
    is_public: boolean;
    created_at: string;
}

export interface CommunityGoal {
    id: string;
    community_id: string;
    text: string;
    completed: boolean;
    created_at: string;
}

export interface FriendRequest {
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
}

export interface Friend {
    id: string;
    profile: Profile;
    friendsSince: string;
}
