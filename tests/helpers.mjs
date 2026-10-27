// Bundle a TypeScript module from src/ with esbuild so node:test can import it.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const outdir = mkdtempSync(join(tmpdir(), "nimbly-tests-"));

export async function load(entry) {
  const outfile = join(outdir, entry.replace(/[/.]/g, "_") + ".mjs");
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}
