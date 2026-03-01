import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { WorkflowStoreProvider } from '../contexts/WorkflowStoreContext';
import WorkflowCanvas from '../components/canvas/WorkflowCanvas';
import NodeDetailsDrawerStack, { type DrawerStackItem } from '../components/drawer/NodeDetailsDrawerStack';
import type { WorkflowNode, WorkflowEdge, NodeType } from '../types';
import { exportCanvasAsPng } from '../utils/export';

export interface BreadcrumbSegment {
    id: string;
    name: string;
}

function WorkflowCanvasView() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const {
        getProject,
        updateProject,
        getSubflow,
        createSubflow,
        updateSubflow,
    } = useProjectStore();
    const canvasRef = useRef<HTMLDivElement>(null);
    const currentProject = projectId ? getProject(projectId) : null;

    const [path, setPath] = useState<BreadcrumbSegment[]>(() =>
        currentProject ? [{ id: currentProject.id, name: currentProject.name }] : []
    );
    const [drawerStack, setDrawerStack] = useState<DrawerStackItem[]>([]);

    useEffect(() => {
        if (currentProject && (path.length === 0 || path[0].id !== currentProject.id)) {
            setPath([{ id: currentProject.id, name: currentProject.name }]);
        }
    }, [currentProject?.id, currentProject?.name]);

    const currentGraph = useMemo(() => {
        if (!currentProject) return { nodes: [] as WorkflowNode[], edges: [] as WorkflowEdge[] };
        if (path.length === 1) {
            return { nodes: currentProject.nodes, edges: currentProject.edges };
        }
        const sub = getSubflow(currentProject.id, path[path.length - 1].id);
        return sub ? { nodes: sub.nodes, edges: sub.edges } : { nodes: [], edges: [] };
    }, [currentProject, path, getSubflow]);

    const handleSaveCurrent = useCallback(
        (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
            if (!currentProject) return;
            if (path.length === 1) {
                updateProject({ ...currentProject, nodes, edges });
            } else {
                const subflowId = path[path.length - 1].id;
                const sub = getSubflow(currentProject.id, subflowId);
                if (sub) updateSubflow(currentProject.id, { ...sub, nodes, edges });
            }
        },
        [currentProject, path, updateProject, getSubflow, updateSubflow]
    );

    const store = useWorkflowStore(
        currentGraph.nodes,
        currentGraph.edges,
        handleSaveCurrent
    );

    const openDrawer = useCallback((nodeId: string) => {
        setDrawerStack(prev => {
            const idx = prev.findIndex(e => e.nodeId === nodeId);
            if (idx >= 0) {
                const next = [...prev];
                const [item] = next.splice(idx, 1);
                return [{ ...item, collapsed: false }, ...next];
            }
            return [{ nodeId, collapsed: false }, ...prev];
        });
    }, []);
    const closeDrawerAll = useCallback(() => setDrawerStack([]), []);
    const removeFromDrawerStack = useCallback((nodeId: string) => {
        setDrawerStack(prev => prev.filter(e => e.nodeId !== nodeId));
    }, []);
    const toggleDrawerCollapsed = useCallback((nodeId: string) => {
        setDrawerStack(prev =>
            prev.map(e => (e.nodeId === nodeId ? { ...e, collapsed: !e.collapsed } : e))
        );
    }, []);

    const openSubflow = useCallback(
        (subflowId: string) => {
            if (!currentProject) return;
            let sub = getSubflow(currentProject.id, subflowId);
            if (!sub) {
                sub = createSubflow(currentProject.id, 'Untitled Subflow', subflowId);
            }
            setPath(prev => [...prev, { id: sub.id, name: sub.name }]);
        },
        [currentProject, getSubflow, createSubflow]
    );

    const defaultTitleForType = (type: NodeType): string => {
        switch (type) {
            case 'start': return 'Start';
            case 'end': return 'End';
            case 'basic': return 'New Node';
            case 'milestone': return 'Milestone';
            case 'decision': return 'Decision';
            case 'deliverable': return 'Deliverable';
            case 'subflow': return 'Untitled Subflow';
            default: return 'New Node';
        }
    };

    const addNodeAt = useCallback(
        (x: number, y: number, type: NodeType) => {
            if (!currentProject) return;
            if (type === 'subflow') {
                const sub = createSubflow(currentProject.id, 'Untitled Subflow');
                store.addNode(x, y, { type: 'subflow', subflowId: sub.id, title: sub.name });
            } else {
                store.addNode(x, y, { type, title: defaultTitleForType(type) });
            }
        },
        [currentProject, createSubflow, store]
    );

    const goToPathIndex = useCallback((index: number) => {
        setPath(prev => prev.slice(0, index + 1));
        setDrawerStack([]);
    }, []);

    const handleExport = useCallback(async () => {
        if (!canvasRef.current || !currentProject) return;
        await exportCanvasAsPng(canvasRef.current, currentProject.name);
    }, [currentProject]);

    if (!currentProject) return null;

    return (
        <WorkflowStoreProvider value={store}>
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Breadcrumb + header bar */}
                <div className="h-11 min-h-[44px] bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-wrap gap-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => navigate('/workflows')}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                            aria-label="Back to workflows"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                            {path.map((seg, i) => (
                                <span key={seg.id} className="flex items-center gap-1">
                                    {i > 0 && (
                                        <span className="text-gray-300 select-none">/</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => goToPathIndex(i)}
                                        className={`font-medium rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors cursor-pointer ${
                                            i === path.length - 1 ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {seg.name}
                                    </button>
                                </span>
                            ))}
                        </nav>
                        <span className="text-xs text-gray-400">
                            · {store.nodes.length} nodes
                        </span>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all cursor-pointer"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                    </button>
                </div>

                <div className="flex-1 flex min-h-0">
                    <div className="flex-1 min-w-0 min-h-0">
                        <WorkflowCanvas
                            canvasRef={canvasRef}
                            onOpenDrawer={openDrawer}
                            onOpenSubflow={openSubflow}
                            onAddNode={addNodeAt}
                        />
                    </div>
                    {drawerStack.length > 0 && (
                        <NodeDetailsDrawerStack
                            stack={drawerStack}
                            nodes={store.nodes}
                            onUpdateNode={store.updateNode}
                            onRemoveFromStack={removeFromDrawerStack}
                            onToggleCollapsed={toggleDrawerCollapsed}
                            onCloseAll={closeDrawerAll}
                        />
                    )}
                </div>
            </div>
        </WorkflowStoreProvider>
    );
}

export default function Workflows() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, createProject, deleteProject, getProject } = useProjectStore();

    const currentProject = projectId ? getProject(projectId) : null;

    const handleCreateProject = useCallback(() => {
        const project = createProject('Untitled Workflow');
        navigate(`/workflows/${project.id}`);
    }, [createProject, navigate]);

    if (currentProject) {
        return <WorkflowCanvasView />;
    }

    // Project list view
    return (
        <div className="flex-1 overflow-auto bg-[var(--color-surface)]">
            <div className="max-w-3xl mx-auto px-8 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
                        <p className="text-gray-500 text-sm mt-1">Create and manage visual workflow diagrams.</p>
                    </div>
                    <button
                        onClick={handleCreateProject}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Workflow
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                                <circle cx="5" cy="6" r="3" />
                                <path d="M8 6h8" />
                                <circle cx="19" cy="6" r="3" />
                                <circle cx="12" cy="18" r="3" />
                                <path d="M5 9v3a3 3 0 003 3h1" />
                                <path d="M19 9v3a3 3 0 01-3 3h-1" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No workflows yet</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                            Create your first workflow to start mapping out processes with a visual node graph.
                        </p>
                        <button
                            onClick={handleCreateProject}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium text-sm hover:bg-indigo-600 transition-all cursor-pointer"
                        >
                            Create your first workflow
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                className="group bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                                onClick={() => navigate(`/workflows/${project.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                                            <circle cx="5" cy="6" r="3" />
                                            <path d="M8 6h8" />
                                            <circle cx="19" cy="6" r="3" />
                                            <circle cx="12" cy="18" r="3" />
                                            <path d="M5 9v3a3 3 0 003 3h1" />
                                            <path d="M19 9v3a3 3 0 01-3 3h-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {project.nodes.length} nodes · {project.edges.length} connections · Updated{' '}
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            deleteProject(project.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                                        title="Delete project"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
