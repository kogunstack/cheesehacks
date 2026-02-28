import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Community, CommunityGoal } from '../types';

export function useCommunityStore() {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [goalsByComm, setGoalsByComm] = useState<Record<string, CommunityGoal[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { data: comms } = await supabase
            .from('communities')
            .select('*')
            .order('created_at', { ascending: false });

        setCommunities(comms || []);

        if (comms && comms.length > 0) {
            const commIds = comms.map(c => c.id);
            const { data: goals } = await supabase
                .from('community_goals')
                .select('*')
                .in('community_id', commIds);

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

    const createCommunity = useCallback(async (name: string, description: string) => {
        if (!user) return;
        const { data } = await supabase
            .from('communities')
            .insert({ user_id: user.id, name, description })
            .select()
            .single();
        if (data) setCommunities(prev => [data, ...prev]);
    }, [user]);

    const deleteCommunity = useCallback(async (id: string) => {
        await supabase.from('communities').delete().eq('id', id);
        setCommunities(prev => prev.filter(c => c.id !== id));
        setGoalsByComm(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const addGoal = useCallback(async (communityId: string, text: string) => {
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
    }, []);

    const toggleGoal = useCallback(async (communityId: string, goalId: string) => {
        const goal = goalsByComm[communityId]?.find(g => g.id === goalId);
        if (!goal) return;
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

    return { communities, goalsByComm, loading, createCommunity, deleteCommunity, addGoal, toggleGoal };
}
