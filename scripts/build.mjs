import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import { validateCatalog } from '../public/catalog.mjs';
const root=new URL('../public/',import.meta.url);
const data=JSON.parse((await readFile(new URL('books.json',root),'utf8')).replace(/^\uFEFF/,''));
validateCatalog(data);
for(const book of data.books){
  for(const item of [...(book.chapters||[]),...(book.downloads||[])]){
    const file=await stat(new URL(item.file,root));
    if(!file.isFile()||!file.size)throw new Error(`${book.id}: ${item.file} 不存在或为空`);
  }
}
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await cp(root,new URL('../dist/',import.meta.url),{recursive:true});
console.log(`Built ${data.books.length} books into dist/`);
