import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { archiveCursorAccounts } from "../src/lib/cursor-activity";
const args = process.argv.slice(2);
const index = args.indexOf("--manifest");
try {
  if (index < 0 || !args[index + 1]) throw new Error("Use --manifest .private/cursor/imports.json --reviewed");
  const manifest = z.array(z.object({ email: z.email(), file: z.string(), confirmedOwner: z.literal(true) }).strict()).min(1).max(4).parse(JSON.parse(fs.readFileSync(args[index + 1],"utf8")));
  const privateRoot = path.resolve(".private/cursor") + path.sep;
  const inputs = manifest.map(entry => {
    const file = fs.realpathSync(path.resolve(entry.file));
    if (!file.startsWith(privateRoot) || fs.statSync(file).size > 30 * 1024 * 1024) throw new Error("Cursor exports must remain in the private import folder and below 30 MB");
    return { accountKey:createHash("sha256").update(entry.email.toLowerCase().trim()).digest("hex"), csv:fs.readFileSync(file,"utf8") };
  });
  const archive = archiveCursorAccounts(inputs);
  fs.writeFileSync(".private/cursor/public-preview.json",JSON.stringify(archive,null,2)+"\n",{mode:0o600});
  if (!args.includes("--reviewed")) {console.log("Sanitized Cursor preview saved privately. Review it before passing --reviewed.");}
  else {
    const target = path.resolve("src/data/cursor-history.json");
    fs.writeFileSync(target+".tmp",JSON.stringify(archive,null,2)+"\n",{mode:0o600}); fs.renameSync(target+".tmp",target);
    console.log(`Replaced public Cursor archive: ${archive.recordCount} measured records across ${archive.days.length} dates. Account details and raw exports remain private.`);
  }
} catch { console.error("Cursor import failed; public records were preserved and private input was not logged."); process.exitCode=1; }
