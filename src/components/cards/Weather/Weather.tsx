'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {copy} from "@/utils/copy";

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

/** Capitales de fallback (complète si besoin) */
const CAPITALS: Record<string, { lat: number; lon: number; label: string }> = {
	FR: { lat: 48.8566, lon: 2.3522, label: 'Paris, FR' },
	BE: { lat: 50.8503, lon: 4.3517, label: 'Bruxelles, BE' },
	CH: { lat: 46.948, lon: 7.4474, label: 'Berne, CH' },
	DE: { lat: 52.52, lon: 13.405, label: 'Berlin, DE' },
	ES: { lat: 40.4168, lon: -3.7038, label: 'Madrid, ES' },
	IT: { lat: 41.9028, lon: 12.4964, label: 'Rome, IT' },
	PT: { lat: 38.7223, lon: -9.1393, label: 'Lisbonne, PT' },
	NL: { lat: 52.3676, lon: 4.9041, label: 'Amsterdam, NL' },
	GB: { lat: 51.5074, lon: -0.1278, label: 'Londres, GB' },
	IE: { lat: 53.3498, lon: -6.2603, label: 'Dublin, IE' },
	US: { lat: 38.9072, lon: -77.0369, label: 'Washington, US' },
	CA: { lat: 45.4215, lon: -75.6972, label: 'Ottawa, CA' },
	JP: { lat: 35.6762, lon: 139.6503, label: 'Tokyo, JP' },
	KR: { lat: 37.5665, lon: 126.978, label: 'Seoul, KR' },
	CN: { lat: 39.9042, lon: 116.4074, label: 'Pékin, CN' },
	IN: { lat: 28.6139, lon: 77.209, label: 'New Delhi, IN' },
	AU: { lat: -35.2809, lon: 149.13, label: 'Canberra, AU' },
	NZ: { lat: -41.2866, lon: 174.7756, label: 'Wellington, NZ' },
	BR: { lat: -15.7939, lon: -47.8828, label: 'Brasília, BR' },
	MX: { lat: 19.4326, lon: -99.1332, label: 'Mexico, MX' },
	MA: { lat: 34.0209, lon: -6.8416, label: 'Rabat, MA' },
	DZ: { lat: 36.7538, lon: 3.0588, label: 'Alger, DZ' },
	TN: { lat: 36.8065, lon: 10.1815, label: 'Tunis, TN' },
	EG: { lat: 30.0444, lon: 31.2357, label: 'Le Caire, EG' },
	TR: { lat: 39.9334, lon: 32.8597, label: 'Ankara, TR' },
	SE: { lat: 59.3293, lon: 18.0686, label: 'Stockholm, SE' },
	NO: { lat: 59.9139, lon: 10.7522, label: 'Oslo, NO' },
	FI: { lat: 60.1699, lon: 24.9384, label: 'Helsinki, FI' },
	DK: { lat: 55.6761, lon: 12.5683, label: 'Copenhague, DK' },
	PL: { lat: 52.2297, lon: 21.0122, label: 'Varsovie, PL' },
	AT: { lat: 48.2082, lon: 16.3738, label: 'Vienne, AT' },
	CZ: { lat: 50.0755, lon: 14.4378, label: 'Prague, CZ' },
	GR: { lat: 37.9838, lon: 23.7275, label: 'Athènes, GR' },
	RO: { lat: 44.4268, lon: 26.1025, label: 'Bucarest, RO' },
};

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

async function fetchWeather(lat: number, lon: number) {
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
	const r = await fetch(url);
	const j = await r.json();
	const cw = j?.current_weather;
	if (!cw) throw new Error('no current_weather');
	return {
		tempC: Math.round(cw.temperature as number),
		kind: codeToKind(cw.weathercode as number),
		text: codeToText(cw.weathercode as number),
	};
}

