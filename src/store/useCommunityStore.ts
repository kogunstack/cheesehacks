import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, DEV_MODE } from './AuthContext';
import type { Community, CommunityGoal } from '../types';

const LS_COMMUNITIES = 'dev_communities';
const LS_GOALS = 'dev_goals';

function loadLS<T>(key: string, fallback: T): T {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
}

function saveLS<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function useCommunityStore() {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [publicCommunities, setPublicCommunities] = useState<Community[]>([]);
    const [goalsByComm, setGoalsByComm] = useState<Record<string, CommunityGoal[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        if (DEV_MODE) {
            setCommunities(loadLS<Community[]>(LS_COMMUNITIES, []));
            setGoalsByComm(loadLS<Record<string, CommunityGoal[]>>(LS_GOALS, {}));
            setPublicCommunities([]);
            setLoading(false);
            return;
        }

        // Fetch my communities
        const { data: comms } = await supabase
            .from('communities')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setCommunities(comms || []);

        // Fetch public communities from other users
        const { data: pubComms } = await supabase
            .from('communities')
            .select('*')
            .eq('is_public', true)
            .neq('user_id', user.id)
            .order('created_at', { ascending: false });

        setPublicCommunities(pubComms || []);

        // Fetch goals for all communities
        const allIds = [...(comms || []), ...(pubComms || [])].map(c => c.id);
        if (allIds.length > 0) {
            const { data: goals } = await supabase
                .from('community_goals')
                .select('*')
                .in('community_id', allIds);

            const grouped: Record<string, CommunityGoal[]> = {};
            (goals || []).forEach(g => {
                if (!grouped[g.community_id]) grouped[g.community_id] = [];
                grouped[g.community_id].push(g);
            });
            setGoalsByComm(grouped);
        } else {
            setGoalsByComm({});
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createCommunity = useCallback(async (name: string, description: string, isPublic: boolean = true) => {
        if (!user) return;

        if (DEV_MODE) {
            const newComm: Community = {
                id: crypto.randomUUID(),
                user_id: user.id,
                name,
                description,
                is_public: isPublic,
                created_at: new Date().toISOString(),
            };
            const updated = [newComm, ...communities];
            setCommunities(updated);
            saveLS(LS_COMMUNITIES, updated);
            return;
        }

        const { data } = await supabase
            .from('communities')
            .insert({ user_id: user.id, name, description, is_public: isPublic })
            .select()
            .single();
        if (data) setCommunities(prev => [data, ...prev]);
    }, [user, communities]);

    const deleteCommunity = useCallback(async (id: string) => {
        if (DEV_MODE) {
            const updated = communities.filter(c => c.id !== id);
            setCommunities(updated);
            saveLS(LS_COMMUNITIES, updated);
            const updatedGoals = { ...goalsByComm };
            delete updatedGoals[id];
            setGoalsByComm(updatedGoals);
            saveLS(LS_GOALS, updatedGoals);
            return;
        }

        await supabase.from('communities').delete().eq('id', id);
        setCommunities(prev => prev.filter(c => c.id !== id));
        setGoalsByComm(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, [communities, goalsByComm]);

    const addGoal = useCallback(async (communityId: string, text: string) => {
        if (DEV_MODE) {
            const newGoal: CommunityGoal = {
                id: crypto.randomUUID(),
                community_id: communityId,
                text,
                completed: false,
                created_at: new Date().toISOString(),
            };
            const updatedGoals = {
                ...goalsByComm,
                [communityId]: [...(goalsByComm[communityId] || []), newGoal],
            };
            setGoalsByComm(updatedGoals);
            saveLS(LS_GOALS, updatedGoals);
            return;
        }

        const { data } = await supabase
            .from('community_goals')
            .insert({ community_id: communityId, text })
            .select()
            .single();
        if (data) {
            setGoalsByComm(prev => ({
                ...prev,
                [communityId]: [...(prev[communityId] || []), data],
            }));
        }
    }, [goalsByComm]);

    const toggleGoal = useCallback(async (communityId: string, goalId: string) => {
        const goal = goalsByComm[communityId]?.find(g => g.id === goalId);
        if (!goal) return;

        if (DEV_MODE) {
            const updatedGoals = {
                ...goalsByComm,
                [communityId]: goalsByComm[communityId].map(g =>
                    g.id === goalId ? { ...g, completed: !g.completed } : g
                ),
            };
            setGoalsByComm(updatedGoals);
            saveLS(LS_GOALS, updatedGoals);
            return;
        }

        const { data } = await supabase
            .from('community_goals')
            .update({ completed: !goal.completed })
            .eq('id', goalId)
            .select()
            .single();
        if (data) {
            setGoalsByComm(prev => ({
                ...prev,
                [communityId]: prev[communityId].map(g => g.id === goalId ? data : g),
            }));
        }
    }, [goalsByComm]);

    return {
        communities, publicCommunities, goalsByComm, loading,
        createCommunity, deleteCommunity, addGoal, toggleGoal,
    };
}
