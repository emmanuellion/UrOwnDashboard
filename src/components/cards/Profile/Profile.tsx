import React, {useRef} from "react";
import GlassCard from "@/components/GlassCard/GlassCard";
import Image from "next/image";
import SectionTitle from "@/components/SectionTitle/SectionTitle";
import {Profile} from "@/types/profile";
import fileToDataURL from "@/utils/fileToDataUrl";

interface ProfileProps {
	profile: Profile;
	setProfile: (p: Profile) => void;
	accentColor: string;
	setAccentColor: (c: string) => void;
}

export default function ProfileCard({ profile, setProfile, accentColor, setAccentColor }: ProfileProps) {
	const avatarRef = useRef<HTMLInputElement>(null);
	const onAvatar = async (f: File) => {
		const data = await fileToDataURL(f);
		setProfile({ ...profile, avatar: data });
	};

	return (
		<GlassCard className="p-5">
			<SectionTitle title="Profile" />
			<div className="flex items-center gap-4">
				<button
					className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--accent)]"
					onClick={() => avatarRef.current?.click()}
				>
					{profile.avatar ? (
						<Image src={profile.avatar} alt="avatar" fill className="w-full h-full object-cover" />
					) : (
						<div className="hover:cursor-pointer w-full h-full grid place-items-center bg-white/10 text-white/70">Add</div>
					)}
				</button>
				<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
					<input
						className="bg-black/20 text-white/90 rounded-md px-3 py-2"
						placeholder="Name"
						value={profile.name}
						onChange={(e) => setProfile({ ...profile, name: e.target.value })}
					/>
					<input
						className="bg-black/20 text-white/90 rounded-md px-3 py-2"
						placeholder="Email (optional)"
						value={profile.email ?? ""}
						onChange={(e) => setProfile({ ...profile, email: e.target.value })}
					/>
					<input
						className="bg-black/20 text-white/90 rounded-md px-3 py-2 md:col-span-2"
						placeholder="Short bio"
						value={profile.bio}
						onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
					/>
				</div>
				<div className="pl-2">
					<label className="text-xs text-white/70">Accent</label>
					<input
						type="color"
						className="hover:cursor-pointer block w-10 h-10 rounded-md border border-white/20 bg-transparent"
						value={accentColor}
						onChange={(e) => setAccentColor(e.target.value)}
					/>
				</div>
			</div>
			<input
				ref={avatarRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => e.target.files && onAvatar(e.target.files[0])}
			/>
		</GlassCard>
	);
};
