// utils/color.ts
export function onAccentColor(hex: string): '#000000' | '#ffffff' {
    const { r, g, b } = hexToRgb(hex);
    // sRGB -> lin
    const lin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const R = lin(r), G = lin(g), B = lin(b);
    const L = 0.2126 * R + 0.7152 * G + 0.0722 * B; // luminance relative

    // contraste avec blanc et noir
    const contrastWhite = (1 + 0.05) / (L + 0.05);
    const contrastBlack = (L + 0.05) / 0.05;

    // on retourne la couleur qui donne le meilleur contraste
    return contrastBlack >= contrastWhite ? '#000000' : '#ffffff';
}

function hexToRgb(hex: string) {
    let h = hex.trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
