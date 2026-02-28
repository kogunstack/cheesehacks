import { useState, useCallback, useEffect } from 'react';
import type { Community, CommunityGoal } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'communities';
const USER_ID = 'local-user';

function loadCommunities(): Community[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCommunities(communities: Community[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(communities));
}

export function useCommunityStore() {
    const [communities, setCommunities] = useState<Community[]>(loadCommunities);

    useEffect(() => {
        saveCommunities(communities);
    }, [communities]);

    const createCommunity = useCallback((name: string, description: string): Community => {
        const community: Community = {
            id: uuidv4(),
            name,
            description,
            members: [USER_ID],
            goals: [],
            createdAt: Date.now(),
        };
        setCommunities(prev => [community, ...prev]);
        return community;
    }, []);

    const deleteCommunity = useCallback((id: string) => {
        setCommunities(prev => prev.filter(c => c.id !== id));
    }, []);

    const joinCommunity = useCallback((id: string) => {
        setCommunities(prev =>
            prev.map(c =>
                c.id === id && !c.members.includes(USER_ID)
                    ? { ...c, members: [...c.members, USER_ID] }
                    : c
            )
        );
    }, []);

    const leaveCommunity = useCallback((id: string) => {
        setCommunities(prev =>
            prev.map(c =>
                c.id === id
                    ? { ...c, members: c.members.filter(m => m !== USER_ID) }
                    : c
            )
        );
    }, []);

    const addGoal = useCallback((communityId: string, text: string) => {
        const goal: CommunityGoal = { id: uuidv4(), text, completedBy: [] };
        setCommunities(prev =>
            prev.map(c =>
                c.id === communityId
                    ? { ...c, goals: [...c.goals, goal] }
                    : c
            )
        );
    }, []);

    const toggleGoal = useCallback((communityId: string, goalId: string) => {
        setCommunities(prev =>
            prev.map(c => {
                if (c.id !== communityId) return c;
                return {
                    ...c,
                    goals: c.goals.map(g => {
                        if (g.id !== goalId) return g;
                        const completed = g.completedBy.includes(USER_ID);
                        return {
                            ...g,
                            completedBy: completed
                                ? g.completedBy.filter(m => m !== USER_ID)
                                : [...g.completedBy, USER_ID],
                        };
                    }),
                };
            })
        );
    }, []);

    const isMember = useCallback(
        (communityId: string) => {
            const c = communities.find(c => c.id === communityId);
            return c ? c.members.includes(USER_ID) : false;
        },
        [communities]
    );

    return { communities, createCommunity, deleteCommunity, joinCommunity, leaveCommunity, addGoal, toggleGoal, isMember };
}
