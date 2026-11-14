/** Offline-ready (SPEC §7): registers /sw.js in production so the corpus, preset audio and app shell are cached after first load. */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support is optional */ }); });
}
