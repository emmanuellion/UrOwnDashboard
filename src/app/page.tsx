'use client';

import Image from 'next/image';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

import QuickLaunchDock from '@/components/cards/QuickLaunchDock/QuickLaunchDock';
import WeatherNextHours from '@/components/cards/WeatherNextHours/WeatherNextHours';
import BackupCard from '@/components/cards/Backup/Backup';
import WorldClock from '@/components/cards/WorldClock/WorldClock';
import FocusTimer from '@/components/cards/FocusTimer/FocusTimer';
import SystemStatus from '@/components/cards/SystemStatus/SytemStatus';
import ExifViewer from '@/components/cards/EXIFViewer/EXIFViewer';
import AppsMenu, { AppDef } from '@/components/header/AppsMenu';
import SunArc from '@/components/cards/SunArc/SunArc';

import { onAccentColor } from '@/utils/color';

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

/* -------- Registry / visibilité -------- */
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
  { id: 'system', label: 'System Status', group: 'System' },
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
  // extras
  sunarc: false,
  focus: false,
  worldclock: false,
  exif: false,
  system: false,
};

function normalizeVisibility(stored?: Record<string, boolean>) {
  const allowed = new Set(APP_REGISTRY.map((a) => a.id));
  const pruned = Object.fromEntries(
      Object.entries(stored ?? {}).filter(([k]) => allowed.has(k))
  );
  return { ...DEFAULT_VISIBLE, ...pruned };
}

/* -------- État par défaut (IDs FIXES) -------- */
const DEFAULT_SKILLS: Skill[] = [
  { id: 'sk-default-1', name: 'Creativity', level: 72 },
  { id: 'sk-default-2', name: 'Organization', level: 65 },
];

const defaultState: AppState = {
  accentColor: '#7c3aed',
  profile: {
    name: 'Your Name',
    bio: 'Write something short about you',
    email: '',
    avatar: undefined,
  },
  weather: { kind: 'sun', tempC: 23, description: 'Clear skies' },
  skills: DEFAULT_SKILLS,
  notes: [],
  gallery: [],
  background: undefined,
};

export default function LifeDashboard() {
  /* ------- IMPORTANT : ne pas lire LS dans l'initialiseur ------- */
  const [state, setState] = useState<AppState>(defaultState);
  const [stateLoaded, setStateLoaded] = useState(false);

  const [visible, setVisible] = useState<Record<string, boolean>>(DEFAULT_VISIBLE);
  const [visLoaded, setVisLoaded] = useState(false);

  // Charger APRES montage (évite mismatch SSR)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setStateLoaded(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIS_KEY);
      const parsed = raw ? JSON.parse(raw) : undefined;
      setVisible(normalizeVisibility(parsed));
    } catch {
      setVisible({ ...DEFAULT_VISIBLE });
    } finally {
      setVisLoaded(true);
    }
  }, []);

  // Persister uniquement une fois chargé
  useEffect(() => {
    if (!stateLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [stateLoaded, state]);

  useEffect(() => {
    if (!visLoaded) return;
    try {
      localStorage.setItem(VIS_KEY, JSON.stringify(visible));
    } catch {}
  }, [visLoaded, visible]);

  // Couleur d'accent globale
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', state.accentColor);
    root.style.setProperty('--on-accent', onAccentColor(state.accentColor));
  }, [state.accentColor]);

  // Setters utiles
  const setProfile = (p: Profile) => setState({ ...state, profile: p });
  const setWeather = (w: WeatherState) => setState({ ...state, weather: w });
  const setNotes = (n: Note[]) => setState({ ...state, notes: n });
  const setGallery = (g: GalleryItem[]) => setState({ ...state, gallery: g });
  const setBackground = (dataUrl?: string) => setState({ ...state, background: dataUrl });

  // SSR-safe pour l'avatar Next/Image
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Skills : hauteur animée
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!gridRef.current || !wrapperRef.current) return;

    const measure = () => {
      const h = gridRef.current!.offsetHeight;
      setWrapperHeight((prev) => (prev === undefined ? h : prev));
      wrapperRef.current!.style.height = h + 'px';
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [state.skills.length]);

  const resetVisibility = () => setVisible({ ...DEFAULT_VISIBLE });
  const makeId = () =>
      (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()));

  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

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
        {state.background && (
            <div className="pointer-events-none absolute inset-0 bg-black/70" aria-hidden />
        )}

        <div className="backdrop-blur-sm relative">
          {/* Header */}
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
              <AppsMenu
                  registry={APP_REGISTRY}
                  visible={visible}
                  onChange={setVisible}
                  onReset={resetVisibility}
              />
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

          {/* Content */}
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
                          setAccentColor={(c) =>
                              setState({ ...state, accentColor: c })
                          }
                      />
                  )}
                  {visible.sunarc && <SunArc />}
                  {visible.focus && <FocusTimer />}
                </div>
                <div className="flex flex-col gap-6">
                  {visible.weather && (
                      <Weather weather={state.weather} setWeather={setWeather} />
                  )}
                  {visible.weatherHours && <WeatherNextHours />}
                  {visible.system && <SystemStatus />}
                  {visible.background && (
                      <BackgroundControls setBackground={setBackground} />
                  )}
                  {visible.quick && <QuickLaunchDock />}
                </div>
              </div>

              {/* Colonne droite */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {visible.skills && (
                    <GlassCard className="p-5">
                      <SectionTitle
                          title="Skills"
                          right={
                            <button
                                onClick={() => {
                                  const s: Skill = {
                                    id: makeId(),
                                    name: 'New skill',
                                    level: 50,
                                  };
                                  setState((st) => ({
                                    ...st,
                                    skills: [...st.skills, s],
                                  }));
                                  setEditingSkillId(s.id);
                                }}
                                style={{
                                  background: 'var(--accent)',
                                  color: 'var(--on-accent)',
                                  borderColor:
                                      'color-mix(in oklab, var(--on-accent) 25%, transparent)',
                                }}
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
                          suppressHydrationWarning
                      >
                        <div
                            ref={gridRef}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                        >
                          {state.skills.map((sk, i) => {
                            const isLastAlone =
                                i === state.skills.length - 1 &&
                                state.skills.length % 2 === 1;
                            return (
                                <div
                                    key={sk.id || `${i}-${sk.name}`}
                                    className={
                                      isLastAlone
                                          ? 'md:col-span-2 md:justify-self-center'
                                          : ''
                                    }
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
                                          skills: state.skills.filter(
                                              (x) => x.id !== id
                                          ),
                                        });
                                        if (editingSkillId === id)
                                          setEditingSkillId(null);
                                      }}
                                  />
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    </GlassCard>
                )}
                {visible.notes && (
                    <Notes notes={state.notes} setNotes={setNotes} />
                )}
                {visible.quote && <Quote />}
              </div>
            </div>

            <div className="mt-6 md:col-span-2 flex flex-col gap-6">
              {visible.gallery && (
                  <Gallery items={state.gallery} setItems={setGallery} />
              )}
              {visible.exif && <ExifViewer gallery={state.gallery} />}
              {visible.backup && <BackupCard state={state} setState={setState} />}
            </div>
          </main>
        </div>

        {/* halo d’accent */}
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
