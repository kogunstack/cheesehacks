import { useState, useCallback, useEffect } from 'react';
import type { WorkflowProject, WorkflowGraph, WorkflowNode } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'workflows-projects';

const START_POS = { x: 80, y: 80 };
const END_POS = { x: 80, y: 220 };

function createDefaultStartEndNodes(): WorkflowNode[] {
    return [
        { id: uuidv4(), title: 'Start', status: 'not-started', x: START_POS.x, y: START_POS.y, type: 'start' },
        { id: uuidv4(), title: 'End', status: 'not-started', x: END_POS.x, y: END_POS.y, type: 'end' },
    ];
}

function loadProjects(): WorkflowProject[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveProjects(projects: WorkflowProject[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjectStore() {
    const [projects, setProjects] = useState<WorkflowProject[]>(loadProjects);

    useEffect(() => {
        saveProjects(projects);
    }, [projects]);

    const createProject = useCallback((name: string): WorkflowProject => {
        const now = Date.now();
        const project: WorkflowProject = {
            id: uuidv4(),
            name,
            createdAt: now,
            updatedAt: now,
            nodes: createDefaultStartEndNodes(),
            edges: [],
        };
        setProjects(prev => [project, ...prev]);
        return project;
    }, []);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    }, []);

    const updateProject = useCallback((updated: WorkflowProject) => {
        setProjects(prev =>
            prev.map(p => (p.id === updated.id ? { ...updated, updatedAt: Date.now() } : p))
        );
    }, []);

    const getProject = useCallback(
        (id: string) => projects.find(p => p.id === id) || null,
        [projects]
    );

    const getSubflow = useCallback(
        (projectId: string, subflowId: string): WorkflowGraph | null => {
            const project = projects.find(p => p.id === projectId);
            if (!project?.subflows) return null;
            return project.subflows[subflowId] ?? null;
        },
        [projects]
    );

    const createSubflow = useCallback(
        (projectId: string, name: string, id?: string): WorkflowGraph => {
            const graphId = id ?? uuidv4();
            const graph: WorkflowGraph = { id: graphId, name, nodes: createDefaultStartEndNodes(), edges: [] };
            setProjects(prev =>
                prev.map(p =>
                    p.id === projectId
                        ? {
                              ...p,
                              subflows: { ...(p.subflows ?? {}), [graphId]: graph },
                              updatedAt: Date.now(),
                          }
                        : p
                )
            );
            return graph;
        },
        []
    );

    const updateSubflow = useCallback(
        (projectId: string, graph: WorkflowGraph) => {
            setProjects(prev =>
                prev.map(p =>
                    p.id === projectId
                        ? {
                              ...p,
                              subflows: { ...(p.subflows ?? {}), [graph.id]: graph },
                              updatedAt: Date.now(),
                          }
                        : p
                )
            );
        },
        []
    );

    return {
        projects,
        createProject,
        deleteProject,
        updateProject,
        getProject,
        getSubflow,
        createSubflow,
        updateSubflow,
    };
}
