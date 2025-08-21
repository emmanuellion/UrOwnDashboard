'use client';

import React, { useMemo, useRef, useState } from 'react';
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

// Nom des clés déjà utilisées dans ta page
const STATE_KEY = 'life-dashboard-state-v1';
const QUICK_LAUNCH_KEY = 'quick-launch-items-v1';

type BackupPayload = {
    schema: 'life-dashboard-backup';
    version: 1;
    createdAt: string;
    app: { state: AppState };
    quickLaunch: Array<{ id: string; url: string; title: string; icon?: string }>;
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

const fmt = (d = new Date()) =>
    d.toISOString().replace(/[-:T]/g, '').slice(0, 15); // YYYYMMDDhhmmss

function ensureArray<T = unknown>(v: any): T[] {
    return Array.isArray(v) ? v : [];
}

function uniqueBy<T>(arr: T[], keyGetter: (x: T) => string) {
    const map = new Map<string, T>();
    for (const it of arr) map.set(keyGetter(it), it);
    return Array.from(map.values());
}

interface Props {
    state: AppState;
    setState: (s: AppState) => void;
}

export default function BackupCard({ state, setState }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<'replace' | 'merge'>('replace');
    const [status, setStatus] = useState<string | null>(null);

    const quickLaunch: BackupPayload['quickLaunch'] = useMemo(() => {
        try {
            const raw = localStorage.getItem(QUICK_LAUNCH_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }, [state]); // recalcul léger quand l’état change

    const onExport = () => {
        const payload: BackupPayload = {
            schema: 'life-dashboard-backup',
            version: 1,
            createdAt: new Date().toISOString(),
            app: { state },
            quickLaunch,
        };
        const name = `life-dashboard-backup-${fmt()}.json`;
        downloadJSON(payload, name);
        setStatus(`Exported ${name}`);
    };

    const onImportClick = () => fileRef.current?.click();

    const applyReplace = (incoming: AppState, importedQL: BackupPayload['quickLaunch']) => {
        // remplace l’état (en gardant de la robustesse si un champ manque)
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

    const applyMerge = (incoming: AppState, importedQL: BackupPayload['quickLaunch']) => {
        const merged: AppState = {
            ...state,
            // accent/background/profile/weather : on garde ceux importés s’ils existent, sinon on conserve les actuels
            accentColor: incoming.accentColor ?? state.accentColor,
            background: incoming.background ?? state.background,
            profile: { ...state.profile, ...incoming.profile },
            weather: { ...state.weather, ...incoming.weather },
            // concat + unicité par id (si id manque, on garde l’élément tel quel)
            skills: uniqueBy([...state.skills, ...(incoming.skills ?? [])], (x) => x.id ?? `${x.name}-${x.level}`),
            notes: uniqueBy([...state.notes, ...(incoming.notes ?? [])], (x) => (x as any).id ?? (x as any).text ?? ''),
            gallery: uniqueBy([...state.gallery, ...(incoming.gallery ?? [])], (x) => x.id ?? x.src),
        };
        setState(merged);

        try {
            const currentRaw = localStorage.getItem(QUICK_LAUNCH_KEY);
            const current = currentRaw ? JSON.parse(currentRaw) : [];
            const mergedQL = uniqueBy([...(current || []), ...(importedQL || [])], (x) => x.id ?? x.url);
            localStorage.setItem(QUICK_LAUNCH_KEY, JSON.stringify(mergedQL));
        } catch {}
    };

    const onImportFile = async (file: File) => {
        try {
            const text = await file.text();
            const json = JSON.parse(text);

            // tolérant : accepte soit backup complet (schema), soit juste l’état (cas “export maison”)
            let incomingState: AppState | undefined;
            let importedQL: BackupPayload['quickLaunch'] = [];

            if (json?.schema === 'life-dashboard-backup') {
                incomingState = json?.app?.state;
                importedQL = ensureArray(json?.quickLaunch);
            } else if (json?.profile && json?.skills && json?.notes) {
                incomingState = json as AppState;
            }

            if (!incomingState) {
                setStatus('Fichier invalide : aucun état de dashboard trouvé.');
                return;
            }

            if (mode === 'replace') {
                const ok = window.confirm('Remplacer tout le contenu par la sauvegarde ? Cette action écrasera vos données actuelles.');
                if (!ok) return;
                applyReplace(incomingState, importedQL);
            } else {
                applyMerge(incomingState, importedQL);
            }

            // Persistance immédiate pour que l’onglet voisin reflète la modif
            try {
                localStorage.setItem(STATE_KEY, JSON.stringify(mode === 'replace' ? incomingState : { ...state, ...incomingState }));
            } catch {}

            setStatus(`Import ${mode === 'replace' ? 'remplacement' : 'fusion'} réussi ✔︎`);
        } catch (e) {
            setStatus('Échec de l’import : JSON illisible.');
        } finally {
            // reset input pour permettre de ré-importer le même fichier
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <GlassCard className="p-5">
            <SectionTitle
                title="Backup"
                right={
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center text-xs text-white/70 border border-white/15 rounded-full p-0.5 bg-white/5">
                            <button
                                onClick={() => setMode('replace')}
                                className={`px-3 py-1 rounded-full ${mode === 'replace' ? 'bg-[var(--accent)] text-white' : 'text-white/80'}`}
                            >
                                Replace
                            </button>
                            <button
                                onClick={() => setMode('merge')}
                                className={`px-3 py-1 rounded-full ${mode === 'merge' ? 'bg-[var(--accent)] text-white' : 'text-white/80'}`}
                            >
                                Merge
                            </button>
                        </div>

                        <button onClick={onExport} className="px-3 py-1 rounded-md bg-[var(--accent)] text-white text-sm">
                            Export JSON
                        </button>
                        <button onClick={onImportClick} className="px-3 py-1 rounded-md bg-white/10 text-white text-sm">
                            Import…
                        </button>
                    </div>
                }
            />

            <p className="text-white/70 text-sm">
                Sauvegarde/Restaurer votre dashboard (profil, météo, skills, notes, galerie, fond, accent) et vos raccourcis Quick Launch.
            </p>

            <div className="mt-3 text-xs text-white/50">
                Stockage local actuel : <code className="text-white/70">{STATE_KEY}</code> / <code className="text-white/70">{QUICK_LAUNCH_KEY}</code>
            </div>

            {status && (
                <div className="mt-3 text-sm text-white/80">
                    {status}
                </div>
            )}

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
