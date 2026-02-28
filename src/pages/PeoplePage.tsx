import { useState } from 'react';
import { usePeopleStore } from '../store/usePeopleStore';

export default function PeoplePage() {
    const { friends, addFriend, removeFriend } = usePeopleStore();
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');

    const handleAdd = () => {
        if (!name.trim()) return;
        addFriend(name.trim());
        setName('');
        setShowModal(false);
    };

    return (
        <div className="flex-1 overflow-auto bg-[var(--color-surface)]">
            <div className="max-w-4xl mx-auto px-8 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">People</h1>
                    <p className="text-gray-500 text-sm">Connect with friends and see what they're working on.</p>
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
                        Add Friend
                    </button>
                </div>

                {/* Friend Grid */}
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
                        <p className="text-gray-400 text-xs">Add friends to see what they're working on.</p>
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
                                        {friend.avatar}
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
                                <h3 className="text-sm font-semibold text-gray-800">{friend.name}</h3>
                                <p className="text-xs text-gray-400 mt-1">{friend.currentProject}</p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <div className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`} />
                                    <span className="text-xs text-gray-500 capitalize">{friend.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Friend Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Friend</h2>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Enter friend's name"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => { setShowModal(false); setName(''); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all cursor-pointer"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
