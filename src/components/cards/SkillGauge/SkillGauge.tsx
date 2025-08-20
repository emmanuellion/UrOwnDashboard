import React, {useEffect, useRef} from "react";
import fileToDataURL from "@/utils/fileToDataUrl";
import {Skill} from "@/types/skill";

interface SkillGaugeProps {
	skill: Skill;
	onChange: (s: Skill) => void;
	onRemove?: (id: string) => void;
	autoFocusName?: boolean;             // <- nouveau
}

async function extractAverageColor(dataUrl: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) return resolve("#888888");
				const w = (canvas.width = 64);
				const h = (canvas.height = 64);
				ctx.drawImage(img, 0, 0, w, h);
				const { data } = ctx.getImageData(0, 0, w, h);
				let r = 0, g = 0, b = 0, count = 0;
				for (let i = 0; i < data.length; i += 4) {
					const a = data[i + 3];
					if (a < 128) continue;
					r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
				}
				if (!count) return resolve("#888888");
				r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
				const hex = `#${[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("")}`;
				resolve(hex);
			} catch { resolve("#888888"); }
		};
		img.onerror = reject;
		img.src = dataUrl;
	});
}

export default function SkillGauge({ skill, onChange, onRemove, autoFocusName }: SkillGaugeProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const accentRef = useRef<HTMLInputElement>(null);
	const nameRef = useRef<HTMLInputElement>(null);

	useEffect(() => { if (autoFocusName) nameRef.current?.focus(); }, [autoFocusName]);

	const size = 120, stroke = 10;
	const r = (size - stroke) / 2;
	const circ = 2 * Math.PI * r;
	const dash = (skill.level / 100) * circ;
	const gradientId = `grad_${skill.id}`;

	const onIcon = async (file: File) => {
		const data = await fileToDataURL(file);
		onChange({ ...skill, icon: data });
	};

	const onAccentImage = async (file: File) => {
		const data = await fileToDataURL(file);
		const color = await extractAverageColor(data);
		onChange({ ...skill, accentImage: data, accentColor: color });
	};

	return (
		<div className="group relative flex flex-col items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
			{/* Bouton supprimer (croix) */}
			{onRemove && (
				<button
					aria-label="Supprimer la gauge"
					onClick={() => onRemove(skill.id)}
					className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow
                     opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:cursor-pointer"
				>
					{/* Cross icon */}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
						<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
					</svg>
				</button>
			)}

			<div className="relative" style={{ width: size, height: size }}>
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor={skill.accentColor || "var(--accent)"} />
							<stop offset="100%" stopColor={"#ffffff80"} />
						</linearGradient>
					</defs>
					<circle cx={size / 2} cy={size / 2} r={r} stroke="#ffffff22" strokeWidth={stroke} fill="none" />
					<circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						stroke={`url(#${gradientId})`}
						strokeLinecap="round"
						strokeWidth={stroke}
						fill="none"
						strokeDasharray={`${dash} ${circ - dash}`}
						transform={`rotate(-90 ${size / 2} ${size / 2})`}
					/>
				</svg>
				<button
					className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/40"
					onClick={() => fileRef.current?.click()}
				>
					{skill.icon ? (
						<img src={skill.icon} alt="skill" className="w-full h-full object-cover" />
					) : (
						<div className="w-full h-full grid place-items-center text-xs text-white/70 bg-white/10">icon</div>
					)}
				</button>
			</div>

			{/* Nom éditable */}
			<input
				ref={nameRef}
				value={skill.name}
				onChange={(e) => onChange({ ...skill, name: e.target.value })}
				placeholder="Skill name"
				className="w-full text-center bg-transparent outline-none text-white/90 text-sm font-medium
                   border-b border-transparent focus:border-white/25 pb-0.5"
			/>

			<input
				type="range"
				min={0}
				max={100}
				value={skill.level}
				onChange={(e) => onChange({ ...skill, level: Number(e.target.value) })}
				className="w-full accent-[var(--accent)]"
			/>

			<div className="flex gap-2 text-xs">
				<button
					onClick={() => accentRef.current?.click()}
					className="px-2 py-1 rounded-md bg-black/30 border border-white/10 text-white/80 hover:bg-black/40"
				>
					Accent from image
				</button>
				{skill.accentColor && (
					<span className="inline-flex items-center gap-1 text-white/70">
            <span className="w-3 h-3 rounded-full border border-white/30" style={{ background: skill.accentColor }} />
						{skill.accentColor}
          </span>
				)}
			</div>

			<input ref={fileRef} type="file" accept="image/*" className="hidden"
				   onChange={(e) => e.target.files && onIcon(e.target.files[0])}/>
			<input ref={accentRef} type="file" accept="image/*" className="hidden"
				   onChange={async (e) => e.target.files && onAccentImage(e.target.files[0])}/>
		</div>
	);
}
