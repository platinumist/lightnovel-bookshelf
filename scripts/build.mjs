import { cp, mkdir, readFile, stat, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateCatalog,bookFiles } from '../public/catalog.mjs';
const root=new URL('../public/',import.meta.url);
const output=new URL('../dist/',import.meta.url);
const data=JSON.parse((await readFile(new URL('books.json',root),'utf8')).replace(/^\uFEFF/,''));
validateCatalog(data);
for(const book of data.books){
  for(const item of bookFiles(book)){
    const file=await stat(new URL(item.file,root));
    if(!file.isFile()||!file.size)throw new Error(`${book.id}: ${item.file} 不存在或为空`);
  }
}
const assets=(await readdir(root)).filter(name=>/\.(?:html|css|js|mjs|json)$/.test(name)).sort();
const hash=createHash('sha256');
for(const name of assets){hash.update(name);hash.update(await readFile(new URL(name,root)));}
const version=hash.digest('hex').slice(0,12);
await mkdir(output,{recursive:true});
await cp(root,output,{recursive:true});
// Keep each HTML entrypoint and its module imports on the same release.
for(const name of assets.filter(name=>/\.(?:html|js|mjs)$/.test(name))){
 const source=await readFile(new URL(name,root),'utf8');
 let versioned=source.replace(/((?:src|href)=["']|(?:from\s*|import\s*)["'])(\.\/[^"'?#]+\.(?:css|js|mjs))(["'])/g,(_,prefix,path,quote)=>prefix+path+'?v='+version+quote);
 versioned=versioned.replace(/(\.\/(?:reader|epub-reader)\.html)\?/g,(_,path)=>path+'?v='+version+'&');
 if(name.endsWith('.html'))versioned=versioned.replace(/href="\.\/"/g,'href="./?v='+version+'"');
 await writeFile(new URL(name,output),versioned);
}
await writeFile(new URL('release.json',output),JSON.stringify({version})+'\n');
console.log(`Built ${data.books.length} books into dist/ (release ${version})`);
