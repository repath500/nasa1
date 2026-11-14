/** Egg key buffer. Shared so single-letter app shortcuts do not fire while a secret word is being typed (SPEC §9). */
export const EGG_WORDS = ['candle'] as const;
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

let buffer = '';
let konamiAt = 0;
let consumedLast = false;

export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

export interface EggKeyResult { word: string | null; konami: boolean }
/** Feed one keydown. Returns a completed word or the Konami code. */
export function feedEggKey(e: KeyboardEvent): EggKeyResult {
  consumedLast = false;
  const res: EggKeyResult = { word: null, konami: false };
  if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) { buffer = ''; konamiAt = 0; return res; }
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // Konami
  if (k === KONAMI[konamiAt]) { konamiAt++; if (konamiAt === KONAMI.length) { konamiAt = 0; res.konami = true; } } else konamiAt = k === KONAMI[0] ? 1 : 0;
  // Words
  if (k.length === 1 && /[a-z]/.test(k)) {
    buffer = (buffer + k).slice(-12);
    for (const w of EGG_WORDS) {
      if (buffer.endsWith(w)) { res.word = w; buffer = ''; consumedLast = true; return res; }
      // Suppress app shortcuts once at least 2 letters of a secret word are typed and this key extends it.
      for (let n = Math.min(buffer.length, w.length - 1); n >= 2; n--) if (buffer.slice(-n) === w.slice(0, n)) consumedLast = true;
    }
  } else buffer = '';
  return res;
}
export const eggConsumedLastKey = () => consumedLast;
