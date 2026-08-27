/**
 * ============================================================
 * Learnify — Supabase Database Client
 * ============================================================
 *
 * Creates a Supabase client using the SERVICE ROLE key so the
 * backend can read/write all tables directly (bypassing RLS).
 *
 * This is separate from storageService.js which uses the ANON
 * key for public file uploads.  The DB client uses the service
 * role key because it needs to JOIN tables and UPDATE rows.
 *
 * ── Environment variables used ────────────────────────────
 *   SUPABASE_URL            — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — server-only secret (never expose
 *                               this in a browser bundle)
 *
 * Returns null when credentials are missing so the rest of the
 * app can fall back to dummy/request-body data gracefully.
 */

const { createClient } = require("@supabase/supabase-js");

// ── Lazy-init so missing creds don't crash startup ──────────
let db = null;

function getDb() {
  if (db) return db;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes("your-project-ref")) {
    console.warn("[DB] Supabase credentials not configured — DB lookups disabled.");
    return null;
  }

  db = createClient(url, key);
  console.log("[DB] Supabase client initialised (service role).");
  return db;
}

module.exports = { getDb };
