// components/cards/Backup/Backup.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from '@/components/GlassCard/GlassCard';
import SectionTitle from '@/components/SectionTitle/SectionTitle';

// Types du dashboard
import { WeatherState } from '@/types/weather';
import { Profile } from '@/types/profile';
import { GalleryItem } from '@/types/gallery';
import { Note } from '@/types/note';
import { Skill } from '@/types/skill';

type AppState = {
    accentColor: string;
    background?: string;
    profile: Profile;
    weather: WeatherState;
    skills: Skill[];
    notes: Note[];
    gallery: GalleryItem[];
};

// Clés de stockage
const STATE_KEY = 'life-dashboard-state-v1';
const QUICK_LAUNCH_KEY = 'quick-launch-items-v1';
const VIS_KEY = 'life-dashboard-visible-v1';

// ====== mini toast (succès/erreur) ======
function toast(msg: string, kind: 'success' | 'error' | 'info' = 'info') {
    const id = 'ld-toaster';
    let root = document.getElementById(id);
    if (!root) {
        root = document.createElement('div');
        root.id = id;
        Object.assign(root.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: '99999',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
        } as CSSStyleDeclaration);
        document.body.appendChild(root);
    }
    const el = document.createElement('div');
    const bg =
        kind === 'success'
            ? 'var(--accent, #7c3aed)'
            : kind === 'error'
                ? '#ef4444'
                : 'rgba(17,24,39,.9)';
    const color = kind === 'info' ? '#fff' : 'var(--on-accent, #fff)';
    Object.assign(el.style, {
        pointerEvents: 'auto',
        background: bg,
        color,
        borderRadius: '12px',
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,.15)',
        boxShadow: '0 8px 30px rgba(0,0,0,.35)',
        transform: 'translateY(-8px)',
        opacity: '0',
        transition: 'transform .18s ease, opacity .18s ease',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '.2px',
        maxWidth: '320px',
        whiteSpace: 'pre-line',
    } as unknown as CSSStyleDeclaration);
    el.textContent = msg;
    root.appendChild(el);
    requestAnimationFrame(() => {
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
    });
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px)';
        setTimeout(() => el.remove(), 220);
    }, 1600);
}

// ====== payload ======
type BackupPayloadV2 = {
    schema: 'life-dashboard-backup';
    version: 2; // <— V2 : ajoute "visible"
    createdAt: string;
    app: { state: AppState };
    quickLaunch: Array<{ id: string; url: string; title: string; icon?: string }>;
    visible?: Record<string, boolean>;
};

