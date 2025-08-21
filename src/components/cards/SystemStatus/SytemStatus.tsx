'use client';

import React, {useEffect, useState} from 'react';

type Batt = { level:number; charging:boolean } | null;
type Net = { type?:string; downlink?:number } | null;

export default function SystemStatus(){
    const [batt,setBatt]=useState<Batt>(null);
    const [net,setNet]=useState<Net>(null);
    const [online,setOnline]=useState(true);

    useEffect(()=>{
        setOnline(navigator.onLine);
        const onO=()=>setOnline(true), onF=()=>setOnline(false);
        window.addEventListener('online',onO); window.addEventListener('offline',onF);
        return ()=>{ window.removeEventListener('online',onO); window.removeEventListener('offline',onF); };
    },[]);

    useEffect(()=>{
        (navigator as any).getBattery?.().then((b:any)=>{
            const upd=()=>setBatt({level:b.level, charging:b.charging});
            upd(); b.addEventListener('levelchange',upd); b.addEventListener('chargingchange',upd);
        });
        const c = (navigator as any).connection;
        if(c){ const upd=()=>setNet({type:c.effectiveType, downlink:c.downlink}); upd(); c.addEventListener('change',upd); }
    },[]);

    const pct = Math.round((batt?.level ?? 0)*100);

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">System</h3>
                <div className={`px-2 py-1 rounded-full text-xs border ${online?'border-emerald-400 text-emerald-300':'border-red-400 text-red-300'}`}>{online?'Online':'Offline'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/60 text-sm">Battery</div>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="w-28 h-6 rounded-md border border-white/20 relative overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-[var(--accent)]" style={{width:`${pct}%`}}/>
                        </div>
                        <div className="text-white font-semibold">{pct}% {batt?.charging?'⚡':''}</div>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/60 text-sm">Network</div>
                    <div className="mt-2 text-white">
                        {net? `${net.type?.toUpperCase()||'NET'} • ~${net.downlink?.toFixed(1)||'?'} Mbps` : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}
