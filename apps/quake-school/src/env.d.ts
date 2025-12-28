/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_BUILD_TIME: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_QUAKE_SCHOOL_BASE_PATH: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
