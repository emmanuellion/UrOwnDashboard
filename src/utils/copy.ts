// utils/copy.ts
type ToastKind = 'success' | 'error' | 'info';

function showToast(message: string, kind: ToastKind = 'info') {
    const id = 'ld-toaster';
    let root = document.getElementById(id);
    if (!root) {
        root = document.createElement('div');
        root.id = id;
        Object.assign(root.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
        } as unknown as CSSStyleDeclaration);
        document.body.appendChild(root);
    }

    const el = document.createElement('div');
    const bg =
        kind === 'success'
            ? 'var(--accent, #7c3aed)'
            : kind === 'error'
                ? '#ef4444'
                : 'rgba(17,24,39,.9)'; // slate-900/90
    const color = kind === 'info' ? '#fff' : 'var(--on-accent, #fff)';

    Object.assign(el.style, {
        pointerEvents: 'auto',
        background: bg,
        color,
        borderRadius: '12px',
        padding: '10px 12px',
        boxShadow: '0 8px 30px rgba(0,0,0,.35)',
        border: '1px solid rgba(255,255,255,.15)',
        transform: 'translateY(-8px)',
        opacity: '0',
        transition: 'transform .18s ease, opacity .18s ease',
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '.2px',
        maxWidth: '320px',
        whiteSpace: 'pre-line',
    } as CSSStyleDeclaration);

    el.textContent = message;
    root.appendChild(el);

    // petite apparition
    requestAnimationFrame(() => {
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
    });

    // disparition auto
    const ttl = 1600;
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px)';
        setTimeout(() => el.remove(), 220);
    }, ttl);
}

/** Copie avec fallback + toast succès/erreur */
export async function copy(text: string) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // fallback execCommand
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            Object.assign(ta.style, { position: 'fixed', top: '-9999px' });
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        // haptique légère (si dispo)
        (navigator as any).vibrate?.(20);
        showToast('Copié dans le presse-papier', 'success');
    } catch (err) {
        console.error('Copy failed:', err);
        showToast("Échec de la copie", 'error');
    }
}
