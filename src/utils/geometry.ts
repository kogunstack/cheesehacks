import type { WorkflowNode } from '../types';

export function getHandlePosition(
    node: WorkflowNode,
    side: 'input' | 'output',
    nodeWidth: number = 220,
    nodeHeight: number = 80
): { x: number; y: number } {
    if (side === 'input') {
        return { x: node.x, y: node.y + nodeHeight / 2 };
    }
    return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
}

export function getBezierPath(
    sx: number,
    sy: number,
    tx: number,
    ty: number
): string {
    const dx = Math.abs(tx - sx) * 0.5;
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}