function downloadJSON(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const fmt = (d = new Date()) => d.toISOString().replace(/[-:T]/g, '').slice(0, 15); // YYYYMMDDhhmmss
const ensureArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const uniqueBy = <T,>(arr: T[], key: (x: T) => string) => {
    const m = new Map<string, T>();
    for (const it of arr) m.set(key(it), it);
    return [...m.values()];
};

interface Props {
    state: AppState;
    setState: (s: AppState) => void;
}

export default function BackupCard({ state, setState }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<'replace' | 'merge'>('replace');
    const [status, setStatus] = useState<string | null>(null);

    // ---- Segmented highlight (pour corriger le “blanc”) ----
    const segRef = useRef<HTMLDivElement>(null);
    const aRef = useRef<HTMLButtonElement>(null);
    const bRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const active = mode === 'replace' ? aRef.current : bRef.current;
        const wrap = segRef.current;
        if (!active || !wrap) return;
        const aw = active.getBoundingClientRect();
        const ww = wrap.getBoundingClientRect();
        const left = aw.left - ww.left;
        const width = aw.width;
        const hl = wrap.querySelector<HTMLElement>('[data-hl]');
        if (hl) {
            hl.style.transform = `translateX(${left}px)`;
            hl.style.width = `${width}px`;
        }
    }, [mode]);

    const quickLaunch = useMemo(() => {
        try {
            const raw = localStorage.getItem(QUICK_LAUNCH_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }, [state]);

    const visibleFromLS = () => {
        try {
            const raw = localStorage.getItem(VIS_KEY);
            return raw ? (JSON.parse(raw) as Record<string, boolean>) : undefined;
        } catch {
            return undefined;
        }
    };

    const onExport = () => {
        const payload: BackupPayloadV2 = {
            schema: 'life-dashboard-backup',
            version: 2,
            createdAt: new Date().toISOString(),
            app: { state },
            quickLaunch,
            visible: visibleFromLS(),
        };
        const name = `life-dashboard-backup-${fmt()}.json`;
        downloadJSON(payload, name);
        setStatus(`Exported ${name}`);
        toast('Backup exporté ✔︎', 'success');
    };

    const onImportClick = () => fileRef.current?.click();

    const applyReplace = (incoming: AppState, importedQL: BackupPayloadV2['quickLaunch']) => {
        const next: AppState = {
            ...state,
            ...incoming,
            profile: { ...state.profile, ...incoming.profile },
            weather: { ...state.weather, ...incoming.weather },
            skills: ensureArray<Skill>(incoming.skills),
            notes: ensureArray<Note>(incoming.notes),
            gallery: ensureArray<GalleryItem>(incoming.gallery),
        };
        setState(next);
        try {
            localStorage.setItem(QUICK_LAUNCH_KEY, JSON.stringify(importedQL ?? []));
        } catch {}
    };

    const applyMerge = (incoming: AppState, importedQL: BackupPayloadV2['quickLaunch']) => {
        const merged: AppState = {
            ...state,
            accentColor: incoming.accentColor ?? state.accentColor,
            background: incoming.background ?? state.background,
            profile: { ...state.profile, ...incoming.profile },
            weather: { ...state.weather, ...incoming.weather },
            skills: uniqueBy(
                [...state.skills, ...(incoming.skills ?? [])],
                (x) => (x as any).id ?? `${(x as any).name}-${(x as any).level}`,
            ),
            notes: uniqueBy(
                [...state.notes, ...(incoming.notes ?? [])],
                (x) => ((x as any).id ?? (x as any).text ?? Math.random().toString(36)),
            ),
            gallery: uniqueBy(
                [...state.gallery, ...(incoming.gallery ?? [])],
                (x) => (x as any).id ?? (x as any).src,
            ),
        };
        setState(merged);
        try {
            const currentRaw = localStorage.getItem(QUICK_LAUNCH_KEY);
            const current = currentRaw ? JSON.parse(currentRaw) : [];
            const mergedQL = uniqueBy([...(current || []), ...(importedQL || [])], (x) => (x as any).id ?? (x as any).url);
            localStorage.setItem(QUICK_LAUNCH_KEY, JSON.stringify(mergedQL));
        } catch {}
    };

    const onImportFile = async (file: File) => {
        try {
            const text = await file.text();
            const json = JSON.parse(text);

            let incomingState: AppState | undefined;
            let importedQL: BackupPayloadV2['quickLaunch'] = [];
            let importedVisible: Record<string, boolean> | undefined;

            if (json?.schema === 'life-dashboard-backup') {
                incomingState = json?.app?.state;
                importedQL = ensureArray(json?.quickLaunch);
                importedVisible = json?.visible;
            } else if (json?.profile && json?.skills && json?.notes) {
                incomingState = json as AppState;
            }

            if (!incomingState) {
                setStatus('Fichier invalide : aucun état de dashboard trouvé.');
                toast('Import impossible : fichier invalide', 'error');
                return;
            }

            if (mode === 'replace') {
                const ok = window.confirm(
                    'Remplacer tout le contenu par la sauvegarde ? Cette action écrasera vos données actuelles.',
                );
                if (!ok) return;
                applyReplace(incomingState, importedQL);
            } else {
                applyMerge(incomingState, importedQL);
            }

            // Persistance (état + visibilité si fournie)
            try {
                localStorage.setItem(
                    STATE_KEY,
                    JSON.stringify(mode === 'replace' ? incomingState : { ...state, ...incomingState }),
                );
                if (importedVisible) {
                    localStorage.setItem(VIS_KEY, JSON.stringify(importedVisible));
                }
            } catch {}

            setStatus(`Import ${mode === 'replace' ? 'remplacement' : 'fusion'} réussi ✔︎`);
            toast('Backup importé ✔︎', 'success');
        } catch (e) {
            setStatus('Échec de l’import : JSON illisible.');
            toast("Échec de l'import", 'error');
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <GlassCard className="p-5">
            <SectionTitle
                title="Backup"
                right={
                    <div className="flex items-center gap-2">
                        {/* Segmented control sans “fond blanc” */}
                        <div
                            ref={segRef}
                            className="hidden sm:flex relative items-center text-xs border border-white/15 rounded-full p-0.5 bg-white/5"
                            style={{ isolation: 'isolate' }}
                        >
                            <div
                                data-hl
                                className="absolute top-0.5 left-0.5 h-[calc(100%-4px)] rounded-full transition-all duration-200"
                                style={{ background: 'var(--accent)' }}
                            />
                            <button
                                ref={aRef}
                                onClick={() => setMode('replace')}
                                className="relative z-10 px-3 py-1 rounded-full bg-transparent"
                                style={{ color: mode === 'replace' ? 'var(--on-accent)' : 'rgba(255,255,255,.8)' }}
                            >
                                Replace
                            </button>
                            <button
                                ref={bRef}
                                onClick={() => setMode('merge')}
                                className="relative z-10 px-3 py-1 rounded-full bg-transparent"
                                style={{ color: mode === 'merge' ? 'var(--on-accent)' : 'rgba(255,255,255,.8)' }}
                            >
                                Merge
                            </button>
                        </div>

                        <button
                            onClick={onExport}
                            className="hover:cursor-pointer px-3 py-1 rounded-md text-sm border"
                            style={{
                                background: 'var(--accent)',
                                color: 'var(--on-accent)',
                                borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)',
                            }}
                        >
                            Export JSON
                        </button>
                        <button
                            onClick={onImportClick}
                            className="hover:cursor-pointer px-3 py-1 rounded-md text-sm bg-white/10 text-white border border-white/15"
                        >
                            Import…
                        </button>
                    </div>
                }
            />

            <p className="text-white/70 text-sm">
                Sauvegarde/Restaurer votre dashboard (profil, météo, skills, notes, galerie, fond, accent), vos raccourcis Quick
                Launch et la visibilité des apps.
            </p>

            <div className="mt-3 text-xs text-white/50">
                Stockage local : <code className="text-white/70">{STATE_KEY}</code> /{' '}
                <code className="text-white/70">{QUICK_LAUNCH_KEY}</code> /{' '}
                <code className="text-white/70">{VIS_KEY}</code>
            </div>

            {status && <div className="mt-3 text-sm text-white/80">{status}</div>}

            <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportFile(f);
                }}
            />
        </GlassCard>
    );
}
