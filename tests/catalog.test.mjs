import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalog,selectBooks,safeUrl} from '../public/catalog.mjs';
const published=JSON.parse((await readFile(new URL('../public/books.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const catalog={version:1,books:[
 {id:'letters',title:'旅途与来信',author:'青叶',description:'测试',tags:['旅行'],status:'planned',updated:'2026-10-30'},
 {id:'rain',title:'雨停之前',author:'南庭',description:'测试',tags:['日常'],status:'planned',updated:'2026-10-29'}
]};
test('published catalog validates and supports an empty shelf',()=>{assert.equal(validateCatalog(published),published);assert.equal(validateCatalog({version:1,books:[]}).books.length,0);});
test('reject duplicate ids and invalid status or unsafe URLs',()=>{for(const change of [b=>b.id='letters',b=>b.status='unknown',b=>b.url='javascript:alert(1)',b=>b.tags=[123]]){const copy=structuredClone(catalog);change(copy.books[1]);assert.throws(()=>validateCatalog(copy));}});
test('search combines tags, local reading status and query',()=>{assert.deepEqual(selectBooks(catalog.books,{query:'  旅途 ',tag:'旅行',status:'reading'},{letters:'reading'}).map(b=>b.id),['letters']);assert.equal(selectBooks(catalog.books,{query:'不存在'}).length,0);assert.equal(selectBooks(catalog.books,{query:'青叶'}).length,1);});
test('sorts without mutating input and respects local finished state',()=>{const before=catalog.books.map(b=>b.id);assert.equal(selectBooks(catalog.books)[0].id,'letters');assert.deepEqual(selectBooks(catalog.books,{status:'finished'},{rain:'finished'}).map(b=>b.id),['rain']);selectBooks(catalog.books,{sort:'title'});assert.deepEqual(catalog.books.map(b=>b.id),before);});
test('links only accept https',()=>{assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('//evil.example'),'');assert.equal(safeUrl('https://example.com/book'),'https://example.com/book');});
