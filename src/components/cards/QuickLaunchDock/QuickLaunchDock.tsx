'use client';

import React, { useEffect, useRef, useState } from 'react';

type LaunchItem = { id: string; url: string; title: string; icon: string };

const STORAGE_KEY = 'quick-launch-items-v1';
const gIcon = (u: string) =>
    'https://www.google.com/s2/favicons?sz=64&domain_url=' + encodeURIComponent(u);

function normalizeUrl(input: string) {
    if (!input) return '';
    try {
        const u = new URL(input);
        if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
    } catch {}
    return 'https://' + input.replace(/^https?:\/\//, '');
}
const host = (u: string) => new URL(u).hostname;

export default function QuickLaunchDock() {
    const [items, setItems] = useState<LaunchItem[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch {}
        return [
            { id: 'gh', url: 'https://github.com', title: 'GitHub', icon: gIcon('https://github.com') },
            { id: 'fig', url: 'https://www.figma.com', title: 'Figma', icon: gIcon('https://www.figma.com') },
            { id: 'ntn', url: 'https://www.notion.so', title: 'Notion', icon: gIcon('https://www.notion.so') },
        ];
    });
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const [adding, setAdding] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

    async function fetchMeta(u: string) {
        try {
            const r = await fetch('/api/link-meta?url=' + encodeURIComponent(u));
            if (r.ok) {
                const j = await r.json();
                return { title: j.title || host(u), icon: j.icon || gIcon(u) };
            }
        } catch {}
        return { title: host(u), icon: gIcon(u) };
    }

    async function add() {
        const url = normalizeUrl(urlInput.trim());
        if (!url) return;
        const { title, icon } = await fetchMeta(url);
        setItems([{ id: 'li-' + Date.now(), url, title, icon }, ...items]);
        setUrlInput('');
        setAdding(false);
    }

    const remove = (id: string) => setItems(items.filter(i => i.id !== id));

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">Quick Launch</h3>
                {!adding ? (
                    <button onClick={() => setAdding(true)} className="hover:cursor-pointer px-3 py-1 rounded-md bg-[var(--accent)] text-white text-sm">+ Add</button>
                ) : (
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://site.com"
                            onKeyDown={(e) => e.key === 'Enter' ? add() : e.key === 'Escape' ? setAdding(false) : null}
                            className="bg-black/20 text-white/90 rounded-md px-3 py-1 w-64"
                        />
                        <button onClick={add} className="px-3 py-1 rounded-md bg-[var(--accent)] text-white text-sm">Add</button>
                        <button onClick={() => { setAdding(false); setUrlInput(''); }} className="px-3 py-1 rounded-md bg-white/10 text-white text-sm">Cancel</button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {items.map((it) => (
                    <div key={it.id} className="group relative flex flex-col items-center">
                        <a
                            href={it.url} target="_blank" rel="noopener noreferrer"
                            className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15 bg-white/10 grid place-items-center hover:scale-[1.04] transition-transform shadow"
                        >
                            <img
                                src={it.icon || gIcon(it.url)} alt=""
                                className="w-8 h-8 object-contain"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = gIcon(it.url); }}
                            />
                        </a>
                        <div className="mt-2 text-[11px] text-center text-white/80 w-20 truncate" title={it.title}>
                            {it.title}
                        </div>

                        {/* bouton croix au survol */}
                        <button
                            onClick={() => remove(it.id)}
                            className="hover:cursor-pointer absolute -top-2 -right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove shortcut"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
