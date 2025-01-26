/// <reference types="vite/client" />
// src/vite-env.d.ts
/// <reference types="vite/client" />

/**
 * @file src/vite-env.d.ts
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 00:47:15
 * Current User's Login: jake1318
 */

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_YOUTUBE: string
  readonly VITE_ENABLE_WEB_SEARCH: string
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
