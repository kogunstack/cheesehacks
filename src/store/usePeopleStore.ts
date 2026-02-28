import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Profile, FriendRequest, Friend } from '../types';

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
        await supabase
            .from('friend_requests')
            .insert({ from_user_id: user.id, to_user_id: toUserId });
        await fetchFriendsAndRequests();
    }, [user, fetchFriendsAndRequests]);

    const acceptRequest = useCallback(async (requestId: string) => {
        await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);
        await fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests]);

    const declineRequest = useCallback(async (requestId: string) => {
        await supabase
            .from('friend_requests')
            .update({ status: 'declined' })
            .eq('id', requestId);
        await fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests]);

    const removeFriend = useCallback(async (requestId: string) => {
        await supabase
            .from('friend_requests')
            .delete()
            .eq('id', requestId);
        await fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests]);

    return {
        friends, incomingRequests, outgoingRequests, searchResults, loading,
        searchUsers, sendFriendRequest, acceptRequest, declineRequest, removeFriend,
    };
}
