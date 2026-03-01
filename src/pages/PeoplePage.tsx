import { useState, useEffect } from 'react';
import { usePeopleStore } from '../store/usePeopleStore';

export default function PeoplePage() {
    const {
        friends, incomingRequests, outgoingRequests, searchResults, loading,
        searchUsers, sendFriendRequest, acceptRequest, declineRequest, removeFriend,
    } = usePeopleStore();
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (showModal) searchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, showModal, searchUsers]);

    // Track which users already have pending/accepted requests
    const existingRequestUserIds = new Set([
        ...friends.map(f => f.profile.id),
        ...outgoingRequests.map(r => r.to_user_id),
        ...incomingRequests.map(r => r.from_user_id),
    ]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--color-surface)]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-[var(--color-surface)]">
            <div className="max-w-4xl mx-auto px-8 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">People</h1>
                    <p className="text-gray-500 text-sm">Connect with friends on the platform.</p>
                </div>

                {/* Add Friend Button */}
                <div className="mb-10">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        Find Friends
                    </button>
                </div>

                {/* Incoming Friend Requests */}
                {incomingRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Friend Requests</h2>
                        <div className="space-y-2">
                            {incomingRequests.map(request => (
                                <div key={request.id} className="flex items-center justify-between bg-white rounded-xl border border-indigo-100 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-xl">
                                            {request.from_profile.avatar_emoji}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {request.from_profile.display_name || request.from_profile.email}
                                            </p>
                                            <p className="text-xs text-gray-400">{request.from_profile.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acceptRequest(request.id)}
                                            className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => declineRequest(request.id)}
                                            className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Outgoing Requests */}
                {outgoingRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Pending Sent Requests</h2>
                        <div className="space-y-2">
                            {outgoingRequests.map(request => (
                                <div key={request.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-xl">
                                            {request.to_profile.avatar_emoji}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {request.to_profile.display_name || request.to_profile.email}
                                            </p>
                                            <p className="text-xs text-gray-400">{request.to_profile.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-amber-500 font-medium px-3 py-1.5 bg-amber-50 rounded-lg">Pending</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friends Grid */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Friends</h2>
                    {friends.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                    <path d="M16 3.13a4 4 0 010 7.75" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">No friends yet</p>
                            <p className="text-gray-400 text-xs">Search for users to send friend requests.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {friends.map(friend => (
                                <div
                                    key={friend.id}
                                    className="group bg-white rounded-xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-2xl">
                                            {friend.profile.avatar_emoji}
                                        </div>
                                        <button
                                            onClick={() => removeFriend(friend.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                                            title="Remove friend"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        {friend.profile.display_name || friend.profile.email}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">{friend.profile.email}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Find Friends Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Friends</h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by email or name..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                            autoFocus
                        />

                        {/* Search Results */}
                        <div className="mt-4 max-h-60 overflow-auto space-y-2">
                            {searchQuery.trim().length < 2 ? (
                                <p className="text-xs text-gray-400 text-center py-4">Type at least 2 characters to search</p>
                            ) : searchResults.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No users found</p>
                            ) : (
                                searchResults.map(profile => {
                                    const alreadyConnected = existingRequestUserIds.has(profile.id);
                                    return (
                                        <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-lg">
                                                    {profile.avatar_emoji}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {profile.display_name || profile.email}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{profile.email}</p>
                                                </div>
                                            </div>
                                            {alreadyConnected ? (
                                                <span className="text-xs text-gray-400 px-3 py-1.5">Already connected</span>
                                            ) : (
                                                <button
                                                    onClick={() => sendFriendRequest(profile.id)}
                                                    className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                                                >
                                                    Add Friend
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => { setShowModal(false); setSearchQuery(''); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
