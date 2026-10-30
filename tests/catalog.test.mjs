import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalog,selectBooks,safeUrl,resolveBook,bookFiles} from '../public/catalog.mjs';
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

test('validates chapters and downloads; rejects traversal and active URLs',()=>{
  const good=structuredClone(catalog);
  good.books[0].chapters=[{title:'第一章',file:'files/test/01.txt'}];
  good.books[0].downloads=[{label:'下载 EPUB',file:'files/test/book.epub'}];
  assert.equal(validateCatalog(good),good);
  for(const file of ['../secret.txt','files/../secret.txt','https://example.com/file.txt','javascript:alert(1)','files/%2e%2e/x.txt']){
    const bad=structuredClone(good);bad.books[0].chapters[0].file=file;assert.throws(()=>validateCatalog(bad));
  }
  const bad=structuredClone(good);bad.books[0].chapters[0].file='files/test/book.html';assert.throws(()=>validateCatalog(bad));
});

test('EPUB files use a local epub path',()=>{
  const data=structuredClone(catalog);data.books[0].epub='files/test/book.epub';assert.equal(validateCatalog(data),data);
  for(const file of ['files/test/book.html','https://example.com/book.epub','files/../book.epub']){data.books[0].epub=file;assert.throws(()=>validateCatalog(data));}
});

const seriesCatalog={version:1,books:[{...catalog.books[0],volumes:[
 {id:'v01',title:'第1卷 起点',epub:'files/test/vol01.epub'},
 {id:'v02',title:'第2卷 归途',epub:'files/test/vol02.epub',downloads:[{label:'PDF',file:'files/test/vol02.pdf'}]}
]}]};
test('series has one card and is searchable by volume title',()=>{
 assert.equal(validateCatalog(seriesCatalog),seriesCatalog);
 assert.equal(selectBooks(seriesCatalog.books,{query:'归途'}).length,1);
 assert.equal(resolveBook(seriesCatalog,'letters','v02').epub,'files/test/vol02.epub');
 assert.equal(resolveBook(seriesCatalog,'letters').volumeId,'v01');
 assert.throws(()=>resolveBook(seriesCatalog,'letters','missing'));
 assert.equal(resolveBook(catalog,'letters').title,catalog.books[0].title);
 assert.throws(()=>resolveBook(catalog,'letters','v01'));
 assert.deepEqual(bookFiles(seriesCatalog.books[0]).map(x=>x.file).sort(),['files/test/vol01.epub','files/test/vol02.epub','files/test/vol02.pdf']);
});
test('reject invalid series, repeated volume ids and mixed files',()=>{
 for(const change of [b=>b.volumes=[],b=>b.volumes[1].id='v01',b=>b.volumes[0].epub='../file.epub',b=>b.volumes[0].title='',b=>b.epub='files/book.epub',b=>b.volumes[0].downloads=[{label:'Bad',file:'javascript:alert(1)'}]]){
  const copy=structuredClone(seriesCatalog);change(copy.books[0]);assert.throws(()=>validateCatalog(copy));
 }
});

test('Chinese EPUB filenames and spaces are supported; absolute paths are rejected',()=>{
 const data=structuredClone(catalog);data.books[0].volumes=[{id:'vol01',title:'上卷',epub:'files/紫罗兰/紫罗兰永恒花园 上.epub'}];
 assert.equal(validateCatalog(data),data);
 for(const file of ['D:/files/book.epub','files/紫罗兰/../book.epub','files/紫罗兰/book#x.epub','files/紫罗兰/book?.epub','files/紫罗兰/book%20.epub','files/紫罗兰\\book.epub']){
  data.books[0].volumes[0].epub=file;assert.throws(()=>validateCatalog(data));
 }
 data.books[0].volumes[0].epub='files/紫罗兰/紫罗兰永恒花园 上.epub';data.books[0].id='with space';assert.throws(()=>validateCatalog(data),/id/);
});
