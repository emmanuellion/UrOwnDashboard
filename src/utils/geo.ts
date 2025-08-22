// utils/geo.ts
export type ResolvedLocation = { lat: number; lon: number; label: string };
const LAST_POS_KEY = 'ld-last-pos-v1';

const CAPITALS: Record<string, { lat: number; lon: number; label: string }> = {
    FR: { lat: 48.8566, lon: 2.3522, label: 'Paris, FR' },
    BE: { lat: 50.8503, lon: 4.3517, label: 'Bruxelles, BE' },
    CH: { lat: 46.948, lon: 7.4474, label: 'Berne, CH' },
    DE: { lat: 52.52, lon: 13.405, label: 'Berlin, DE' },
    ES: { lat: 40.4168, lon: -3.7038, label: 'Madrid, ES' },
    IT: { lat: 41.9028, lon: 12.4964, label: 'Rome, IT' },
    PT: { lat: 38.7223, lon: -9.1393, label: 'Lisbonne, PT' },
    NL: { lat: 52.3676, lon: 4.9041, label: 'Amsterdam, NL' },
    GB: { lat: 51.5074, lon: -0.1278, label: 'Londres, GB' },
    IE: { lat: 53.3498, lon: -6.2603, label: 'Dublin, IE' },
    US: { lat: 38.9072, lon: -77.0369, label: 'Washington, US' },
    CA: { lat: 45.4215, lon: -75.6972, label: 'Ottawa, CA' },
    JP: { lat: 35.6762, lon: 139.6503, label: 'Tokyo, JP' },
    KR: { lat: 37.5665, lon: 126.978, label: 'Seoul, KR' },
    CN: { lat: 39.9042, lon: 116.4074, label: 'Pékin, CN' },
    IN: { lat: 28.6139, lon: 77.209, label: 'New Delhi, IN' },
    AU: { lat: -35.2809, lon: 149.13, label: 'Canberra, AU' },
    NZ: { lat: -41.2866, lon: 174.7756, label: 'Wellington, NZ' },
    BR: { lat: -15.7939, lon: -47.8828, label: 'Brasília, BR' },
    MX: { lat: 19.4326, lon: -99.1332, label: 'Mexico, MX' },
    MA: { lat: 34.0209, lon: -6.8416, label: 'Rabat, MA' },
    DZ: { lat: 36.7538, lon: 3.0588, label: 'Alger, DZ' },
    TN: { lat: 36.8065, lon: 10.1815, label: 'Tunis, TN' },
    EG: { lat: 30.0444, lon: 31.2357, label: 'Le Caire, EG' },
    TR: { lat: 39.9334, lon: 32.8597, label: 'Ankara, TR' },
    SE: { lat: 59.3293, lon: 18.0686, label: 'Stockholm, SE' },
    NO: { lat: 59.9139, lon: 10.7522, label: 'Oslo, NO' },
    FI: { lat: 60.1699, lon: 24.9384, label: 'Helsinki, FI' },
    DK: { lat: 55.6761, lon: 12.5683, label: 'Copenhague, DK' },
    PL: { lat: 52.2297, lon: 21.0122, label: 'Varsovie, PL' },
    AT: { lat: 48.2082, lon: 16.3738, label: 'Vienne, AT' },
    CZ: { lat: 50.0755, lon: 14.4378, label: 'Prague, CZ' },
    GR: { lat: 37.9838, lon: 23.7275, label: 'Athènes, GR' },
    RO: { lat: 44.4268, lon: 26.1025, label: 'Bucarest, RO' },
};

function countryFromLocale(): string | undefined {
    const loc = (navigator.language || Intl.DateTimeFormat().resolvedOptions().locale || '').toUpperCase();
    const cc = loc.split('-')[1];
    return cc && cc.length === 2 ? cc : undefined;
}

function loadLast(): ResolvedLocation | undefined {
    try { const r = localStorage.getItem(LAST_POS_KEY); return r ? JSON.parse(r) : undefined; } catch { return undefined; }
}
function saveLast(pos: ResolvedLocation) {
    try { localStorage.setItem(LAST_POS_KEY, JSON.stringify(pos)); } catch {}
}

/** Meilleure position disponible, avec timeouts & fallbacks */
export async function resolveLocation(): Promise<ResolvedLocation> {
    // 1) Essayons géoloc (getCurrent + watch racing)
    const askGeo = (): Promise<GeolocationPosition> =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('timeout')), 7000);

            // current
            navigator.geolocation.getCurrentPosition(
                (pos) => { clearTimeout(timer); resolve(pos); },
                () => {/* ignore here, we still have watch */},
                { enableHighAccuracy: true, maximumAge: 60_000, timeout: 6000 }
            );

            // watch (iOS renvoie parfois ici d’abord)
            const id = navigator.geolocation.watchPosition(
                (pos) => { clearTimeout(timer); navigator.geolocation.clearWatch(id); resolve(pos); },
                (err) => { /* échec, on laissera le timeout décider */ },
                { enableHighAccuracy: true }
            );
        });

    try {
        const p = await askGeo();
        const lat = p.coords.latitude, lon = p.coords.longitude;
        const label = `${lat.toFixed(3)}, ${lon.toFixed(3)}`; // on évite le reverse si CORS bloque
        const out = { lat, lon, label };
        saveLast(out);
        return out;
    } catch {
        // 2) Cache local
        const cached = loadLast();
        if (cached) return cached;

        // 3) Capitale selon locale
        const cc = countryFromLocale();
        if (cc && CAPITALS[cc]) return CAPITALS[cc];

        // 4) Valeur sûre (Paris)
        return CAPITALS.FR;
    }
}
