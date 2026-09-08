/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Base URL of the Mauria API. Defaults to the production API when unset. */
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
