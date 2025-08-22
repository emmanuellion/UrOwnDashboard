'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { resolveLocation } from '@/utils/geo'; // ← helper ajouté précédemment

type HourEntry = { time: string; temp: number; code: number; pop: number | null };
type Kind = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow';

const codeToKind = (c: number): Kind =>
    c === 0
        ? 'sun'
        : [1, 2, 3, 45, 48].includes(c)
            ? 'cloud'
            : (c >= 51 && c <= 67) || (c >= 80 && c <= 82)
                ? 'rain'
                : (c >= 71 && c <= 77) || (c >= 85 && c <= 86)
                    ? 'snow'
                    : [95, 96, 99].includes(c)
                        ? 'storm'
                        : 'cloud';

const icon = (c: number) =>
    ({ sun: '☀️', cloud: '☁️', rain: '🌧️', storm: '⛈️', snow: '❄️' }[
        codeToKind(c)
        ]);

export default function WeatherNextHours() {
    const [hours, setHours] = useState<HourEntry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [available, setAvailable] = useState(true);

    const fmtHour = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                hour: '2-digit',
                hourCycle: 'h23', // évite 12h/24h aléatoire
            }),
        []
    );

    async function load() {
        setLoading(true);
        try {
            // Position robuste (géoloc → cache → capitale → Paris)
            const pos = await resolveLocation();

            // Prévisions horaires Open-Meteo (2 jours suffisent)
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&hourly=temperature_2m,precipitation_probability,weathercode&forecast_days=2&timezone=auto`;
            const r = await fetch(url);
            const j = await r.json();

            const t: string[] = j?.hourly?.time ?? [];
            const temp: number[] = j?.hourly?.temperature_2m ?? [];
            const pop: (number | null)[] = j?.hourly?.precipitation_probability ?? [];
            const code: number[] = j?.hourly?.weathercode ?? [];

            if (!t.length) throw new Error('no hourly data');

            // On part du prochain créneau >= maintenant
            const now = Date.now();
            let idx = t.findIndex((s) => new Date(s).getTime() >= now);
            if (idx < 0) idx = 0;

            const next: HourEntry[] = [];
            const end = Math.min(t.length, idx + 8);
            for (let i = idx; i < end; i++) {
                next.push({
                    time: t[i],
                    temp: Math.round(temp[i]),
                    code: code[i],
                    pop: pop?.[i] ?? null,
                });
            }

            setHours(next);
            setAvailable(true);
        } catch {
            setAvailable(false);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // charge seulement côté client → évite l’hydratation “surprise”
        load();
    }, []);

    if (!available) {
        return (
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold tracking-tight text-white/90">
                        Next hours
                    </h3>
                </div>
                <div className="text-white/60 text-sm">Prévision indisponible.</div>
                <div className="mt-3">
                    <button
                        onClick={load}
                        className="hover:cursor-pointer px-3 py-1 rounded-md text-sm"
                        style={{
                            background: 'var(--accent)',
                            color: 'var(--on-accent)',
                            borderColor:
                                'color-mix(in oklab, var(--on-accent) 25%, transparent)',
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">
                    Next hours
                </h3>
                <button
                    onClick={load}
                    disabled={loading}
                    className="hover:cursor-pointer px-3 py-1 rounded-md text-sm disabled:opacity-60"
                    style={{
                        background: 'var(--accent)',
                        color: 'var(--on-accent)',
                        borderColor:
                            'color-mix(in oklab, var(--on-accent) 25%, transparent)',
                    }}
                >
                    {loading ? '…' : 'Actualiser'}
                </button>
            </div>

            {!hours ? (
                <div className="text-white/60 text-sm">Chargement…</div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {hours.map((h, i) => {
                        const d = new Date(h.time);
                        const hh = fmtHour.format(d);
                        const p = Math.max(0, Math.min(100, h.pop ?? 0));
                        return (
                            <div
                                key={`${h.time}-${i}`}
                                className="min-w-[88px] px-3 py-3 rounded-xl border border-white/10 bg-white/5 text-center"
                            >
                                <div className="text-xs text-white/70">{hh}</div>
                                <div className="text-2xl leading-none mt-1">{icon(h.code)}</div>
                                <div className="text-sm font-semibold mt-1">{h.temp}°C</div>
                                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-1.5 rounded-full bg-[var(--accent)]"
                                        style={{ width: `${p}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-white/60 mt-1">{p}%</div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="text-[10px] text-white/40 mt-3">Source : Open-Meteo</div>
        </div>
    );
}
