'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export type AppDef = { id: string; label: string; group?: string };

type Props = {
    registry: AppDef[];
    visible: Record<string, boolean>;
    onChange: (next: Record<string, boolean>) => void;
    onReset?: () => void;
};

export default function AppsMenu({ registry, visible, onChange, onReset }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const btnRef = useRef<HTMLButtonElement>(null);
    const popRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!open) return;
            if (
                popRef.current &&
                !popRef.current.contains(e.target as Node) &&
                btnRef.current &&
                !btnRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? registry.filter((r) => r.label.toLowerCase().includes(q)) : registry;
    }, [registry, query]);

    const toggle = (id: string) => onChange({ ...visible, [id]: !visible[id] });
    const selectAll = () => {
        const next: Record<string, boolean> = {};
        for (const r of registry) next[r.id] = true;
        onChange(next);
    };
    const deselectAll = () => {
        const next: Record<string, boolean> = {};
        for (const r of registry) next[r.id] = false;
        onChange(next);
    };

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={() => setOpen((o) => !o)}
                className="px-3 py-1 rounded-md bg-white/10 text-white text-sm border border-white/15 hover:bg-white/15"
            >
                Apps
            </button>

            {open && (
                <div
                    ref={popRef}
                    className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/20 bg-black backdrop-blur-2xl p-3 shadow-[0_8px_40px_rgba(0,0,0,0.35)] z-50"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search app…"
                            className="flex-1 bg-black/20 text-white/90 rounded-md px-2 py-1 text-sm"
                        />
                        <button
                            onClick={onReset}
                            className="px-2 py-1 rounded-md bg-white/10 text-white text-xs border border-white/15"
                            title="Reset defaults"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-2 text-xs">
                        <button onClick={selectAll} className="px-2 py-1 rounded bg-white/10 border border-white/15 text-white/80">
                            Select all
                        </button>
                        <button onClick={deselectAll} className="px-2 py-1 rounded bg-white/10 border border-white/15 text-white/80">
                            Deselect all
                        </button>
                    </div>

                    <div className="max-h-72 overflow-auto pr-1">
                        <ul className="grid grid-cols-1 gap-1">
                            {filtered.map((r) => (
                                <li key={r.id}>
                                    <label className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="accent-[var(--accent)]"
                                            checked={!!visible[r.id]}
                                            onChange={() => toggle(r.id)}
                                        />
                                        <span className="text-sm text-white/90">{r.label}</span>
                                        {r.group && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full border border-white/15 text-white/60">{r.group}</span>}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
