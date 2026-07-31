/* ---------------------------------------------------------------
   Supabase configuration.

   The portal works with NO configuration at all — it falls back to
   storing accounts and progress in this browser's localStorage.

   To sync accounts/progress across devices, create a free project at
   https://supabase.com, then paste the two values below from
   Project Settings → API. Nothing else needs to change.

   Also run the SQL in supabase-setup.sql inside your project's
   SQL editor to create the progress table.
--------------------------------------------------------------- */
window.PORTAL_CONFIG = {
  SUPABASE_URL: "https://qnvcdhilgawosnncnspz.supabase.co",       // e.g. "https://abcdefgh.supabase.co"
  SUPABASE_ANON_KEY: "sb_publishable_x4zR1anVBi0f8LrRUx-6Tw_DUdMLyEe"   // the long "anon public" key
};
