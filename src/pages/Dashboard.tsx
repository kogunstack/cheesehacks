import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';

export default function Dashboard() {
    const { projects, createProject, deleteProject } = useProjectStore();
    const navigate = useNavigate();

    const handleCreate = () => {
        const project = createProject('Untitled Workflow');
        navigate(`/app/workflows/${project.id}`);
    };

    return (
        <div className="flex-1 overflow-auto bg-[var(--color-surface)]">
            <div className="max-w-4xl mx-auto px-8 py-10">
                {/* Welcome */}
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back 👋</h1>
                    <p className="text-gray-500 text-sm">Manage your workflow projects and visualize processes.</p>
                </div>

                {/* Quick Actions */}
                <div className="mb-10">
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create New Workflow Project
                    </button>
                </div>

                {/* Recent Projects */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Projects</h2>
                    {projects.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                    <circle cx="5" cy="6" r="3" />
                                    <path d="M8 6h8" />
                                    <circle cx="19" cy="6" r="3" />
                                    <circle cx="12" cy="18" r="3" />
                                    <path d="M5 9v3a3 3 0 003 3h1" />
                                    <path d="M19 9v3a3 3 0 01-3 3h-1" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">No projects yet</p>
                            <p className="text-gray-400 text-xs">Create your first workflow project to get started.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className="group bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                                    onClick={() => navigate(`/app/workflows/${project.id}`)}
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
                                                {project.nodes.length} nodes · Updated {new Date(project.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
