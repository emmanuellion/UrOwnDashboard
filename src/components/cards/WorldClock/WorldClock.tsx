'use client';

import React, {useEffect, useState} from 'react';

type City={ id:string; tz:string; label:string };
const defaults: City[] = [
    {id:'par', tz:'Europe/Paris', label:'Paris'},
    {id:'nyc', tz:'America/New_York', label:'New York'},
    {id:'tyo', tz:'Asia/Tokyo', label:'Tokyo'},
    {id:'syd', tz:'Australia/Sydney', label:'Sydney'},
];

const fmt = (d:Date, tz:string)=> new Intl.DateTimeFormat([], {hour:'2-digit',minute:'2-digit', timeZone: tz}).format(d);
const isDST = (tz:string)=> {
    const jan = new Date(new Date().getFullYear(),0,1);
    const jul = new Date(new Date().getFullYear(),6,1);
    const zJan = new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'short'}).formatToParts(jan).find(p=>p.type==='timeZoneName')?.value||'';
    const zJul = new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'short'}).formatToParts(jul).find(p=>p.type==='timeZoneName')?.value||'';
    return zJan!==zJul;
};

export default function WorldClock(){
    const [list,setList]=useState<City[]>(()=> {
        try { const raw=localStorage.getItem('worldclock-v1'); return raw?JSON.parse(raw):defaults; } catch { return defaults; }
    });
    const [now,setNow]=useState(new Date());
    useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),30_000); return ()=>clearInterval(t);},[]);
    useEffect(()=>{ localStorage.setItem('worldclock-v1', JSON.stringify(list)); },[list]);

    const [adding,setAdding]=useState(false);
    const [tz,setTz]=useState('');

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">World Clock</h3>
                {!adding ? (
                    <button
                        style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
                        onClick={()=>setAdding(true)}
                        className="hover:cursor-pointer px-3 py-1 rounded-md text-sm">+ Add</button>
                ) : (
                    <div className="flex gap-2">
                        <input value={tz} onChange={e=>setTz(e.target.value)} placeholder="e.g. Europe/Oslo"
                               className="bg-black/20 text-white/90 rounded-md px-3 py-1 w-48"/>
                        <button style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
                                onClick={()=>{ if(!tz) return; setList([{id:'c-'+Date.now(), tz, label: tz.split('/').pop()?.replace('_',' ')||tz}, ...list].slice(0,4)); setAdding(false); setTz('');}}
                                className="hover:cursor-pointer px-3 py-1 rounded-md text-sm">Add</button>
                        <button onClick={()=>{setAdding(false); setTz('');}}
                                className="hover:cursor-pointer px-3 py-1 rounded-md bg-white/10 text-white text-sm">Cancel</button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {list.map(c=>(
                    <div key={c.id} className="relative rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs text-white/60">{c.label}</div>
                        <div className="text-2xl font-semibold tabular-nums">{fmt(now,c.tz)}</div>
                        <div className="mt-1 text-[10px] text-white/50">{c.tz}</div>
                        <div className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border ${isDST(c.tz)?'border-emerald-400 text-emerald-300':'border-white/20 text-white/50'}`}>
                            {isDST(c.tz)?'DST':'STD'}
                        </div>
                        <button onClick={()=>setList(list.filter(x=>x.id!==c.id))}
                                className="absolute -top-2 -right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 hover:opacity-100 transition-opacity"
                                aria-label="Remove"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button>
                    </div>
                ))}
            </div>
        </div>
    );
}
