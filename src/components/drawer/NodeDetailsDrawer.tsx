import { useState, useCallback, useEffect } from 'react';
import type { WorkflowNode, NodeStatus, ChecklistItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const STATUS_OPTIONS: { value: NodeStatus; label: string }[] = [
    { value: 'not-started', label: 'Not started' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
];

interface NodeDetailsDrawerProps {
    node: WorkflowNode | null;
    onClose?: () => void;
    onUpdateNode: (nodeId: string, partial: Partial<WorkflowNode>) => void;
    /** When false, only the form content is rendered (no outer wrapper/header). Used inside stack. */
    showHeader?: boolean;
}

export default function NodeDetailsDrawer({
    node,
    onClose,
    onUpdateNode,
    showHeader = true,
}: NodeDetailsDrawerProps) {
    const [title, setTitle] = useState(node?.title ?? '');
    const [description, setDescription] = useState(node?.description ?? '');
    const [newCheckItem, setNewCheckItem] = useState('');
    const [newTag, setNewTag] = useState('');
    const [newLink, setNewLink] = useState('');

    useEffect(() => {
        setTitle(node?.title ?? '');
        setDescription(node?.description ?? '');
        setNewCheckItem('');
        setNewTag('');
        setNewLink('');
    }, [node?.id, node?.title, node?.description]);

    const persistTitle = useCallback(() => {
        const t = title.trim() || 'Untitled';
        if (node && t !== node.title) {
            onUpdateNode(node.id, { title: t });
        }
    }, [node, title, onUpdateNode]);

    const persistDescription = useCallback(() => {
        if (node && description !== (node.description ?? '')) {
            onUpdateNode(node.id, { description: description || undefined });
        }
    }, [node, description, onUpdateNode]);

    const addChecklistItem = useCallback(() => {
        const text = newCheckItem.trim();
        if (!node || !text) return;
        const list = node.checklist ?? [];
        const item: ChecklistItem = { id: uuidv4(), text, checked: false };
        onUpdateNode(node.id, { checklist: [...list, item] });
        setNewCheckItem('');
    }, [node, newCheckItem, onUpdateNode]);

    const toggleChecklistItem = useCallback(
        (itemId: string) => {
            if (!node?.checklist) return;
            const next = node.checklist.map(it =>
                it.id === itemId ? { ...it, checked: !it.checked } : it
            );
            onUpdateNode(node.id, { checklist: next });
        },
        [node, onUpdateNode]
    );

    const removeChecklistItem = useCallback(
        (itemId: string) => {
            if (!node?.checklist) return;
            const next = node.checklist.filter(it => it.id !== itemId);
            onUpdateNode(node.id, { checklist: next.length ? next : undefined });
        },
        [node, onUpdateNode]
    );

    const updateChecklistItemText = useCallback(
        (itemId: string, text: string) => {
            if (!node?.checklist) return;
            const next = node.checklist.map(it =>
                it.id === itemId ? { ...it, text } : it
            );
            onUpdateNode(node.id, { checklist: next });
        },
        [node, onUpdateNode]
    );

    const addTag = useCallback(() => {
        const t = newTag.trim();
        if (!node || !t) return;
        const tags = node.tags ?? [];
        if (tags.includes(t)) return;
        onUpdateNode(node.id, { tags: [...tags, t] });
        setNewTag('');
    }, [node, newTag, onUpdateNode]);

    const removeTag = useCallback(
        (tag: string) => {
            if (!node?.tags) return;
            const next = node.tags.filter(t => t !== tag);
            onUpdateNode(node.id, { tags: next.length ? next : undefined });
        },
        [node, onUpdateNode]
    );

    const addLink = useCallback(() => {
        const url = newLink.trim();
        if (!node || !url) return;
        const links = node.links ?? [];
        onUpdateNode(node.id, { links: [...links, url] });
        setNewLink('');
    }, [node, newLink, onUpdateNode]);

    const removeLink = useCallback(
        (url: string) => {
            if (!node?.links) return;
            const next = node.links.filter(u => u !== url);
            onUpdateNode(node.id, { links: next.length ? next : undefined });
        },
        [node, onUpdateNode]
    );

    const setStatus = useCallback(
        (status: NodeStatus) => {
            if (node) onUpdateNode(node.id, { status });
        },
        [node, onUpdateNode]
    );

    if (!node) return null;

    const checklist = node.checklist ?? [];
    const tags = node.tags ?? [];
    const links = node.links ?? [];

    const content = (
        <div className={showHeader ? 'flex-1 overflow-y-auto px-4 py-4 space-y-5' : 'space-y-5'}>
                {/* Title */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={persistTitle}
                        onKeyDown={e => e.key === 'Enter' && persistTitle()}
                        className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Description (markdown-friendly textarea) */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        onBlur={persistDescription}
                        rows={4}
                        placeholder="Markdown or rich text..."
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y min-h-[80px]"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Status
                    </label>
                    <select
                        value={node.status}
                        onChange={e => setStatus(e.target.value as NodeStatus)}
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Checklist */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Checklist
                    </label>
                    <ul className="space-y-1.5 mb-2">
                        {checklist.map(item => (
                            <li
                                key={item.id}
                                className="flex items-center gap-2 group"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleChecklistItem(item.id)}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                        item.checked
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-gray-300 hover:border-indigo-400'
                                    }`}
                                >
                                    {item.checked && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={e => updateChecklistItemText(item.id, e.target.value)}
                                    onBlur={e => {
                                        const v = e.target.value.trim();
                                        if (!v) removeChecklistItem(item.id);
                                        else if (v !== item.text) updateChecklistItemText(item.id, v);
                                    }}
                                    className={`flex-1 min-w-0 px-2 py-1 text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none bg-transparent ${
                                        item.checked ? 'text-gray-400 line-through' : 'text-gray-800'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeChecklistItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                                    aria-label="Remove"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCheckItem}
                            onChange={e => setNewCheckItem(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                            placeholder="Add item..."
                            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={addChecklistItem}
                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="hover:text-indigo-900 cursor-pointer"
                                    aria-label={`Remove ${tag}`}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Add tag..."
                            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Links */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Links
                    </label>
                    <ul className="space-y-1.5 mb-2">
                        {links.map(url => (
                            <li key={url} className="flex items-center gap-2 group">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-0 truncate text-sm text-indigo-600 hover:underline"
                                >
                                    {url}
                                </a>
                                <button
                                    type="button"
                                    onClick={() => removeLink(url)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                                    aria-label="Remove link"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={newLink}
                            onChange={e => setNewLink(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                            placeholder="https://..."
                            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={addLink}
                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </div>
        </div>
    );

    if (!showHeader) {
        return <div className="px-4 py-3">{content}</div>;
    }
    return (
        <div className="w-[380px] flex-shrink-0 h-full flex flex-col bg-white border-l border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Node details</h2>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>
            {content}
        </div>
    );
}
