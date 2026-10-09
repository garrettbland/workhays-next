/**
 * Uploads legacy employer images to Supabase Storage (bucket "public-assets", path legacy/<file>).
 *
 * 1. On the old server:  tar czf ~/uploads.tgz -C /path/to/workhays/public uploads/employers
 * 2. Copy it down and extract:  tar xzf uploads.tgz   (creates ./uploads/employers)
 * 3. Run:
 *    NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... \
 *    npx tsx scripts/migrate-legacy/upload-logos.ts ./uploads/employers
 *
 * Only files referenced by a migrated employer are uploaded; references to missing files are cleared.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error("Usage: upload-logos.ts <path to uploads/employers>");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

const MIME: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
};

async function main() {
  const { data: employers, error } = await supabase
    .from("employers")
    .select("id, logo_path, header_image_path")
    .or("logo_path.like.legacy/%,header_image_path.like.legacy/%");
  if (error) throw error;

  let uploaded = 0;
  let missing = 0;
  for (const e of employers ?? []) {
    for (const col of ["logo_path", "header_image_path"] as const) {
      const p = e[col] as string | null;
      if (!p?.startsWith("legacy/")) continue;
      const file = path.join(dir, p.slice("legacy/".length));
      const type = MIME[path.extname(file).toLowerCase()];
      if (!fs.existsSync(file) || !type) {
        missing++;
        await supabase.from("employers").update({ [col]: null }).eq("id", e.id);
        continue;
      }
      const { error: upErr } = await supabase.storage
        .from("public-assets")
        .upload(p, fs.readFileSync(file), { contentType: type, upsert: true });
      if (upErr) throw upErr;
      uploaded++;
    }
  }
  console.log({ uploaded, missingCleared: missing });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
