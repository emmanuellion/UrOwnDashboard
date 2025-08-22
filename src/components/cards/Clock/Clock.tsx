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
		<div className="p-5">
			<div suppressHydrationWarning className="text-5xl font-semibold leading-none">
				{time}
			</div>
			<div suppressHydrationWarning className="mt-2 text-white/70 text-sm capitalize">
				{date}
			</div>
		</div>
	);
}
