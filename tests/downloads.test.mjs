import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";
const {markdownDownload}=await load("src/page-tools.ts");

test("current-page exports preserve Markdown and Mermaid with revision metadata",()=>{
  const text="# Users\n\n```mermaid\nflowchart LR\n A --> B\n```\n";
  const result=markdownDownload({id:"app/users",title:"Users",revision:{branch:"develop",commit:"abc1234",updatedAt:"2026-11-13"}},text);
  assert.ok(result.startsWith('---\ntitle: "Users"\npage: "app/users"\nbranch: "develop"\n'));
  assert.ok(result.includes('commit: "abc1234"'));
  assert.ok(result.endsWith(text));
});
test("metadata strings are escaped and unknown provenance is not invented",()=>{
  const result=markdownDownload({id:"intro",title:'A "quote"\nand a newline'}, "# Intro");
  assert.ok(result.includes('title: "A \\"quote\\"\\nand a newline"'));
  assert.ok(!result.includes("branch:"));
  assert.ok(!result.includes("commit:"));
});
