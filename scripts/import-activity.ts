import fs from "node:fs";
import path from "node:path";
import { normalizeImport, parseCsv } from "../src/lib/activity-import";

const args = process.argv.slice(2);
function arg(name: string) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
try {
  const input = arg("--input");
  if (!input) throw new Error("Usage: npm run activity:import -- --input .private/usage.json --reviewed [--dry-run]. CSV also requires --metadata .private/coverage.json");
  const inputPath = path.resolve(input);
  const publicDir = path.resolve("public");
  if (inputPath === publicDir || inputPath.startsWith(publicDir + path.sep)) throw new Error("Raw activity imports must not be stored under public/");
  if (fs.statSync(inputPath).size > 10 * 1024 * 1024) throw new Error("Import exceeds 10 MB");
  let data: unknown;
  if (inputPath.toLowerCase().endsWith(".csv")) {
    const metadata = arg("--metadata");
    if (!metadata) throw new Error("CSV requires --metadata with version, timezone, and coverage");
    data = { ...JSON.parse(fs.readFileSync(metadata, "utf8")), records: parseCsv(fs.readFileSync(inputPath, "utf8")) };
  } else data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const normalized = normalizeImport(data);
  if (!args.includes("--reviewed") && !args.includes("--dry-run")) throw new Error("Review provenance and public daily/provider aggregates, then explicitly pass --reviewed");
  normalized.metadata.verified = true;
  if (args.includes("--dry-run")) { console.log(`Valid: ${normalized.days.length} days. No files written.`); }
  else {
    const target = path.resolve("src/data/activity.json");
    const temporary = target + ".tmp";
    fs.writeFileSync(temporary, JSON.stringify(normalized, null, 2) + "\n", { mode: 0o600 });
    fs.renameSync(temporary, target);
    console.log(`Replaced public daily aggregates: ${normalized.days.length} days. Raw input was not copied.`);
  }
} catch (error) { console.error(error instanceof Error ? error.message : "Import failed"); process.exitCode = 1; }
