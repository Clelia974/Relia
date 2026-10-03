/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PRICE_SOLO_MONTHLY: string
  readonly VITE_STRIPE_PRICE_SOLO_YEARLY: string
  /** Domaine déclaré dans Plausible ; absent = mesure d'audience désactivée. */
  readonly VITE_PLAUSIBLE_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
