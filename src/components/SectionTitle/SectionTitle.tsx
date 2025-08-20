import React, {ReactNode} from "react";

interface SectionTitleProps {
	title: string;
	right?: ReactNode;
}

export default function SectionTitle({ title, right }: SectionTitleProps) {
	return (
		<div className="flex items-center justify-between mb-3">
			<h3 className="text-base font-semibold tracking-tight text-white/90">{title}</h3>
			{right}
		</div>
	);
}
