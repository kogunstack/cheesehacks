import { useState, useCallback, useEffect } from 'react';
import type { WorkflowProject } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'workflows-projects';

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
            nodes: [],
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

    return { projects, createProject, deleteProject, updateProject, getProject };
}
