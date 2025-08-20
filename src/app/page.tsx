'use client';

import Image from 'next/image';
import React, { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard/GlassCard";
import {WeatherState} from "@/types/weather";
import {Profile} from "@/types/profile";
import {GalleryItem} from "@/types/gallery";
import uid from "@/utils/uid";
import {Note} from "@/types/note";
import {Skill} from "@/types/skill";
import Clock from "@/components/cards/Clock/Clock";
import ProfileCard from "@/components/cards/Profile/Profile";
import Quote from "@/components/cards/Quote/Quote";
import Weather from "@/components/cards/Weather/Weather";
import BackgroundControls from "@/components/cards/BackgroundControls/BackgroundControls";
import SectionTitle from "@/components/SectionTitle/SectionTitle";
import SkillGauge from "@/components/cards/SkillGauge/SkillGauge";
import Notes from "@/components/cards/Notes/Notes";
import Gallery from "@/components/cards/Gallery/Gallery";

interface AppState {
  accentColor: string;
  background?: string;
  profile: Profile;
  weather: WeatherState;
  skills: Skill[];
  notes: Note[];
  gallery: GalleryItem[];
}

const STORAGE_KEY = "life-dashboard-state-v1";

function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// -------------------- Main App

const defaultState: AppState = {
  accentColor: "#7c3aed",
  profile: {
    name: "Your Name",
    bio: "Write something short about you",
    email: "",
    avatar: undefined,
  },
  weather: { kind: "sun", tempC: 23, description: "Clear skies" },
  skills: [
    { id: uid("sk"), name: "Creativity", level: 72 },
    { id: uid("sk"), name: "Organization", level: 65 },
    { id: uid("sk"), name: "Energy", level: 58 },
    { id: uid("sk"), name: "Well-being", level: 80 },
  ],
  notes: [],
  gallery: [],
  background: undefined,
};

export default function LifeDashboard() {
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultState);

  // Persist
  useEffect(() => { saveState(state); }, [state]);

  // Set CSS var for accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", state.accentColor);
  }, [state.accentColor]);

  const setProfile = (p: Profile) => setState({ ...state, profile: p });
  const setWeather = (w: WeatherState) => setState({ ...state, weather: w });
  const setNotes = (n: Note[]) => setState({ ...state, notes: n });
  const setGallery = (g: GalleryItem[]) => setState({ ...state, gallery: g });
  const setBackground = (dataUrl?: string) => setState({ ...state, background: dataUrl });

  const setSkill = (idx: number, s: Skill) => {
    const copy = [...state.skills];
    copy[idx] = s;
    setState({ ...state, skills: copy });
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
      <div
          className="relative min-h-screen text-white"
          style={{
            backgroundImage: state.background
                ? `url(${state.background})`
                : `radial-gradient(1000px_600px_at_10%_10%, #111827, transparent), radial-gradient(800px_400px_at_90%_20%, var(--accent), transparent), linear-gradient(180deg, #0b0f1a 0%, #0a0610 100%)`,
            backgroundSize: state.background ? "cover" : "auto, auto, auto",
            backgroundPosition: state.background ? "center" : "center",
          }}
      >
        {/* Overlay d'assombrissement quand il y a un fond personnalisé */}
        {state.background && (
            <div
                className="pointer-events-none absolute inset-0 bg-black/70"
                aria-hidden
            />
        )}

        <div className="backdrop-blur-sm relative">
          {/* Top bar */}
          <header className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 grid place-items-center">
                <span className="text-lg" aria-hidden>🌙</span>
              </div>
              <div className="font-semibold tracking-tight">Life Dashboard</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-xl border border-white/10 bg-white/10">
                {mounted && state.profile.avatar ? (
                    <Image
                        alt="profil pp"
                        src={state.profile.avatar}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20" />
                )}
                <div className="text-sm text-white/80">{state.profile.name || "Anonymous"}</div>
              </div>
            </div>
          </header>

          {/* Content grid */}
          <main className="px-6 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col gap-6">
                  <Clock />
                  <ProfileCard
                      profile={state.profile}
                      setProfile={setProfile}
                      accentColor={state.accentColor}
                      setAccentColor={(c) => setState({ ...state, accentColor: c })}
                  />
                  <Quote />
                </div>
                <div className="flex flex-col gap-6">
                  <Weather weather={state.weather} setWeather={setWeather} />
                  <BackgroundControls background={state.background} setBackground={setBackground} />
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <GlassCard className="p-5">
                  <SectionTitle title="Skills" />
                  <div className="grid grid-cols-2 gap-3">
                    {state.skills.map((sk, i) => (
                        <SkillGauge key={sk.id} skill={sk} onChange={(s) => setSkill(i, s)} />
                    ))}
                  </div>
                </GlassCard>

                <Notes notes={state.notes} setNotes={setNotes} />
              </div>
            </div>

            <div className="mt-6">
              <Gallery items={state.gallery} setItems={setGallery} />
            </div>
          </main>
        </div>

        {/* floating accent halo */}
        <div className="pointer-events-none fixed inset-0" aria-hidden>
          <div
              className="absolute -z-10 blur-3xl opacity-30"
              style={{
                left: "10%",
                top: "-10%",
                width: 600,
                height: 600,
                background:
                    "radial-gradient(50%_50%_at_50%_50%, var(--accent), transparent)",
              }}
          />
        </div>

        <style>{`
        :root { --accent: ${state.accentColor}; }
        ::-webkit-scrollbar { height: 10px; width: 10px; }
        ::-webkit-scrollbar-thumb { background: #ffffff22; border-radius: 9999px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      </div>
  );
}
