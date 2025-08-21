import {useEffect, useRef} from "react";
import GlassCard from "@/components/GlassCard/GlassCard";
import SectionTitle from "@/components/SectionTitle/SectionTitle";
import {GalleryItem} from "@/types/gallery";
import fileToDataURL from "@/utils/fileToDataUrl";
import uid from "@/utils/uid";

interface GalleryProps {
	items: GalleryItem[];
	setItems: (g: GalleryItem[]) => void;
}

export default function Gallery({ items, setItems }: GalleryProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const zoneRef = useRef<HTMLDivElement>(null);

	const onFiles = async (files: FileList | null) => {
		if (!files || !files.length) return;
		const arr = await Promise.all(
			Array.from(files).map(async (f) => ({
				id: uid("img"),
				src: await fileToDataURL(f),
				date: new Date().toISOString(),
			}))
		);
		setItems([...arr, ...items]);
	};

	const remove = (id: string) => {
		setItems(items.filter((i) => i.id !== id));
	};

	useEffect(() => {
		const el = zoneRef.current;
		if (!el) return;
		const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
		const onDrop = (e: DragEvent) => {
			prevent(e);
			onFiles((e.dataTransfer as DataTransfer).files);
			el.classList.remove("ring-2", "ring-[var(--accent)]");
		};
		const onEnter = (e: DragEvent) => { prevent(e); el.classList.add("ring-2", "ring-[var(--accent)]"); };
		const onLeave = (e: DragEvent) => { prevent(e); el.classList.remove("ring-2", "ring-[var(--accent)]"); };

		el.addEventListener("dragover", prevent);
		el.addEventListener("dragenter", onEnter);
		el.addEventListener("dragleave", onLeave);
		el.addEventListener("drop", onDrop);
		return () => {
			el.removeEventListener("dragover", prevent);
			el.removeEventListener("dragenter", onEnter);
			el.removeEventListener("dragleave", onLeave);
			el.removeEventListener("drop", onDrop);
		};
	}, []);

	return (
		<GlassCard className="p-5">
			<SectionTitle
				title="Gallery"
				right={
					<button
						onClick={() => inputRef.current?.click()}
						className="hover:cursor-pointer px-3 py-1 rounded-md bg-[var(--accent)] text-white text-sm"
					>
						Upload
					</button>
				}
			/>
			<div
				ref={zoneRef}
				className="rounded-xl border border-white/20 bg-white/5 p-6 text-center text-white/70 cursor-pointer"
				onClick={() => inputRef.current?.click()}
			>
				Drag & drop photos here, or click to upload
			</div>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={(e) => onFiles(e.target.files)}
			/>

			{items.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
					{items.map((it) => (
						<div
							key={it.id}
							className="relative group rounded-xl overflow-hidden border border-white/10"
						>
							<img
								src={it.src}
								alt=""
								className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform"
							/>
							{/* Voile au survol */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

							{/* Bouton supprimer (visible au survol desktop, tjs visible sur mobile) */}
							<button
								aria-label="Supprimer l’image"
								onClick={() => remove(it.id)}
								className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow
                           opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:cursor-pointer"
							>
								{/* Icône poubelle (SVG inline) */}
								<svg
									width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden
								>
									<path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
									<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
										  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M9 6V4a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 4v2"
										  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M10 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
									<path d="M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
								</svg>
							</button>
						</div>
					))}
				</div>
			)}
		</GlassCard>
	);
}
