/**
 * ============================================================
 * Learnify Notifications — Supabase Storage Service
 * ============================================================
 *
 * Uploads generated PDFs to a Supabase Storage bucket and
 * returns a public URL so notifications can share a link
 * instead of attaching raw files.
 *
 * Usage:
 *   const { uploadPDFAndGetLink } = require("./storageService");
 *   const url = await uploadPDFAndGetLink(pdfBuffer, "challan-CH-001.pdf");
 *
 * ── Environment variables needed ──────────────────────────
 *   SUPABASE_URL              — project URL from Supabase dashboard
 *   SUPABASE_ANON_KEY         — public anon key
 *   SUPABASE_STORAGE_BUCKET   — bucket name (default: "challans")
 *
 * When SANDBOX=true, uploads are skipped and a mock URL is
 * returned so the rest of the flow can be tested locally.
 *
 * ── Bucket setup ──────────────────────────────────────────
 * 1. In Supabase dashboard → Storage → create bucket "challans"
 * 2. Mark it as PUBLIC so files are accessible via URL
 * 3. Optionally add a policy to restrict upload to server-side only
 */

const { createClient } = require("@supabase/supabase-js");

// Polyfill WebSocket for Node.js < 22
if (typeof globalThis.WebSocket === "undefined") {
  try { globalThis.WebSocket = require("ws"); } catch {}
}

// ── Supabase client (lazy-init so missing creds don't crash startup) ──
let supabase = null;

function getClient() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-ref")) {
    console.warn("[Storage] Supabase credentials not configured.");
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Upload a PDF buffer to Supabase Storage and return its public URL.
 *
 * @param {Buffer} pdfBuffer — Raw PDF bytes from pdfGenerator.
 * @param {string} filename  — Desired filename in the bucket (e.g. "challan-CH-001.pdf").
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
async function uploadPDFAndGetLink(pdfBuffer, filename) {
  const sandbox = process.env.SANDBOX === "true";

  // ── Sandbox mode — return a mock URL, skip real upload ────
  if (sandbox) {
    const mockUrl = `https://mock-storage.example.com/${filename}`;
    console.log(`[Storage] [SANDBOX] Would upload "${filename}" (${pdfBuffer.length} bytes)`);
    console.log(`[Storage] [SANDBOX] Mock URL: ${mockUrl}`);
    return { success: true, url: mockUrl, sandbox: true };
  }

  const client = getClient();
  if (!client) {
    const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
    if (!publicBase) {
      console.warn("[Storage] Supabase not configured and PUBLIC_URL is not set. PDF link will be unavailable.");
      return { success: false, error: "No storage configured and PUBLIC_URL not set." };
    }
    const fallbackUrl = `${publicBase}/api/notify/pdf/challan/${filename.replace('.pdf', '')}`;
    console.log(`[Storage] Supabase not configured. Using PUBLIC_URL fallback: ${fallbackUrl}`);
    return { success: true, url: fallbackUrl };
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "challans";

  try {
    // Upload with upsert so re-generated challans overwrite old ones
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filename, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("[Storage] Upload failed:", error.message);
      const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
      if (!publicBase) {
        console.warn("[Storage] PUBLIC_URL not set — PDF link will be unavailable.");
        return { success: false, error: error.message };
      }
      const fallbackUrl = `${publicBase}/api/notify/pdf/challan/${filename.replace('.pdf', '')}`;
      console.log(`[Storage] Falling back to PUBLIC_URL route: ${fallbackUrl}`);
      return { success: true, url: fallbackUrl };
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;
    console.log(`[Storage] Uploaded "${filename}" → ${publicUrl}`);
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error("[Storage] Unexpected error:", err.message);
    const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
    if (!publicBase) {
      console.warn("[Storage] PUBLIC_URL not set — PDF link will be unavailable.");
      return { success: false, error: err.message };
    }
    const fallbackUrl = `${publicBase}/api/notify/pdf/challan/${filename.replace('.pdf', '')}`;
    return { success: true, url: fallbackUrl };
  }
}

module.exports = { uploadPDFAndGetLink };
