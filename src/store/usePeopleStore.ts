import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, DEV_MODE } from './AuthContext';
import type { Profile, FriendRequest, Friend } from '../types';

const LS_FRIENDS = 'dev_friends';
const LS_REQUESTS = 'dev_friend_requests';

function loadLS<T>(key: string, fallback: T): T {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
}

function saveLS<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function usePeopleStore() {
    const { user } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<(FriendRequest & { from_profile: Profile })[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<(FriendRequest & { to_profile: Profile })[]>([]);
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriendsAndRequests = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        if (DEV_MODE) {
            setFriends(loadLS<Friend[]>(LS_FRIENDS, []));
            const reqs = loadLS<(FriendRequest & { from_profile: Profile; to_profile: Profile })[]>(LS_REQUESTS, []);
            setIncomingRequests(reqs.filter(r => r.to_user_id === user.id && r.status === 'pending'));
            setOutgoingRequests(reqs.filter(r => r.from_user_id === user.id && r.status === 'pending'));
            setLoading(false);
            return;
        }

        // Get accepted requests where I'm sender or receiver
        const { data: accepted } = await supabase
            .from('friend_requests')
            .select('*, from_profile:profiles!friend_requests_from_user_id_fkey(*), to_profile:profiles!friend_requests_to_user_id_fkey(*)')
            .eq('status', 'accepted')
            .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

        const friendsList: Friend[] = (accepted || []).map((req: Record<string, unknown>) => ({
            id: req.id as string,
            profile: (req.from_user_id === user.id ? req.to_profile : req.from_profile) as Profile,
            friendsSince: req.created_at as string,
        }));
        setFriends(friendsList);

        // Get incoming pending requests
        const { data: incoming } = await supabase
            .from('friend_requests')
            .select('*, from_profile:profiles!friend_requests_from_user_id_fkey(*)')
            .eq('to_user_id', user.id)
            .eq('status', 'pending');
        setIncomingRequests((incoming || []) as (FriendRequest & { from_profile: Profile })[]);

        // Get outgoing pending requests
        const { data: outgoing } = await supabase
            .from('friend_requests')
            .select('*, to_profile:profiles!friend_requests_to_user_id_fkey(*)')
            .eq('from_user_id', user.id)
            .eq('status', 'pending');
        setOutgoingRequests((outgoing || []) as (FriendRequest & { to_profile: Profile })[]);

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests]);

    const searchUsers = useCallback(async (query: string) => {
        if (!user || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        if (DEV_MODE) {
            // In dev mode, no real users to search — return empty
            setSearchResults([]);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(10);
        setSearchResults((data || []) as Profile[]);
    }, [user]);

    const sendFriendRequest = useCallback(async (toUserId: string) => {
        if (!user) return;

        if (DEV_MODE) {
            // No-op in dev mode
            return;
        }

        await supabase
            .from('friend_requests')
            .insert({ from_user_id: user.id, to_user_id: toUserId });
        await fetchFriendsAndRequests();
    }, [user, fetchFriendsAndRequests]);

    const acceptRequest = useCallback(async (requestId: string) => {
        if (DEV_MODE) return;

        await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);
        await fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests]);

    const declineRequest = useCallback(async (requestId: string) => {
        if (DEV_MODE) return;

        await supabase
            .from('friend_requests')
            .update({ status: 'declined' })
            .eq('id', requestId);
        await fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests]);

    const removeFriend = useCallback(async (requestId: string) => {
        if (DEV_MODE) {
            const updated = friends.filter(f => f.id !== requestId);
            setFriends(updated);
            saveLS(LS_FRIENDS, updated);
            return;
        }

        await supabase
            .from('friend_requests')
            .delete()
            .eq('id', requestId);
        await fetchFriendsAndRequests();
    }, [friends, fetchFriendsAndRequests]);

    return {
        friends, incomingRequests, outgoingRequests, searchResults, loading,
        searchUsers, sendFriendRequest, acceptRequest, declineRequest, removeFriend,
    };
}
