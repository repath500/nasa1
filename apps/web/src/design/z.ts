/** SPEC §6.3 z-index scale. Mirrors the --z-* custom properties in tokens.css. */
export const Z = { map: 0, panel: 10, sticky: 20, drawer: 30, palette: 40, toast: 50, grain: 60 } as const;
export type ZLayer = keyof typeof Z;
