import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { normalizeManifest } = await load("src/manifest.ts");
const base = { version: "1.0", title: "T", sections: [{ id: "s", title: "S", pages: [{ id: "p", title: "P", source: "p.md" }] }] };
const url = "https://docs.example.com/index.json";

test("versions resolve relative to the root manifest", () => {
  const m = normalizeManifest({ ...base, versions: [
    { id: "2.x", label: "v2", status: "current" },
    { id: "1.x", manifest: "./versions/1.x/index.json", status: "legacy" },
  ] }, url);
  assert.equal(m.versions.length, 2);
  assert.equal(m.versions[0].isDefault, true);
  assert.equal(m.versions[1].manifestUrl, "https://docs.example.com/versions/1.x/index.json");
  assert.equal(m.versions[1].label, "1.x");
});

test("versions require exactly one default entry", () => {
  assert.throws(() => normalizeManifest({ ...base, versions: [{ id: "a", manifest: "a.json" }] }, url), /exactly one/);
});

test("version ids and manifest URLs are validated", () => {
  assert.throws(() => normalizeManifest({ ...base, versions: [{ id: "../x" }] }, url), /invalid/);
  assert.throws(() => normalizeManifest({ ...base, versions: [{ id: "a" }, { id: "b", manifest: "javascript:alert(1)" }] }, url), /not allowed/);
});

test("unversioned manifests expose an empty list", () => {
  assert.deepEqual(normalizeManifest(base, url).versions, []);
});

test("existing string badges and default source-download behavior remain compatible", () => {
  const m = normalizeManifest({...base, sections:[{id:"s",title:"S",pages:[{id:"p",title:"P",source:"p.md",badge:"beta"}]}]},url);
  assert.equal(m.pages.get("p").badge, "beta");
  assert.deepEqual(m.pages.get("p").attachments, []);
  assert.equal(m.features.sourceDownload, false);
});

test("nested navigation preserves every breadcrumb and a stable flat page order", () => {
  const m = normalizeManifest({...base,sections:[{id:"product",title:"Product",sections:[
    {id:"reference",title:"Reference",sections:[{id:"db",title:"Database",sections:[
      {id:"identity",title:"Identity",pages:[{id:"users",title:"Users",source:"users.md"}]},
    ]}]},
  ]}]},url);
  assert.deepEqual(m.pages.get("users").sectionPath,["Product","Reference","Database","Identity"]);
  assert.deepEqual(m.order.map(p=>p.id),["users"]);
});

test("the depth bound accepts four nested levels and rejects a deeper tree", () => {
  const section = depth => depth === 0 ? {id:"leaf",title:"Leaf",pages:[{id:"p",title:"P",source:"p.md"}]}
    : {id:"level-"+depth,title:"Level "+depth,sections:[section(depth-1)]};
  assert.equal(normalizeManifest({...base,sections:[section(4)]},url).pages.size,1);
  assert.throws(()=>normalizeManifest({...base,sections:[section(5)]},url),/nests too deeply/);
});

test("empty sections arrays at the maximum depth are accepted", () => {
  let s = {id:"leaf",title:"Leaf",pages:base.sections[0].pages,sections:[]};
  for(let i=0;i<4;i++)s={id:"s"+i,title:"S"+i,sections:[s]};
  assert.equal(normalizeManifest({...base,sections:[s]},url).pages.size,1);
});

test("downloads inherit from sections, resolve catalog ids and deduplicate by URL", () => {
  const m = normalizeManifest({...base,attachments:[
    {id:"manual",label:"Manual",url:"./files/manual.md",group:"Project",bytes:1024},
  ],sections:[{id:"s",title:"S",attachments:["manual"],sections:[
    {id:"db",title:"DB",pages:[{id:"p",title:"P",source:"p.md",attachments:[
      {label:"Updated label",url:"./files/manual.md",download:"manual.md"},
      {label:"Schema",url:"./files/schema.json",mediaType:"application/json"},
    ]}]},
  ]}]},url);
  const files=m.pages.get("p").attachments;
  assert.equal(files.length,2);
  assert.equal(files[0].label,"Updated label");
  assert.equal(files[0].url,"https://docs.example.com/files/manual.md");
  assert.equal(files[0].download,"manual.md");
  assert.equal(files[1].mediaType,"application/json");
});

