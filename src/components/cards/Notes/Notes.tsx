import React, {useState} from "react";
import uid from "@/utils/uid";
import GlassCard from "@/components/GlassCard/GlassCard";
import {Note} from "@/types/note";
import SectionTitle from "@/components/SectionTitle/SectionTitle";

interface NotesProps {
	notes: Note[];
	setNotes: (n: Note[]) => void;
}

export default function Notes({ notes, setNotes }: NotesProps) {
	const [text, setText] = useState("");
	const add = () => {
		if (!text.trim()) return;
		setNotes([{ id: uid("note"), text: text.trim(), date: new Date().toISOString() }, ...notes]);
		setText("");
	};
	const remove = (id: string) => setNotes(notes.filter((n) => n.id !== id));

	return (
		<GlassCard className="p-5">
			<SectionTitle title="Quick Notes" />
			<div className="flex gap-2">
				<input
					className="flex-1 bg-black/20 text-white/90 rounded-md px-3 py-2"
					placeholder="Type a quick idea…"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && add()}
				/>
				<button
					onClick={add}
					className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white shadow hover:opacity-90"
				>
					Add
				</button>
			</div>
			<div className="grid md:grid-cols-2 gap-2 mt-3">
				{notes.map((n) => (
					<div key={n.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/90 relative">
						<button
							onClick={() => remove(n.id)}
							className="absolute right-2 top-2 text-white/50 hover:text-white"
							aria-label="delete note"
						>×</button>
						<div className="text-sm whitespace-pre-wrap">{n.text}</div>
						<div className="text-[10px] text-white/50 mt-2">{new Date(n.date).toLocaleString()}</div>
					</div>
				))}
			</div>
		</GlassCard>
	);
};
