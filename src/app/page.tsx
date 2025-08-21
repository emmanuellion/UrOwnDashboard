'use client';

import Image from 'next/image';
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import GlassCard from '@/components/GlassCard/GlassCard';
import SectionTitle from '@/components/SectionTitle/SectionTitle';

import Clock from '@/components/cards/Clock/Clock';
import ProfileCard from '@/components/cards/Profile/Profile';
import Quote from '@/components/cards/Quote/Quote';
import Weather from '@/components/cards/Weather/Weather';
import BackgroundControls from '@/components/cards/BackgroundControls/BackgroundControls';
import SkillGauge from '@/components/cards/SkillGauge/SkillGauge';
import Notes from '@/components/cards/Notes/Notes';
import Gallery from '@/components/cards/Gallery/Gallery';

import { WeatherState } from '@/types/weather';
import { Profile } from '@/types/profile';
import { GalleryItem } from '@/types/gallery';
import { Note } from '@/types/note';
import { Skill } from '@/types/skill';
import uid from '@/utils/uid';
import QuickLaunchDock from "@/components/cards/QuickLaunchDock/QuickLaunchDock";
import WeatherNextHours from "@/components/cards/WeatherNextHours/WeatherNextHours";
import BackupCard from "@/components/cards/Backup/Backup";
import WorldClock from "@/components/cards/WorldClock/WorldClock";
import FocusTimer from "@/components/cards/FocusTimer/FocusTimer";
import SystemStatus from "@/components/cards/SystemStatus/SytemStatus";
import ExifViewer from "@/components/cards/EXIFViewer/EXIFViewer";
import AppsMenu, { AppDef } from '@/components/header/AppsMenu';
import SunArc from "@/components/cards/SunArc/SunArc";
import {onAccentColor} from "@/utils/color";

interface AppState {
  accentColor: string;
  background?: string;
  profile: Profile;
  weather: WeatherState;
  skills: Skill[];
  notes: Note[];
  gallery: GalleryItem[];
}

const STORAGE_KEY = 'life-dashboard-state-v1';
const VIS_KEY = 'life-dashboard-visible-v1';

const APP_REGISTRY: AppDef[] = [
  { id: 'clock', label: 'Clock', group: 'Core' },
  { id: 'profile', label: 'Profile', group: 'Core' },
  { id: 'quote', label: 'Quote', group: 'Core' },
  { id: 'weather', label: 'Weather', group: 'Weather' },
  { id: 'weatherHours', label: 'Weather — Next Hours', group: 'Weather' },
  { id: 'background', label: 'Background Controls', group: 'System' },
  { id: 'quick', label: 'Quick Launch', group: 'Tools' },
  { id: 'skills', label: 'Skills', group: 'Personal' },
  { id: 'notes', label: 'Quick Notes', group: 'Personal' },
  { id: 'gallery', label: 'Gallery', group: 'Media' },
  { id: 'backup', label: 'Backup', group: 'System' },

  // extras
  { id: 'sunarc', label: 'Sun Arc', group: 'Weather' },
  { id: 'focus', label: 'Focus Timer', group: 'Tools' },
  { id: 'worldclock', label: 'World Clock', group: 'Time' },
  { id: 'exif', label: 'EXIF Viewer', group: 'Media' },
  { id: 'system', label: 'System Status', group: 'System' }
];

const DEFAULT_VISIBLE: Record<string, boolean> = {
  clock: true,
  profile: true,
  quote: true,
  weather: true,
  weatherHours: true,
  background: true,
  quick: true,
  skills: true,
  notes: true,
  gallery: true,
  backup: true,
  // extras (par défaut off pour ne pas saturer)
  sunarc: false,
  focus: false,
  worldclock: false,
  exif: false,
  system: false,
};

function loadVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(VIS_KEY);
    if (raw) return { ...DEFAULT_VISIBLE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_VISIBLE };
}

function saveVisibility(v: Record<string, boolean>) {
  try {
    localStorage.setItem(VIS_KEY, JSON.stringify(v));
  } catch {}
}

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

const defaultState: AppState = {
  accentColor: '#7c3aed',
  profile: {
    name: 'Your Name',
    bio: 'Write something short about you',
    email: '',
    avatar: undefined,
  },
  weather: { kind: 'sun', tempC: 23, description: 'Clear skies' },
  skills: [
    { id: uid('sk'), name: 'Creativity', level: 72 },
    { id: uid('sk'), name: 'Organization', level: 65 },
    { id: uid('sk'), name: 'Energy', level: 58 },
    { id: uid('sk'), name: 'Well-being', level: 80 },
  ],
  notes: [],
  gallery: [],
  background: undefined,
};

