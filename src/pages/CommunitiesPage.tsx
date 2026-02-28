import { useState } from 'react';
import { useCommunityStore } from '../store/useCommunityStore';

export default function CommunitiesPage() {
    const { communities, createCommunity, joinCommunity, leaveCommunity, addGoal, toggleGoal, isMember } = useCommunityStore();
    const [showModal, setShowModal] = useState(false);
    const [communityName, setCommunityName] = useState('');
    const [communityDesc, setCommunityDesc] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [goalText, setGoalText] = useState('');

    const handleCreate = () => {
        if (!communityName.trim()) return;
        createCommunity(communityName.trim(), communityDesc.trim());
        setCommunityName('');
        setCommunityDesc('');
        setShowModal(false);
    };

    const handleAddGoal = (communityId: string) => {
        if (!goalText.trim()) return;
        addGoal(communityId, goalText.trim());
        setGoalText('');
    };

    return (
        <div className="flex-1 overflow-auto bg-[var(--color-surface)]">
            <div className="max-w-4xl mx-auto px-8 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Communities</h1>
                    <p className="text-gray-500 text-sm">Join communities, share goals, and grow together.</p>
                </div>

                {/* Create Button */}
                <div className="mb-10">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create Community
                    </button>
                </div>

                {/* Community Grid */}
                {communities.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                <path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">No communities yet</p>
                        <p className="text-gray-400 text-xs">Create or join a community to collaborate on shared goals.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {communities.map(community => {
                            const isExpanded = expandedId === community.id;
                            const joined = isMember(community.id);

                            return (
                                <div
                                    key={community.id}
                                    className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-indigo-300 shadow-md col-span-full' : 'border-gray-100 hover:border-indigo-200 hover:shadow-sm'}`}
                                >
                                    {/* Card Header */}
                                    <div
                                        className="p-5 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : community.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-800">{community.name}</h3>
                                                <p className="text-xs text-gray-400 mt-1">{community.description || 'No description'}</p>
                                            </div>
                                            <svg
                                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                                                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs text-gray-500">{community.members.length} member{community.members.length !== 1 ? 's' : ''}</span>
                                            <span className="text-xs text-gray-300">·</span>
                                            <span className="text-xs text-gray-500">{community.goals.length} goal{community.goals.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-5 space-y-5">
                                            {/* Join/Leave */}
                                            <div>
                                                {joined ? (
                                                    <button
                                                        onClick={() => leaveCommunity(community.id)}
                                                        className="px-4 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                                    >
                                                        Leave Community
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => joinCommunity(community.id)}
                                                        className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all cursor-pointer"
                                                    >
                                                        Join Community
                                                    </button>
                                                )}
                                            </div>

                                            {/* Members */}
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Members</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {community.members.map((member, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                                {member === 'local-user' ? 'U' : member[0]?.toUpperCase()}
                                                            </div>
                                                            <span className="text-xs text-gray-600">{member === 'local-user' ? 'You' : member}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Goals */}
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Shared Goals</h4>
                                                {community.goals.length === 0 ? (
                                                    <p className="text-xs text-gray-400">No goals yet. Add one below.</p>
                                                ) : (
                                                    <div className="space-y-2 mb-3">
                                                        {community.goals.map(goal => {
                                                            const checked = goal.completedBy.includes('local-user');
                                                            return (
                                                                <label key={goal.id} className="flex items-center gap-3 group cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => toggleGoal(community.id, goal.id)}
                                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                                                                    />
                                                                    <span className={`text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                                        {goal.text}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400 ml-auto">
                                                                        {goal.completedBy.length}/{community.members.length}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Add Goal Input */}
                                                {joined && (
                                                    <div className="flex gap-2 mt-3">
                                                        <input
                                                            type="text"
                                                            value={goalText}
                                                            onChange={e => setGoalText(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleAddGoal(community.id)}
                                                            placeholder="Add a goal..."
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                                        />
                                                        <button
                                                            onClick={() => handleAddGoal(community.id)}
                                                            className="px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Community Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Community</h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={communityName}
                                onChange={e => setCommunityName(e.target.value)}
                                placeholder="Community name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                autoFocus
                            />
                            <textarea
                                value={communityDesc}
                                onChange={e => setCommunityDesc(e.target.value)}
                                placeholder="Description (optional)"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => { setShowModal(false); setCommunityName(''); setCommunityDesc(''); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all cursor-pointer"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
