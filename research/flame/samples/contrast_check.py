# WCAG 2.x contrast calculator (relative luminance per WCAG 2.2 definition).
def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def lum(h):
    r, g, b = hex2rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

DARK = {
 'bg': '#0B0D10', 'surface': '#12161B', 'raised': '#1A1F26', 'hairline': '#232A33',
 'ink': '#E8EAED', 'muted': '#9AA1AB', 'accent': '#7CC4F2', 'accent_ink': '#06121A',
 'focus': '#A8DCFF', 'glyph_on': '#E8EAED', 'glyph_off': '#68727F', 'border_strong': '#6B7480',
 'warn_text': '#F2B66B', 'imgdark': '#000000', 'imglight': '#E8EAED',
}
LIGHT = {
 'bg': '#F4F5F6', 'surface': '#FFFFFF', 'raised': '#EDEFF2', 'hairline': '#D5DAE0',
 'ink': '#111418', 'muted': '#4F5661', 'accent': '#0A5FA8', 'accent_ink': '#FFFFFF',
 'focus': '#0A5FA8', 'glyph_on': '#111418', 'glyph_off': '#737B87', 'border_strong': '#7A828D',
 'warn_text': '#8A4B00', 'imgdark': '#0B0D10', 'imglight': '#F4F5F6',
}
PAIRS = [
 # (label, fg key, bg key, kind)  kind: text (4.5 body / 3 large), ui (3.0 non-text)
 ('body ink on bg', 'ink', 'bg', 'text'),
 ('body ink on surface', 'ink', 'surface', 'text'),
 ('body ink on raised', 'ink', 'raised', 'text'),
 ('muted text on bg', 'muted', 'bg', 'text'),
 ('muted text on surface', 'muted', 'surface', 'text'),
 ('muted text on raised', 'muted', 'raised', 'text'),
 ('accent text/link on surface', 'accent', 'surface', 'text'),
 ('accent text/link on bg', 'accent', 'bg', 'text'),
 ('selected chip / primary button: accent_ink on accent', 'accent_ink', 'accent', 'text'),
 ('muted text on raised (chips)', 'muted', 'raised', 'text'),
 ('accent on raised', 'accent', 'raised', 'text'),
 ('warning text on raised', 'warn_text', 'raised', 'text'),
 ('focus ring vs raised', 'focus', 'raised', 'ui'),
 ('input border vs bg', 'border_strong', 'bg', 'ui'),
 ('focus ring vs surface', 'focus', 'surface', 'ui'),
 ('focus ring vs bg', 'focus', 'bg', 'ui'),
 ('ordinal glyph ON vs surface', 'glyph_on', 'surface', 'ui'),
 ('ordinal glyph OFF vs surface', 'glyph_off', 'surface', 'ui'),
 ('input border / ui boundary vs surface', 'border_strong', 'surface', 'ui'),
 ('warning text on surface', 'warn_text', 'surface', 'text'),
 ('hairline vs surface (DECORATIVE ONLY)', 'hairline', 'surface', 'deco'),
]
for name, T in (('DARK', DARK), ('LIGHT', LIGHT)):
    print(f'== {name} ==')
    for label, fg, bg, kind in PAIRS:
        r = ratio(T[fg], T[bg])
        if kind == 'text': need = 4.5; ok = r >= 4.5
        elif kind == 'ui': need = 3.0; ok = r >= 3.0
        else: need = None; ok = None
        status = 'PASS' if ok else ('FAIL' if ok is False else 'n/a (decorative)')
        print(f'{label:70s} {T[fg]} on {T[bg]}  {r:6.2f}:1  need {need}  {status}')
