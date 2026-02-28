import { useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import WorkflowCanvas from '../components/canvas/WorkflowCanvas';
import type { WorkflowNode, WorkflowEdge } from '../types';
import { exportCanvasAsPng } from '../utils/export';

export default function Workflows() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, createProject, deleteProject, updateProject, getProject } = useProjectStore();
    const canvasRef = useRef<HTMLDivElement>(null);

    const currentProject = projectId ? getProject(projectId) : null;

    const handleSave = useCallback(
        (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
            if (!currentProject) return;
            updateProject({ ...currentProject, nodes, edges });
        },
        [currentProject, updateProject]
    );

    const handleCreateProject = useCallback(() => {
        const project = createProject('Untitled Workflow');
        navigate(`/workflows/${project.id}`);
    }, [createProject, navigate]);

    const handleExport = useCallback(async () => {
        if (!canvasRef.current || !currentProject) return;
        await exportCanvasAsPng(canvasRef.current, currentProject.name);
    }, [currentProject]);

    // If a project is selected, render the canvas
    if (currentProject) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Project header bar */}
                <div className="h-11 min-h-[44px] bg-white border-b border-gray-100 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/workflows')}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className="text-sm font-medium text-gray-700">{currentProject.name}</span>
                        <span className="text-xs text-gray-400 ml-1">
                            · {currentProject.nodes.length} nodes
                        </span>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all cursor-pointer"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                    </button>
                </div>
                <WorkflowCanvas
                    initialNodes={currentProject.nodes}
                    initialEdges={currentProject.edges}
                    onSave={handleSave}
                    canvasRef={canvasRef}
                />
            </div>
        );
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
