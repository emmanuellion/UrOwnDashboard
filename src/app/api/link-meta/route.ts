import { NextResponse } from 'next/server';

function abs(base: string, href: string) {
    try { return new URL(href, base).toString(); } catch { return href; }
}

function extract(html: string, baseUrl: string) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const linkRe = /<link[^>]+rel=["']?([^"'>]+)["']?[^>]*href=["']?([^"'>\s]+)["']?[^>]*>/gi;
    let icon: string | undefined;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html))) {
        const rel = m[1].toLowerCase();
        const href = m[2];
        if (rel.includes('icon') || rel.includes('apple-touch-icon')) {
            icon = abs(baseUrl, href);
            if (rel.includes('icon')) break;
        }
    }
    if (!icon) {
        try { icon = new URL('/favicon.ico', baseUrl).toString(); } catch {}
    }
    return { title, icon };
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'LifeDashboard/1.0 (+dashboard)' },
            next: { revalidate: 3600 },
        });
        const html = await res.text();
        const slice = html.slice(0, 200_000); // 200KB suffisent
        const meta = extract(slice, url);
        return NextResponse.json(meta);
    } catch {
        return NextResponse.json({ title: undefined, icon: undefined }, { status: 200 });
    }
}
