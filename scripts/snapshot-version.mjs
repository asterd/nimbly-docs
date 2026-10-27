#!/usr/bin/env node
/**
 * Freeze the current documentation as a named version.
 *
 * Usage:
 *   node scripts/snapshot-version.mjs <id> [--docs docs] [--label "v1.2"] [--status legacy|current|unreleased]
 *                                          [--current <id>] [--current-label "v2 (latest)"]
 *   npx nimbly-docs-version 1.2 --docs docs
 *
 * Copies <docs>/index.json, <docs>/pages/ and <docs>/assets/ (images only, no
 * bundles) into <docs>/versions/<id>/, then registers the snapshot in the root
 * manifest's "versions" list. The root manifest keeps describing the latest
 * docs; when it has no "versions" yet, a default entry is created for it
 * (`--current` / `--current-label`, default "latest" / "Latest").
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const args = { _: [], docs: "docs", status: "legacy", current: "latest", currentLabel: "Latest" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--docs") args.docs = argv[++i];
    else if (a === "--label") args.label = argv[++i];
    else if (a === "--status") args.status = argv[++i];
    else if (a === "--current") args.current = argv[++i];
    else if (a === "--current-label") args.currentLabel = argv[++i];
    else if (!a.startsWith("--")) args._.push(a);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id || !/^[a-z0-9][a-z0-9._-]{0,31}$/i.test(id)) {
  console.error("Usage: snapshot-version <id> [--docs docs] [--label text] [--status legacy|current|unreleased]");
  process.exit(1);
}
if (!["legacy", "current", "unreleased"].includes(args.status)) {
  console.error(`Unknown status "${args.status}".`);
  process.exit(1);
}

const docs = resolve(args.docs);
const rootPath = join(docs, "index.json");
if (!existsSync(rootPath)) {
  console.error(`No manifest at ${rootPath}.`);
  process.exit(1);
}
const target = join(docs, "versions", id);
if (existsSync(target)) {
  console.error(`${target} already exists; remove it first to re-snapshot.`);
  process.exit(1);
}

const root = JSON.parse(readFileSync(rootPath, "utf8"));

// The snapshot is a plain, unversioned manifest: the version list lives only in the root.
const snapshot = { ...root };
delete snapshot.versions;
if (typeof snapshot.$schema === "string" && snapshot.$schema.startsWith("./")) {
  snapshot.$schema = "../../" + snapshot.$schema.slice(2);
}
mkdirSync(target, { recursive: true });
writeFileSync(join(target, "index.json"), JSON.stringify(snapshot, null, 2) + "\n");
if (existsSync(join(docs, "pages"))) cpSync(join(docs, "pages"), join(target, "pages"), { recursive: true });
if (existsSync(join(docs, "assets"))) {
  cpSync(join(docs, "assets"), join(target, "assets"), {
    recursive: true,
    filter: (src) => !/\.(m?js|map|sha384)$/.test(src),
  });
}

const versions = Array.isArray(root.versions) ? root.versions : [];
if (!versions.some((v) => v && v.manifest === undefined)) {
  versions.unshift({ id: args.current, label: args.currentLabel, status: "current" });
}
const entry = { id, label: args.label ?? `v${id}`, manifest: `./versions/${id}/index.json`, status: args.status };
const defaultAt = versions.findIndex((v) => v && v.manifest === undefined);
versions.splice(defaultAt + 1, 0, entry);
root.versions = versions;
writeFileSync(rootPath, JSON.stringify(root, null, 2) + "\n");

console.log(`✔ snapshot written to ${target}`);
console.log(`✔ registered version "${id}" in ${rootPath}`);
