'use client';
import React, {useMemo, useState} from 'react';
import {GalleryItem} from '@/types/gallery';

function parseEXIF(dataUrl:string){
    // minimal JPEG EXIF parser (IFD0/ExifIFD, common tags)
    try{
        const base64 = dataUrl.split(',')[1]; if(!base64) return null;
        const bin = atob(base64); const view = new DataView(new ArrayBuffer(bin.length));
        for(let i=0;i<bin.length;i++) (view as any).buffer[i]=bin.charCodeAt(i); // fill

        const getShort=(o:number,little:boolean)=> little? view.getUint16(o,true):view.getUint16(o,false);
        const getLong=(o:number,little:boolean)=> little? view.getUint32(o,true):view.getUint32(o,false);

        let offset=2; if(view.getUint16(0)!==0xFFD8) return null; // not JPEG
        while(offset<view.byteLength){
            if(view.getUint16(offset)===0xFFE1){ // APP1
                const exifStart=offset+4;
                if(String.fromCharCode(view.getUint8(exifStart),view.getUint8(exifStart+1),view.getUint8(exifStart+2),view.getUint8(exifStart+3))!=='Exif') break;
                const tiff = exifStart+6;
                const little = view.getUint16(tiff)===0x4949;
                const firstIFD = getLong(tiff+4,little)+tiff;

                function readIFD(dir:number){
                    const entries = getShort(dir,little);
                    const out: Record<string, any> = {};
                    for(let i=0;i<entries;i++){
                        const o = dir+2+i*12;
                        const tag=getShort(o,little), type=getShort(o+2,little), count=getLong(o+4,little);
                        let valOffset = o+8; if(getLong(valOffset,little)>4) valOffset = tiff + getLong(valOffset,little);
                        const getR = ()=> {
                            if(type===3) return getShort(valOffset,little);
                            if(type===4) return getLong(valOffset,little);
                            if(type===5){ const a=getLong(valOffset,little), b=getLong(valOffset+4,little); return a/b; }
                            if(type===2){ let s=''; for(let k=0;k<count-1;k++) s+=String.fromCharCode(view.getUint8(valOffset+k)); return s; }
                            return null;
                        };
                        const v=getR();
                        // map tags
                        const map: Record<number,string> = {
                            0x010F:'Make',0x0110:'Model',0x0132:'ModifyDate',0x829A:'ExposureTime',0x829D:'FNumber',
                            0x8827:'ISO',0x920A:'FocalLength',0x9003:'DateTimeOriginal'
                        };
                        if(map[tag]) out[map[tag]] = v;
                        if(tag===0x8769){ // ExifIFD pointer
                            Object.assign(out, readIFD(tiff + (v as number)));
                        }
                    }
                    return out;
                }
                return readIFD(firstIFD);
            }
            offset += 2 + view.getUint16(offset+2);
        }
        return null;
    }catch{ return null; }
}

export default function ExifViewer({gallery}:{gallery:GalleryItem[]}) {
    const [sel,setSel]=useState<GalleryItem|null>(null);
    const exif = useMemo(()=> sel? parseEXIF(sel.src): null,[sel]);

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold tracking-tight text-white/90">EXIF Viewer</h3>
            </div>

            {gallery.length===0 ? (
                <div className="text-white/60 text-sm">Ajoute des photos à la Gallery pour voir leurs métadonnées.</div>
            ) : (
                <>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {gallery.map(g=>(
                            <button key={g.id} onClick={()=>setSel(g)} className={`relative rounded-lg overflow-hidden border ${sel?.id===g.id?'border-[var(--accent)]':'border-white/10'}`}>
                                <img src={g.src} alt="" className="w-28 h-20 object-cover"/>
                            </button>
                        ))}
                    </div>

                    {sel && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div><div className="text-white/60">Taken</div><div className="text-white">{exif?.DateTimeOriginal || '—'}</div></div>
                            <div><div className="text-white/60">Camera</div><div className="text-white">{exif?.Make || ''} {exif?.Model || ''}</div></div>
                            <div><div className="text-white/60">Exposure</div><div className="text-white">{exif?.ExposureTime? `1/${Math.round(1/(exif.ExposureTime as number))}s`: '—'}</div></div>
                            <div><div className="text-white/60">Aperture</div><div className="text-white">{exif?.FNumber?`f/${(exif.FNumber as number).toFixed(1)}`:'—'}</div></div>
                            <div><div className="text-white/60">ISO</div><div className="text-white">{exif?.ISO || '—'}</div></div>
                            <div><div className="text-white/60">Focal</div><div className="text-white">{exif?.FocalLength?`${(exif.FocalLength as number).toFixed(0)}mm`:'—'}</div></div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