async function reverseGeocode(lat: number, lon: number, lang = 'fr') {
	const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=${lang}`;
	const r = await fetch(url);
	const j = await r.json();
	const first = j?.results?.[0];
	if (!first) return undefined;
	const cc = first.country_code ? `, ${first.country_code}` : '';
	return `${first.name || first.admin1 || 'Lieu'}${cc}`;
}

function fallbackCountryCode(): string | undefined {
	// essaye d'extraire la partie pays (fr-FR → FR)
	const loc =
		(typeof navigator !== 'undefined' && (navigator.language || '')) ||
		(Intl.DateTimeFormat().resolvedOptions().locale ?? '');
	const maybe = loc.split('-')[1]?.toUpperCase();
	return maybe && maybe.length === 2 ? maybe : undefined;
}

export default function Weather({ weather, setWeather }: WeatherProps) {
	const [label, setLabel] = useState<string | undefined>();
	const [loading, setLoading] = useState(false);
	const [available, setAvailable] = useState(true);

	const icon = useMemo(() => {
		switch (weather.kind) {
			case 'sun': return '☀️';
			case 'cloud': return '☁️';
			case 'rain': return '🌧️';
			case 'storm': return '⛈️';
			case 'snow': return '❄️';
			default: return '⛅';
		}
	}, [weather.kind]);

	const init = async () => {
		if (typeof window === 'undefined') return;
		setLoading(true);
		try {
			// 1) Essayer la géoloc
			const getPosition = () =>
				new Promise<GeolocationPosition>((resolve, reject) =>
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 8000,
						maximumAge: 60_000,
					})
				);

			let lat: number | undefined;
			let lon: number | undefined;
			let place: string | undefined;

			try {
				const pos = await getPosition();
				lat = pos.coords.latitude;
				lon = pos.coords.longitude;

				// reverse geocode avec fallback coords même si fetch() jette
				try {
					place = await reverseGeocode(lat, lon);
				} catch {
					place = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
				}
				if (!place) {
					place = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
				}
			} catch {
				// 2) Fallback capitale
				const cc = fallbackCountryCode();
				const capital = cc && CAPITALS[cc];
				if (capital) {
					lat = capital.lat;
					lon = capital.lon;
					place = capital.label;
				}
			}

			if (lat === undefined || lon === undefined) {
				setAvailable(false);
				setLoading(false);
				return;
			}

			const { tempC, kind, text } = await fetchWeather(lat, lon);
			setWeather({ ...weather, tempC, kind, description: text });
			setLabel(place); // place est forcément défini si géoloc OK, sinon capitales ; sinon on aurait quitté plus haut
			setAvailable(true);
		} catch {
			setAvailable(false);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		init();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!available) {
		return (
			<div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-base font-semibold tracking-tight text-white/90">Weather</h3>
					<button style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
							onClick={init} className="hover:cursor-pointer px-3 py-1 rounded-md text-sm">
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
				<h3 className="text-base font-semibold tracking-tight text-white/90">Weather</h3>

				<div className="flex items-center gap-2">
					{/* Pastille localisation */}
					<div onClick={() => copy(label ?? "")} className="hover:cursor-copy px-2 py-1 rounded-full border border-white/15 bg-white/10 text-white/80 text-xs flex items-center gap-1">
						<span aria-hidden>📍</span>
						<span className="truncate max-w-[240px]">{label ?? '—'}</span>
					</div>
					<button
						onClick={init}
						disabled={loading}
						style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
						className="hover:cursor-pointer px-3 py-1 rounded-md text-sm disabled:opacity-60"
					>
						{loading ? '…' : 'Actualiser'}
					</button>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="text-4xl" aria-hidden>{icon}</div>
				<div>
					<div className="text-xl font-semibold text-white">
						{Number.isFinite(weather.tempC) ? `${weather.tempC}°C` : '—'}
					</div>
					<div className="text-white/70 text-sm">
						{label ? `${label} • ${weather.description}` : weather.description || '—'}
					</div>
					<div className="text-[10px] text-white/40 mt-1">Source : Open-Meteo</div>
				</div>
			</div>
		</div>
	);
}
