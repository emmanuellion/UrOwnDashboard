import React, {useMemo} from "react";
import GlassCard from "@/components/GlassCard/GlassCard";
import SectionTitle from "@/components/SectionTitle/SectionTitle";

const QUOTES = [
	["Stay hungry, stay foolish.", "Steve Jobs"],
	["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
	["What you do every day matters more than what you do once in a while.", "Gretchen Rubin"],
	["The details are not the details. They make the design.", "Charles Eames"],
	["Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", "Antoine de Saint‑Exupéry"],
	["Make it work, make it right, make it fast.", "Kent Beck"],
];

function quoteOfTheDay() {
	const day = Math.floor((Date.now() / 86400000) % QUOTES.length);
	const [text, author] = QUOTES[day];
	return { text, author };
}

export default function Quote() {
	const q = useMemo(quoteOfTheDay, []);
	return (
		<GlassCard className="p-5">
			<SectionTitle title="Quote of the day" />
			<p className="text-white/90 italic">“{q.text}”</p>
			<p className="text-white/60 text-sm mt-2">— {q.author}</p>
		</GlassCard>
	);
};
