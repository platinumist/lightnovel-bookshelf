import {statuses, validateCatalog, selectBooks, safeUrl} from './catalog.mjs';
const $ = id => document.getElementById(id);
const key = 'platinumist.bookshelf.status.v1';
const colors = ['#dce3d0','#e8dfcd','#d6e1df','#e5d8ce','#dde0ea','#e4e3cd'];
let books = [], overrides = {}, filter = {query:'',status:'all',tag:'all',sort:'updated'}, storageAvailable = true;
try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) overrides = Object.fromEntries(Object.entries(saved).filter(([,s]) => Object.hasOwn(statuses,s))); } catch { storageAvailable = false; }
function node(tag, text, className) { const el=document.createElement(tag); if(text) el.textContent=text; if(className) el.className=className; return el; }
function statusOf(b) { return overrides[b.id] || b.status; }
function render() {
  $('total').textContent=books.length;
  $('reading').textContent=books.filter(b=>statusOf(b)==='reading').length;
  $('finished').textContent=books.filter(b=>statusOf(b)==='finished').length;
  const visible=selectBooks(books,filter,overrides);
  $('count').textContent=`${visible.length} / ${books.length}`;
  $('grid').replaceChildren(); $('empty').hidden=visible.length>0;
  visible.forEach(b=>{
    const card=node('button',null,'book'); card.type='button'; card.setAttribute('aria-label',`查看《${b.title}》详情`);
    const cover=node('div',null,'cover'); cover.style.setProperty('--cover',colors[books.indexOf(b)%colors.length]);
    cover.append(node('span','LIGHT NOVEL / '+String(books.indexOf(b)+1).padStart(2,'0'),'series'),node('span',b.title,'cover-title'),node('span',b.author,'cover-bottom'));
    if(b.cover && safeUrl(b.cover)){const img=node('img');img.src=b.cover;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>img.remove());cover.append(img);}
    const meta=node('div',null,'book-meta');meta.append(node('span',statuses[statusOf(b)],'badge'),node('span',b.tags.slice(0,2).join(' / '),'tags'));
    card.append(cover,node('h3',b.title),node('p',b.author,'author'),meta);card.addEventListener('click',()=>showDetails(b));$('grid').append(card);
  });
}
function showDetails(b) {
  const area=$('detail-content'); area.replaceChildren();
  area.append(node('div',b.tags.join(' / '),'eyebrow'),node('h2',b.title),node('p',b.author+' · 更新于 '+b.updated),node('p',b.description));
  const label=node('label','我的阅读状态'); const select=node('select'); select.setAttribute('aria-label','我的阅读状态');
  for(const [value,text] of Object.entries(statuses)){const option=node('option',text);option.value=value;select.append(option);}select.value=statusOf(b);
  const feedback=node('p',storageAvailable?'阅读状态仅保存在当前浏览器，不会修改 GitHub 书目。':'当前浏览器无法读取存储，状态可能只在本次打开期间保留。');
  select.addEventListener('change',()=>{overrides[b.id]=select.value;try{localStorage.setItem(key,JSON.stringify(overrides));feedback.textContent='已保存在当前浏览器。';}catch{feedback.textContent='浏览器存储不可用，本次状态仅在页面关闭前保留。';}render();});
  label.append(select);area.append(label,feedback);
  if(b.url && safeUrl(b.url)){const link=node('a','查看作品来源 ↗','source-link');link.href=b.url;link.target='_blank';link.rel='noopener noreferrer';area.append(link);}
  $('details').showModal();
}
async function load(){
  $('retry').hidden=true;$('notice').textContent='正在打开书架…';
  try {const response=await fetch('./books.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error(`加载失败（${response.status}）`);const data=validateCatalog(await response.json());books=data.books;
    $('tag').replaceChildren(new Option('全部题材','all'));[...new Set(books.flatMap(b=>b.tags))].sort((a,b)=>a.localeCompare(b,'zh-CN')).forEach(t=>$('tag').append(new Option(t,t)));
    $('notice').textContent=data.demo?'示例书架 · 以下为原创演示书目。请在 GitHub 替换 books.json，开始收藏你自己的故事。':'书目随 GitHub 发布更新 · 阅读状态保存在当前浏览器。';render();
  }catch(error){$('notice').textContent=`无法加载书架。${error.message} 请检查网络或书目文件，然后重试。`;$('retry').hidden=false;}
}
$('search').addEventListener('input',e=>{filter.query=e.target.value;render();});
$('sort').addEventListener('change',e=>{filter.sort=e.target.value;render();});
$('tag').addEventListener('change',e=>{filter.tag=e.target.value;render();});
$('statuses').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filter.status=b.dataset.status;for(const item of $('statuses').children)item.setAttribute('aria-pressed',String(item===b));render();});
$('reset').addEventListener('click',()=>{filter={query:'',status:'all',tag:'all',sort:'updated'};$('search').value='';$('tag').value='all';$('sort').value='updated';for(const item of $('statuses').children)item.setAttribute('aria-pressed',String(item.dataset.status==='all'));render();});
$('close').addEventListener('click',()=>$('details').close());
$('details').addEventListener('click',e=>{if(e.target===$('details')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('retry').addEventListener('click',load);load();
