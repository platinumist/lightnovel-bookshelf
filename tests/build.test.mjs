import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
test('built pages and module imports use one release version',async()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:new URL('../',import.meta.url)});
 const root=new URL('../dist/',import.meta.url);
 const {version}=JSON.parse(await readFile(new URL('release.json',root),'utf8'));
 for(const name of ['index.html','reader.html','epub-reader.html']){
  const source=await readFile(new URL(name,root),'utf8');
  const urls=[...source.matchAll(/(?:src|href)=["'](\.\/[^"']+\.(?:css|js|mjs)(?:\?[^"']*)?)["']/g)];
  assert.ok(urls.length>0);
  for(const [,url] of urls)assert.ok(url.endsWith('?v='+version),`${name}: ${url}`);
 }
 for(const name of ['app.js','reader.js','epub-reader.js']){
  const source=await readFile(new URL(name,root),'utf8');
  assert.ok(source.includes(`from './catalog.mjs?v=${version}'`),name);
 }
});
