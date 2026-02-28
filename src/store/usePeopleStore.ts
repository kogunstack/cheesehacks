import { useState, useCallback, useEffect } from 'react';
import type { Friend } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'people-friends';

const AVATARS = ['🧑', '👩', '👨', '🧔', '👩‍🦰', '👨‍🦱', '👩‍🦳', '🧑‍🦲', '👳', '🧕', '👲', '🤠'];

function loadFriends(): Friend[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveFriends(friends: Friend[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
}

export function usePeopleStore() {
    const [friends, setFriends] = useState<Friend[]>(loadFriends);

    useEffect(() => {
        saveFriends(friends);
    }, [friends]);

    const addFriend = useCallback((name: string): Friend => {
        const friend: Friend = {
            id: uuidv4(),
            name,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            currentProject: 'No active project',
            status: Math.random() > 0.5 ? 'online' : 'offline',
        };
        setFriends(prev => [friend, ...prev]);
        return friend;
    }, []);

    const removeFriend = useCallback((id: string) => {
        setFriends(prev => prev.filter(f => f.id !== id));
    }, []);

    return { friends, addFriend, removeFriend };
}
