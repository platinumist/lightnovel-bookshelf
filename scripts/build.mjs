import { cp, mkdir, readFile } from 'node:fs/promises';
import { validateCatalog } from '../public/catalog.mjs';
const data=JSON.parse((await readFile(new URL('../public/books.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
validateCatalog(data);
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await cp(new URL('../public/',import.meta.url),new URL('../dist/',import.meta.url),{recursive:true});
console.log(`Built ${data.books.length} books into dist/`);
