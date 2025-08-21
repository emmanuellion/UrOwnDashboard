import React, {useRef} from "react";
import GlassCard from "@/components/GlassCard/GlassCard";
import fileToDataURL from "@/utils/fileToDataUrl";
import SectionTitle from "@/components/SectionTitle/SectionTitle";

interface BackgroundControlProps {
	setBackground: (dataUrl?: string) => void;
}

export default function BackgroundControls({ setBackground }: BackgroundControlProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const onFile = async (f: File) => {
		const data = await fileToDataURL(f);
		setBackground(data);
	};

	return (
		<GlassCard className="p-4">
			<SectionTitle title="Background" right={
				<div className="flex gap-2">
					<button onClick={() => setBackground(undefined)} className="hover:cursor-pointer px-3 py-1 rounded-md bg-black/30 border border-white/10 text-white/80">Reset</button>
					<button style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
							onClick={() => inputRef.current?.click()} className="hover:cursor-pointer px-3 py-1 rounded-md">Change</button>
				</div>
			} />
			<div className="text-white/70 text-sm">Pick a custom background image. Glassmorphism stays consistent.</div>
			<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onFile(e.target.files[0])} />
		</GlassCard>
	);
};
