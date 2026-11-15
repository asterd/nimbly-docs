import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const {ThemeManager}=await load("src/theme.ts");
function setup(saved={}){
  const values=new Map(Object.entries(saved));
  globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  globalThis.window={matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
  const attrs=new Map();
  const host={setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),style:{removeProperty(){},setProperty(){}}};
  const manifest={theme:"nimbus",appearance:"light",themes:new Map()};
  return {manager:new ThemeManager(host,manifest,()=>{}),values};
}
test("saved palette and appearance take precedence over manifest defaults",()=>{
  const {manager}=setup({"nimbly-docs:theme":"paper","nimbly-docs:appearance":"dark"});
  const result=manager.initialize(null,null);
  assert.equal(result.theme,"paper");
  assert.equal(result.appearance,"dark");
});
test("explicit attributes retain precedence over saved preferences",()=>{
  const {manager}=setup({"nimbly-docs:theme":"paper","nimbly-docs:appearance":"dark"});
  assert.deepEqual(manager.initialize("sabbia","light"),{theme:"sabbia",appearance:"light",scheme:"light"});
});
test("switching a palette persists it independently from appearance",()=>{
  const {manager,values}=setup();
  manager.initialize(null,null);
  manager.setAppearance("dark");manager.setTheme("evergreen");
  assert.equal(values.get("nimbly-docs:theme"),"evergreen");
  assert.equal(values.get("nimbly-docs:appearance"),"dark");
});
