import {ReactNode} from "react";

interface GlassCardProps {
	className?: string;
	children?: ReactNode;
}

export default function GlassCard ({className = "", children, ...props}: GlassCardProps) {
	return (
		<div
			className={
				"rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] " +
				className
			}
			{...props}
		>
			{children}
		</div>
	);
}
