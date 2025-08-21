'use client';

import React, {useEffect, useRef, useState} from 'react';

function useNoise() {
    const ctxRef = useRef<AudioContext|null>(null);
    const srcRef = useRef<AudioBufferSourceNode|null>(null);

    const makeBuffer = (type:'white'|'brown') => {
        const ctx = ctxRef.current!;
        const len = ctx.sampleRate * 3; // 3s loop
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        let lastOut = 0;
        for (let i=0;i<len;i++){
            const white = Math.random()*2-1;
            d[i] = type==='white' ? white : (lastOut + (0.02 * white)) / 1.02, lastOut = d[i], d[i]*=3.5; // brown approx
        }
        return buf;
    };

    const start = async (type:'white'|'brown'|'file', file?:File) => {
        if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = ctxRef.current;
        const src = ctx.createBufferSource();
        if (type ==='file' && file){
            const arr = await file.arrayBuffer();
            src.buffer = await ctx.decodeAudioData(arr);
        } else {
            src.buffer = makeBuffer(type as 'white'|'brown');
        }
        src.loop = true;
        src.connect(ctx.destination);
        src.start();
        srcRef.current = src;
    };

    const stop = () => { srcRef.current?.stop(); srcRef.current?.disconnect(); srcRef.current=null; };
    return { start, stop, active: ()=>!!srcRef.current };
}

export default function FocusTimer(){
    const [secs,setSecs]=useState(25*60); // 25 min
    const [running,setRunning]=useState(false);

    useEffect(()=>{
        let t: any;
        if(running){ t=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);}
        return ()=>clearInterval(t);
    },[running]);

    const m = Math.floor(secs/60), s=secs%60;
    const ring = (secs/(25*60))*283; // for dash

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">Focus</h3>
                <div className="text-xs text-white/60">Pomodoro</div>
            </div>

            <div className="flex items-center gap-6">
                <svg width="120" height="120" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#ffffff22" strokeWidth="10" fill="none" />
                    <circle cx="50" cy="50" r="45" stroke="var(--accent)" strokeWidth="10" fill="none"
                            strokeDasharray={`${ring} 999`} transform="rotate(-90 50 50)" strokeLinecap="round"/>
                </svg>

                <div>
                    <div className="text-4xl font-semibold tabular-nums">{m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}</div>
                    <div className="mt-3 flex gap-2">
                        {!running ? (
                            <button style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'color-mix(in oklab, var(--on-accent) 25%, transparent)' }}
                                    onClick={()=>setRunning(true)} className="hover:cursor-pointer px-3 py-1 rounded-md bg-[var(--accent)] text-white text-sm">Start</button>
                        ) : (
                            <button onClick={()=>setRunning(false)} className="hover:cursor-pointer px-3 py-1 rounded-md bg-white/10 text-white text-sm">Pause</button>
                        )}
                        <button onClick={()=>{setRunning(false);setSecs(25*60);}} className="hover:cursor-pointer px-3 py-1 rounded-md bg-white/10 text-white text-sm">Reset</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
