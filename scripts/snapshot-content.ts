/**
 * Snapshot the website's static content into this repo.
 *
 *   npm run content:snapshot            (expects the site checked out at ../gilvero)
 *
 * Imports every module in `gilvero/src/content` + `gilvero/src/lib` exactly as the
 * live site uses them and writes:
 *   supabase/seed/content.json   — all exported data, verbatim
 *   supabase/seed/images/*       — the original image files
 *
 * The seed reads only these files, so seeding never depends on hand-copied text.
 * Run with the WEBSITE tsconfig (see package.json) so `@/` resolves to the site.
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const websiteDir = path.resolve(process.env.WEBSITE_DIR ?? "../gilvero");
const outDir = path.resolve("supabase/seed");

const modules = [
  "about",
  "academy",
  "blog",
  "booking",
  "careers",
  "client-area",
  "contact",
  "faq",
  "home",
  "legal",
  "navigation",
  "portfolio",
  "search",
  "services",
  "store",
] as const;

/** Functions can't be serialised — turn known template functions into `{name}` strings. */
function serialise(value: unknown): unknown {
  if (typeof value === "function") {
    return value.length === 1 ? (value as (arg: string) => string)("{name}") : undefined;
  }
  if (Array.isArray(value)) return value.map(serialise);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, v]) => [key, serialise(v)] as const)
        .filter(([, v]) => v !== undefined),
    );
  }
  return value;
}

async function main() {
  const snapshot: Record<string, unknown> = {};

  for (const name of modules) {
    const mod = await import(pathToFileURL(path.join(websiteDir, "src/content", `${name}.ts`)).href);
    snapshot[name] = serialise({ ...mod });
  }

  const { siteConfig } = await import(pathToFileURL(path.join(websiteDir, "src/lib/site-config.ts")).href);
  const { images } = await import(pathToFileURL(path.join(websiteDir, "src/lib/images.ts")).href);
  snapshot["site-config"] = { siteConfig };
  snapshot.images = { images };

  mkdirSync(path.join(outDir, "images"), { recursive: true });
  for (const src of Object.values(images as Record<string, string>)) {
    const file = path.basename(src);
    copyFileSync(path.join(websiteDir, "public", src), path.join(outDir, "images", file));
  }

  writeFileSync(path.join(outDir, "content.json"), JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`✓ Snapshot written: ${modules.length} content modules, ${Object.keys(images).length} images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
