'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ==== Maths solaires (NOAA/SunCalc simplifié) ==== */
const rad = (d:number)=>d*Math.PI/180, deg=(r:number)=>r*180/Math.PI;
const dayMs=86400000, J1970=2440588, J2000=2451545;
const toJulian=(d:Date)=>d.valueOf()/dayMs-0.5+J1970;
const fromJulian=(j:number)=>new Date((j+0.5-J1970)*dayMs);
const e = rad(23.4397);
const solarMeanAnomaly=(d:number)=>rad(357.5291+0.98560028*d);
const eclipticLongitude=(M:number)=>M+rad(1.9148)*Math.sin(M)+rad(0.02)*Math.sin(2*M)+rad(0.0003)*Math.sin(3*M)+rad(102.9372)+Math.PI;
const declination=(L:number)=>Math.asin(Math.sin(L)*Math.sin(e));
const rightAscension=(L:number)=>Math.atan2(Math.sin(L)*Math.cos(e),Math.cos(L));
const siderealTime=(d:number,lw:number)=>rad(280.16+360.9856235*d)-lw;
const julianCycle=(d:number,lw:number)=>Math.round(d-lw/(2*Math.PI));
const approxTransit=(Ht:number,lw:number,n:number)=>J2000+(Ht+lw)/(2*Math.PI)+n;
const solarTransitJ=(ds:number,M:number,L:number)=>J2000+ds+0.0053*Math.sin(M)-0.0069*Math.sin(2*L);
const hourAngle=(h:number,phi:number,dec:number)=>Math.acos((Math.sin(h)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec)));

function sunTimesForAltitude(lat:number, lon:number, hDeg:number, date=new Date()){
    const lw=-rad(lon), phi=rad(lat);
    const d=toJulian(new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())))-J2000;
    const M=solarMeanAnomaly(d), L=eclipticLongitude(M), dec=declination(L);
    const h=rad(hDeg), n=julianCycle(d,lw), ds=approxTransit(0,lw,n);
    const Jnoon=solarTransitJ(ds,M,L);
    const cos=(Math.sin(h)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec));
    if (cos<-1 || cos>1) return {rise:undefined,set:undefined,noon:fromJulian(Jnoon)};
    const w=hourAngle(h,phi,dec);
    return {
        rise: fromJulian(solarTransitJ(approxTransit(-w,lw,n),M,L)),
        set : fromJulian(solarTransitJ(approxTransit( w,lw,n),M,L)),
        noon: fromJulian(Jnoon)
    };
}

/* ==== Helpers ==== */
const clamp01=(x:number)=>Math.max(0,Math.min(1,x));
const fmt=(d?:Date)=>d?`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`:'—';

const CAPITALS: Record<string,{lat:number;lon:number;label:string}> = {
    FR:{lat:48.8566,lon:2.3522,label:'Paris'},
    US:{lat:38.9072,lon:-77.0369,label:'Washington'},
    GB:{lat:51.5074,lon:-0.1278,label:'London'},
    DE:{lat:52.52,lon:13.405,label:'Berlin'},
    CA:{lat:45.4215,lon:-75.6972,label:'Ottawa'},
    JP:{lat:35.6762,lon:139.6503,label:'Tokyo'},
};