test("attachment labels, descriptions, groups and explicit badges are localized", () => {
  const m=normalizeManifest({...base,language:"en",attachments:[
    {id:"a",label:{en:"Manual",it:"Manuale"},description:{en:"Complete",it:"Completo"},group:{en:"Project",it:"Progetto"},url:"a.md"},
  ],sections:[{id:"s",title:"S",attachments:["a"],pages:[{id:"p",title:"P",source:"p.md",badge:{label:{en:"Develop",it:"Sviluppo"},tone:"warning"}}]}]},url,"it");
  assert.equal(m.pages.get("p").attachments[0].label,"Manuale");
  assert.equal(m.pages.get("p").attachments[0].description,"Completo");
  assert.equal(m.pages.get("p").attachments[0].group,"Progetto");
  assert.deepEqual(m.pages.get("p").badge,{label:"Sviluppo",tone:"warning"});
});

test("attachments reject executable schemes, credentials and authentication queries", () => {
  for(const target of ["javascript:alert(1)","data:text/plain,hello","file:///tmp/a","https://user:pass@example.com/a","https://example.com/a?token=x"]){
    assert.throws(()=>normalizeManifest({...base,attachments:[{id:"a",label:"A",url:target}]},url),/http\(s\)|credentials|auth query/);
  }
});

test("attachment catalog references and download metadata are validated", () => {
  assert.throws(()=>normalizeManifest({...base,sections:[{...base.sections[0],attachments:["missing"]}]},url),/unknown attachment/);
  for(const bad of [{bytes:-1},{bytes:0.5},{download:"../x.md"},{download:"dir\\x.md"},{download:"x\nx.md"}]){
    assert.throws(()=>normalizeManifest({...base,attachments:[{id:"a",label:"A",url:"a.md",...bad}]},url),/attachment/);
  }
  assert.throws(()=>normalizeManifest({...base,attachments:[{label:"A",url:"a.md"}]},url),/ids/);
  assert.throws(()=>normalizeManifest({...base,attachments:[{id:"a",label:"A",url:"a.md"},{id:"a",label:"B",url:"b.md"}]},url),/unique/);
});

test("revisions inherit and page-level fields override without altering their siblings", () => {
  const m=normalizeManifest({...base,sections:[{id:"s",title:"S",revision:{branch:"develop",branchTone:"warning",commit:"abc1234",updatedAt:"2026-11-13"},pages:[
    {id:"p",title:"P",source:"p.md",revision:{source:"models/users.py",status:{label:"Review",tone:"warning"}}},
    {id:"other",title:"Other",source:"other.md"},
  ]}]},url);
  assert.equal(m.pages.get("p").revision.branch,"develop");
  assert.equal(m.pages.get("p").revision.source,"models/users.py");
  assert.equal(m.pages.get("other").revision.source,undefined);
  assert.equal(m.pages.get("p").revision.status.tone,"warning");
});

test("invalid badge tones and revision dates fail validation", () => {
  assert.throws(()=>normalizeManifest({...base,sections:[{...base.sections[0],revision:{updatedAt:"invalid"}}]},url),/valid date/);
  assert.throws(()=>normalizeManifest({...base,sections:[{...base.sections[0],revision:{branchTone:"purple"}}]},url),/branchTone/);
  assert.throws(()=>normalizeManifest({...base,sections:[{...base.sections[0],pages:[{id:"p",title:"P",source:"p.md",badge:{label:"X",tone:"purple"}}]}]},url),/tone/);
});
