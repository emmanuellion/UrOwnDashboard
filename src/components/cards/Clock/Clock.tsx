import {useEffect, useState} from "react";
import GlassCard from "@/components/GlassCard/GlassCard";

export default function Clock() {
	const [now, setNow] = useState(new Date());
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);

	const hh = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
	const dd = now.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long" });

	return (
		<GlassCard className="p-5">
			<div className="flex items-end gap-3">
				<div className="text-5xl font-semibold leading-none text-white" style={{textShadow: "0 10px 30px rgba(0,0,0,0.35)"}}>{hh}</div>
			</div>
			<div className="mt-2 text-white/70 text-sm capitalize">{dd}</div>
		</GlassCard>
	);
};