export default function SunArc(){
    const [pos,setPos]=useState<{lat:number;lon:number;label:string}|null>(null);
    const [now,setNow]=useState(new Date());
    useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),30_000); return ()=>clearInterval(t);},[]);

    useEffect(()=>{
        const ask=()=>new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:6000}));
        (async()=>{
            try{
                const p=await ask();
                setPos({lat:p.coords.latitude,lon:p.coords.longitude,label:`${p.coords.latitude.toFixed(2)}, ${p.coords.longitude.toFixed(2)}`});
            }catch{
                const cc=(navigator.language?.split('-')[1]||'').toUpperCase();
                setPos(CAPITALS[cc as keyof typeof CAPITALS] ?? {lat:0,lon:0,label:'Equator'});
            }
        })();
    },[]);

    const data = useMemo(()=>{
        if(!pos) return null;
        const SUN = sunTimesForAltitude(pos.lat,pos.lon,-0.833,now);
        const CIV = sunTimesForAltitude(pos.lat,pos.lon,-6,now);
        const GLO = sunTimesForAltitude(pos.lat,pos.lon,-4,now);
        const GHI = sunTimesForAltitude(pos.lat,pos.lon, 6,now);

        const sunrise=SUN.rise, sunset=SUN.set, noon=SUN.noon;
        const frac=(t?:Date)=>!sunrise||!sunset?undefined:clamp01((t!.getTime()-sunrise.getTime())/(sunset.getTime()-sunrise.getTime()));
        const segments = [
            // Blue AM
            frac(CIV.rise)! < frac(sunrise)! && {a: frac(CIV.rise)!, b: frac(sunrise)!, color:'url(#blue)'},
            // Golden AM
            frac(GLO.rise)! < frac(GHI.rise)! && {a: frac(GLO.rise)!, b: frac(GHI.rise)!, color:'url(#gold)'},
            // Golden PM
            frac(GHI.set)! < frac(GLO.set)! && {a: frac(GHI.set)!, b: frac(GLO.set)!, color:'url(#gold)'},
            // Blue PM
            frac(sunset)! < frac(CIV.set)! && {a: frac(sunset)!, b: frac(CIV.set)!, color:'url(#blue)'},
        ].filter(Boolean) as {a:number;b:number;color:string}[];

        const sunFrac = (!sunrise||!sunset)?undefined:clamp01((now.getTime()-sunrise.getTime())/(sunset.getTime()-sunrise.getTime()));

        return {sunrise,sunset,noon,segments,sunFrac};
    },[pos,now]);

    /* ==== Taille compacte (responsive) ==== */
    const wrapRef = useRef<HTMLDivElement>(null);
    const [w,setW]=useState(420);
    useEffect(()=>{
        const ro=new ResizeObserver(entries=>{
            const width=entries[0].contentRect.width;
            setW(width);
        });
        if(wrapRef.current) ro.observe(wrapRef.current);
        return ()=>ro.disconnect();
    },[]);
    const r   = Math.min(Math.max(w*0.42, 90), 140);       // rayon : ~40% de la largeur, borné 90–140
    const cx  = w/2;
    const baseY = r + 16;                                  // ligne de base
    const svgH  = r + 24;                                  // <-- hauteur compacte (≈ 110–164px)

    const point=(f:number)=>{ const th=Math.PI - f*Math.PI; return { x: cx + r*Math.cos(th), y: baseY - r*Math.sin(th) }; };
    const arc=(a:number,b:number)=>{ const P1=point(a), P2=point(b); return `M ${P1.x},${P1.y} A ${r},${r} 0 0 1 ${P2.x},${P2.y}`; };

    // ticks (toutes les ~2h max)
    const ticks = useMemo(()=>{
        if(!data?.sunrise || !data.sunset) return [];
        const start=new Date(data.sunrise); start.setMinutes(0,0,0);
        const out: {x1:number;y1:number;x2:number;y2:number}[]=[];
        const stepHr = Math.ceil(((data.sunset.getTime()-data.sunrise.getTime())/3600000)/6); // ~6 ticks max
        while(start<=data.sunset){
            const f = clamp01((start.getTime()-data.sunrise.getTime())/(data.sunset.getTime()-data.sunrise.getTime()));
            const p=point(f); const inner=8; const th=Math.PI - f*Math.PI;
            out.push({x1:p.x,y1:p.y,x2:p.x - inner*Math.cos(th), y2:p.y + inner*Math.sin(th)});
            start.setHours(start.getHours()+stepHr);
        }
        return out;
    },[data, w, r]);

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">Sun Arc</h3>
                <div className="px-2 py-1 rounded-full border border-white/15 bg-white/10 text-white/80 text-xs">
                    📍 {pos?.label ?? '—'}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 items-center">
                {/* ARC COMPACT */}
                <div ref={wrapRef} className="relative">
                    <svg width={w} height={svgH} viewBox={`0 0 ${w} ${svgH}`}>
                        <defs>
                            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ffd54a"/><stop offset="100%" stopColor="#ff7e5f"/>
                            </linearGradient>
                            <linearGradient id="blue" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#89f7fe"/><stop offset="100%" stopColor="#66a6ff"/>
                            </linearGradient>
                        </defs>

                        {/* piste */}
                        <path d={arc(0,1)} fill="none" stroke="#ffffff26" strokeWidth={12} strokeLinecap="round"/>
                        {/* segments twilight directement sur l’arc */}
                        {data?.segments.map((s,i)=>(
                            <path key={i} d={arc(s.a,s.b)} fill="none" stroke={s.color} strokeWidth={8} strokeLinecap="round"/>
                        ))}
                        {/* ticks */}
                        {ticks.map((t,i)=>(<line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#ffffff2e" strokeWidth={2}/>))}
                        {/* soleil */}
                        {typeof data?.sunFrac==='number' && (()=>{ const p=point(data.sunFrac); return <circle cx={p.x} cy={p.y} r={9} fill="var(--accent)"/>; })()}
                    </svg>
                </div>

                {/* INFOS */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                    <div><div className="text-white/60">Sunrise</div><div className="text-white font-semibold">{fmt(data?.sunrise)}</div></div>
                    <div><div className="text-white/60">Sunset</div><div className="text-white font-semibold">{fmt(data?.sunset)}</div></div>
                    <div><div className="text-white/60">Solar Noon</div><div className="text-white font-semibold">{fmt(data?.noon)}</div></div>
                    <div>
                        <div className="text-white/60">Day length</div>
                        <div className="text-white font-semibold">
                            {data?.sunrise && data?.sunset ? (()=>{ const ms=data.sunset.getTime()-data.sunrise.getTime(); const h=Math.floor(ms/3600000), m=Math.round((ms%3600000)/60000); return `${h}h ${String(m).padStart(2,'0')}m`; })() : '—'}
                        </div>
                    </div>
                    <div className="col-span-2 text-xs text-white/60 mt-1">
                        <span className="inline-block w-3 h-1.5 align-middle rounded bg-gradient-to-r from-[#ffd54a] to-[#ff7e5f]"/> Golden ·
                        <span className="inline-block w-3 h-1.5 align-middle rounded bg-gradient-to-r from-[#89f7fe] to-[#66a6ff] ml-2"/> Blue
                    </div>
                </div>
            </div>
        </div>
    );
}