export default function LifeDashboard() {
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultState);
  const [visible, setVisible] = useState<Record<string, boolean>>(() => (typeof window === 'undefined' ? DEFAULT_VISIBLE : loadVisibility()));

  // persistance
  useEffect(() => {
    saveState(state);
  }, [state]);

  // couleur d'accent globale
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', state.accentColor);
    root.style.setProperty('--on-accent', onAccentColor(state.accentColor));
  }, [state.accentColor]);

  // setters
  const setProfile = (p: Profile) => setState({ ...state, profile: p });
  const setWeather = (w: WeatherState) => setState({ ...state, weather: w });
  const setNotes = (n: Note[]) => setState({ ...state, notes: n });
  const setGallery = (g: GalleryItem[]) => setState({ ...state, gallery: g });
  const setBackground = (dataUrl?: string) => setState({ ...state, background: dataUrl });

  // gérer Next/Image côté client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- Skills: focus sur le nom quand on ajoute
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  // --- Skills: transition de hauteur de la card
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(undefined);

  // mesure + anime la hauteur quand le contenu change
  useLayoutEffect(() => {
    if (!gridRef.current || !wrapperRef.current) return;

    const measure = () => {
      const h = gridRef.current!.offsetHeight;
      // si première mesure → set direct sans transition perceptible
      setWrapperHeight((prev) => (prev === undefined ? h : prev));
      // applique la nouvelle hauteur (transition CSS jouera)
      wrapperRef.current!.style.height = h + 'px';
    };

    // hauteur initiale
    measure();

    // observe les changements de taille du grid (ajout/suppression)
    const ro = new ResizeObserver(measure);
    ro.observe(gridRef.current);

    return () => ro.disconnect();
    // on déclenche quand le nombre de skills change
  }, [state.skills.length]);

  const resetVisibility = () => setVisible({ ...DEFAULT_VISIBLE });

  return (
      <div
          className="relative min-h-screen text-white"
          style={{
            backgroundImage: state.background
                ? `url(${state.background})`
                : `radial-gradient(1000px_600px_at_10%_10%, #111827, transparent), radial-gradient(800px_400px_at_90%_20%, var(--accent), transparent), linear-gradient(180deg, #0b0f1a 0%, #0a0610 100%)`,
            backgroundSize: state.background ? 'cover' : 'auto, auto, auto',
            backgroundPosition: state.background ? 'center' : 'center',
          }}
      >
        {/* Overlay d'assombrissement quand il y a un fond personnalisé */}
        {state.background && (
            <div className="pointer-events-none absolute inset-0 bg-black/70" aria-hidden />
        )}

        <div className="backdrop-blur-sm relative">
          {/* Top bar */}
          <header className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 grid place-items-center">
              <span className="text-lg" aria-hidden>
                🌙
              </span>
              </div>
              <div className="font-semibold tracking-tight">Life Dashboard</div>
            </div>
            <div className="flex items-center gap-3">
              <AppsMenu registry={APP_REGISTRY} visible={visible} onChange={setVisible} onReset={resetVisibility} />
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
                <div className="text-sm text-white/80">
                  {state.profile.name || 'Anonymous'}
                </div>
              </div>
            </div>
          </header>

          {/* Content grid */}
          <main className="px-6 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col gap-6">
                  {visible.clock && <Clock />}
                  {visible.worldclock && <WorldClock />}
                  {visible.profile && (
                      <ProfileCard
                          profile={state.profile}
                          setProfile={setProfile}
                          accentColor={state.accentColor}
                          setAccentColor={(c) => setState({ ...state, accentColor: c })}
                      />
                  )}
                  {visible.sunarc && <SunArc />}
                  {visible.focus && <FocusTimer />}
                </div>
                <div className="flex flex-col gap-6">
                  {visible.weather && <Weather weather={state.weather} setWeather={setWeather} />}
                  {visible.weatherHours && <WeatherNextHours />}
                  {visible.system && <SystemStatus />}
                  {visible.background && <BackgroundControls setBackground={setBackground} />}
                  {visible.quick && <QuickLaunchDock />}
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {visible.skills && (<GlassCard className="p-5">
                  <SectionTitle
                      title="Skills"
                      right={
                        <button
                            onClick={() => {
                              const id = `sk-${Date.now()}`;
                              setState({
                                ...state,
                                skills: [...state.skills, { id, name: '', level: 50 }],
                              });
                              // focus sur le nom de la gauge ajoutée
                              setEditingSkillId(id);
                            }}
                            style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
                            className="hover:cursor-pointer px-3 py-1 rounded-md text-sm"
                        >
                          + Add
                        </button>
                      }
                  />

                  {/* Wrapper animé en hauteur */}
                  <div
                      ref={wrapperRef}
                      className="relative overflow-hidden transition-[height] duration-300 ease-out"
                      style={{ height: wrapperHeight ?? 'auto' }}
                  >
                    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {state.skills.map((sk, i) => {
                        const isLastAlone =
                            i === state.skills.length - 1 && state.skills.length % 2 === 1;
                        return (
                            <div
                                key={sk.id}
                                className={isLastAlone ? 'md:col-span-2 md:justify-self-center' : ''}
                            >
                              <SkillGauge
                                  skill={sk}
                                  autoFocusName={editingSkillId === sk.id}
                                  onChange={(s) => {
                                    const copy = [...state.skills];
                                    copy[i] = s;
                                    setState({ ...state, skills: copy });
                                  }}
                                  onRemove={(id) => {
                                    setState({
                                      ...state,
                                      skills: state.skills.filter((x) => x.id !== id),
                                    });
                                    if (editingSkillId === id) setEditingSkillId(null);
                                  }}
                              />
                            </div>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>)}
                {visible.notes && <Notes notes={state.notes} setNotes={setNotes} />}
                {visible.quote && <Quote />}
              </div>
            </div>

            <div className="mt-6 md:col-span-2 flex flex-col gap-6">
              {visible.gallery && <Gallery items={state.gallery} setItems={setGallery} />}
              {visible.exif && <ExifViewer gallery={state.gallery} />}
              {visible.backup && <BackupCard state={state} setState={setState} />}
            </div>
          </main>
        </div>

        {/* halo d'accent flottant */}
        <div className="pointer-events-none fixed inset-0" aria-hidden>
          <div
              className="absolute -z-10 blur-3xl opacity-30"
              style={{
                left: '10%',
                top: '-10%',
                width: 600,
                height: 600,
                background:
                    'radial-gradient(50%_50%_at_50%_50%, var(--accent), transparent)',
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
