'use client';
import React, { useEffect, useMemo, useState } from 'react';

export default function Clock() {
	// null au départ => SSR et 1er rendu client identiques
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date()); // hydrate après montage
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);

	const time = useMemo(() => {
		if (!now) return '—:—:—';
		return new Intl.DateTimeFormat(undefined, {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23', // évite 12h/24h aléatoire
		}).format(now);
	}, [now]);

	const date = useMemo(() => {
		if (!now) return '';
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
		}).format(now);
	}, [now]);

	return (
		<div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
			<div suppressHydrationWarning className="text-5xl font-semibold leading-none">
				{time}
			</div>
			<div suppressHydrationWarning className="mt-2 text-white/70 text-sm capitalize">
				{date}
			</div>
		</div>
	);
}
