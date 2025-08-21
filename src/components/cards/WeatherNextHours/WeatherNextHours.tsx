'use client';

import React, { useEffect, useState } from 'react';

type HourEntry = { time: string; temp: number; code: number; pop: number | null };
type Kind = 'sun'|'cloud'|'rain'|'storm'|'snow';

const CAPITALS: Record<string, { lat: number; lon: number }> = {
    FR:{lat:48.8566,lon:2.3522}, BE:{lat:50.8503,lon:4.3517}, CH:{lat:46.948,lon:7.4474},
    DE:{lat:52.52,lon:13.405}, ES:{lat:40.4168,lon:-3.7038}, IT:{lat:41.9028,lon:12.4964},
    PT:{lat:38.7223,lon:-9.1393}, NL:{lat:52.3676,lon:4.9041}, GB:{lat:51.5074,lon:-0.1278},
    US:{lat:38.9072,lon:-77.0369}, CA:{lat:45.4215,lon:-75.6972}
};

const codeToKind = (c:number): Kind =>
    c===0?'sun':[1,2,3,45,48].includes(c)?'cloud':(c>=51&&c<=67)||(c>=80&&c<=82)?'rain':(c>=71&&c<=77)||(c>=85&&c<=86)?'snow':[95,96,99].includes(c)?'storm':'cloud';

const icon = (c:number) => ({sun:'☀️',cloud:'☁️',rain:'🌧️',storm:'⛈️',snow:'❄️'}[codeToKind(c)]);

async function getLatLon(): Promise<{lat:number;lon:number}> {
    const getPosition = () => new Promise<GeolocationPosition>((resolve,reject)=>
        navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:7000})
    );
    try {
        const pos = await getPosition();
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch {
        const cc = (navigator.language?.split('-')[1] || '').toUpperCase();
        const cap = CAPITALS[cc as keyof typeof CAPITALS];
        if (cap) return cap;
        throw new Error('no location');
    }
}

export default function WeatherNextHours() {
    const [hours, setHours] = useState<HourEntry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [available, setAvailable] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const {lat, lon} = await getLatLon();
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weathercode&forecast_days=2&timezone=auto`;
            const r = await fetch(url);
            const j = await r.json();
            const t: string[] = j.hourly.time;
            const temp: number[] = j.hourly.temperature_2m;
            const pop: (number|null)[] = j.hourly.precipitation_probability ?? [];
            const code: number[] = j.hourly.weathercode;

            const now = new Date();
            const idx = t.findIndex((s) => {
                const d = new Date(s);
                return d.getHours() === now.getHours() && d.getDate() === now.getDate();
            });
            const start = Math.max(0, idx >= 0 ? idx : 0);
            const next: HourEntry[] = [];
            for (let i = start; i < Math.min(t.length, start + 8); i++) {
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

    useEffect(() => { load(); }, []);

    if (!available) {
        return (
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold tracking-tight text-white/90">Next hours</h3>
                    <button style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
                            onClick={load} className="hover:cursor-pointer px-3 py-1 rounded-md text-sm">Retry</button>
                </div>
                <div className="text-white/60 text-sm">Prévision indisponible.</div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">Next hours</h3>
                <button style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
                        onClick={load} disabled={loading} className="hover:cursor-pointer px-3 py-1 rounded-md text-sm disabled:opacity-60">
                    {loading ? '…' : 'Actualiser'}
                </button>
            </div>

            {!hours ? (
                <div className="text-white/60 text-sm">Chargement…</div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {hours.map((h, i) => {
                        const d = new Date(h.time);
                        const hh = d.toLocaleTimeString([], { hour: '2-digit' });
                        return (
                            <div key={i} className="min-w-[88px] px-3 py-3 rounded-xl border border-white/10 bg-white/5 text-center">
                                <div className="text-xs text-white/70">{hh}</div>
                                <div className="text-2xl leading-none mt-1">{icon(h.code)}</div>
                                <div className="text-sm font-semibold mt-1">{h.temp}°C</div>
                                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: (h.pop ?? 0) + '%' }} />
                                </div>
                                <div className="text-[10px] text-white/60 mt-1">{h.pop ?? 0}%</div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="text-[10px] text-white/40 mt-3">Source : Open-Meteo</div>
        </div>
    );
}
