'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { copy } from '@/utils/copy';
import {resolveLocation} from "@/utils/geo";

type WeatherKind = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow';
export interface WeatherState {
	kind: WeatherKind;
	tempC: number;
	description: string;
}
interface WeatherProps {
	weather: WeatherState;
	setWeather: (w: WeatherState) => void;
}


function codeToKind(code: number): WeatherKind {
	if (code === 0) return 'sun';
	if ([1, 2, 3, 45, 48].includes(code)) return 'cloud';
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
	if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
	if ([95, 96, 99].includes(code)) return 'storm';
	return 'cloud';
}
function codeToText(code: number): string {
	if (code === 0) return 'Ciel dégagé';
	if ([1, 2, 3].includes(code)) return 'Variable / Nuageux';
	if ([45, 48].includes(code)) return 'Brouillard';
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Pluie';
	if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Neige';
	if ([95, 96, 99].includes(code)) return 'Orages';
	return 'Conditions inconnues';
}

function useMounted() {
	const [m, setM] = useState(false);
	useEffect(() => setM(true), []);
	return m;
}

export default function Weather({ weather, setWeather }: WeatherProps) {
	const mounted = useMounted();
	const [label, setLabel] = useState<string | undefined>();
	const [loading, setLoading] = useState(false);
	const [available, setAvailable] = useState(true);

	const icon = useMemo(() => {
		switch (weather.kind) {
			case 'sun':
				return '☀️';
			case 'cloud':
				return '☁️';
			case 'rain':
				return '🌧️';
			case 'storm':
				return '⛈️';
			case 'snow':
				return '❄️';
			default:
				return '⛅';
		}
	}, [weather.kind]);

	const init = async () => {
		if (typeof window === 'undefined') return;
		setLoading(true);
		try {
			// → nouvelle résolution robuste
			const pos = await resolveLocation(); // {lat, lon, label}
			setLabel(pos.label);

			// fetch météo
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current_weather=true`;
			const r = await fetch(url);
			const j = await r.json();
			const cw = j?.current_weather;
			if (!cw) throw new Error('no current_weather');

			const tempC = Math.round(cw.temperature as number);
			const kind = codeToKind(cw.weathercode as number);
			const text = codeToText(cw.weathercode as number);

			setWeather({ ...weather, tempC, kind, description: text });
			setAvailable(true);
		} catch (e) {
			// Même en cas d’échec de fetch, on essaie d’afficher le cache si présent (déjà géré par resolveLocation)
			setAvailable(false);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		init();
	}, [mounted]);

	if (!available) {
		return (
			<div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-base font-semibold tracking-tight text-white/90">
						Weather
					</h3>
					<button
						style={{
							background: 'var(--accent)',
							color: 'var(--on-accent)',
							borderColor:
								'color-mix(in oklab, var(--on-accent) 25%, transparent)',
						}}
						onClick={init}
						className="hover:cursor-pointer px-3 py-1 rounded-md text-sm"
					>
						Réessayer
					</button>
				</div>
				<div className="text-white/60 text-sm">Aucune météo disponible.</div>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-base font-semibold tracking-tight text-white/90">
					Weather
				</h3>

				<div className="flex items-center gap-2">
					{/* Lieu (copiable) */}
					<div
						onClick={() => copy(label ?? '')}
						className="hover:cursor-copy px-2 py-1 rounded-full border border-white/15 bg-white/10 text-white/80 text-xs flex items-center gap-1"
					>
						<span aria-hidden>📍</span>
						<span className="truncate max-w-[240px]" suppressHydrationWarning>
              {mounted ? label ?? '—' : ''}
            </span>
					</div>
					<button
						onClick={init}
						disabled={loading}
						style={{
							background: 'var(--accent)',
							color: 'var(--on-accent)',
							borderColor:
								'color-mix(in oklab, var(--on-accent) 25%, transparent)',
						}}
						className="hover:cursor-pointer px-3 py-1 rounded-md text-sm disabled:opacity-60"
					>
						{loading ? '…' : 'Actualiser'}
					</button>
				</div>
			</div>

			<div className="flex items-center gap-4">
				{/* Icône / valeur rendues après montage */}
				<div className="text-4xl" aria-hidden suppressHydrationWarning>
					{mounted ? icon : ''}
				</div>
				<div>
					<div
						className="text-xl font-semibold text-white"
						suppressHydrationWarning
					>
						{mounted && Number.isFinite(weather.tempC) ? `${weather.tempC}°C` : '—'}
					</div>
					<div className="text-white/70 text-sm" suppressHydrationWarning>
						{mounted
							? label
								? `${label} • ${weather.description}`
								: weather.description || '—'
							: ''}
					</div>
					<div className="text-[10px] text-white/40 mt-1">Source : Open-Meteo</div>
				</div>
			</div>
		</div>
	);
}
