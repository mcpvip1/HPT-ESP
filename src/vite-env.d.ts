/// <reference types="vite/client" />

/** Release version from release.json, baked in by vite.config.ts (e.g. 'V2.1.4'). */
declare const __APP_VERSION__: string;
/** Build timestamp (ISO) baked in by vite.config.ts at build start. */
declare const __APP_BUILT_AT__: string;
