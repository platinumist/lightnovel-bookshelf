import {validateCatalog,resolveBook} from './catalog.mjs';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const bookId=params.get('book');
const positionKey='platinumist.reader.v1.'+bookId;
let book, current=0, loaded=false, request=0, controller, bookmark={}, storageOK=true, timer;
function readSaved(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{storageOK=false;return null;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{storageOK=false;return false;}}
const settings=readSaved('platinumist.reader.settings')||{};
if([18,20,24].includes(settings.font))$('font-size').value=String(settings.font);
if(settings.night===true)document.body.classList.add('night');
function applySettings(){document.documentElement.style.setProperty('--font-size',$('font-size').value+'px');const night=document.body.classList.contains('night');$('theme').textContent=night?'日间':'夜间';$('theme').setAttribute('aria-pressed',String(night));}
applySettings();
function persistSettings(){save('platinumist.reader.settings',{font:Number($('font-size').value),night:document.body.classList.contains('night')});}
$('font-size').addEventListener('change',()=>{applySettings();persistSettings();});
$('theme').addEventListener('click',()=>{document.body.classList.toggle('night');applySettings();persistSettings();});
function storePosition(){if(!loaded||!book)return;const height=document.documentElement.scrollHeight-innerHeight;bookmark={file:book.chapters[current].file,ratio:height>0?Math.min(1,Math.max(0,scrollY/height)):0};save(positionKey,bookmark);$('progress').textContent=storageOK?'进度已保存':'浏览器无法保存进度';}
function controls(){const disabled=!loaded;$('prev').disabled=disabled||current===0;$('next').disabled=disabled||current===book.chapters.length-1;}
async function chapter(index,restore=false){
  if(!book||index<0||index>=book.chapters.length)return;
  clearTimeout(timer);if(loaded)storePosition();loaded=false;current=index;
  const id=++request;controller?.abort();controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  $('article').hidden=true;$('message').hidden=false;$('message').textContent='正在加载正文…';$('retry').hidden=true;controls();$('chapters').value=String(index);
  const url=new URL(location.href);url.searchParams.set('chapter',String(index+1));history.replaceState(null,'',url);
  try{
    const response=await fetch('./'+book.chapters[index].file,{signal:controller.signal});
    if(!response.ok)throw new Error('正文加载失败（'+response.status+'）');
    const text=await response.text();if(id!==request)return;
    if(!text.trim())throw new Error('正文文件为空');
    $('chapter-title').textContent=book.chapters[index].title;
    $('content').replaceChildren();
    const paragraphs=text.replace(/^\uFEFF/,'').trim().split(/\r?\n\s*\r?\n/);
    if(paragraphs[0]?.trim()===book.chapters[index].title)paragraphs.shift();
    for(const paragraph of paragraphs){const p=document.createElement('p');p.textContent=paragraph;$('content').append(p);}
    $('article').hidden=false;$('message').hidden=true;$('chapter-count').textContent=(index+1)+' / '+book.chapters.length;
    document.title=book.chapters[index].title+' · '+book.title;
    const ratio=restore&&Number.isFinite(bookmark.ratio)?Math.min(1,Math.max(0,bookmark.ratio)):0;
    requestAnimationFrame(()=>{if(id!==request)return;scrollTo(0,ratio*(document.documentElement.scrollHeight-innerHeight));loaded=true;controls();storePosition();});
  }catch(error){if(id!==request)return;$('message').textContent=error.name==='AbortError'?'加载超时，请重试。':error.message;$('retry').hidden=false;}
  finally{clearTimeout(timeout);}
}
async function init(){
  try{
    const response=await fetch('./books.json',{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('书目加载失败');
    const data=validateCatalog(await response.json());book=resolveBook(data,bookId,params.get('volume'));
    if(!book)throw new Error('没有找到这本书，请返回书架重新选择。');
    if(book.epub){location.replace('./epub-reader.html?book='+encodeURIComponent(book.id)+(book.volumeId?'&volume='+encodeURIComponent(book.volumeId):''));return;}
    if(!book.chapters?.length)throw new Error('这本书还没有上传正文。');
    $('book-title').textContent=book.title;
    $('chapters').replaceChildren(...book.chapters.map((c,i)=>new Option(c.title,String(i))));$('chapters').disabled=false;
    bookmark=readSaved(positionKey)||{};
    const explicit=params.get('chapter');const requested=Number(explicit)-1;
    const saved=book.chapters.findIndex(c=>c.file===bookmark.file);
    const index=explicit!==null&&Number.isInteger(requested)&&requested>=0&&requested<book.chapters.length?requested:saved>=0?saved:0;
    await chapter(index,explicit===null || (saved===index));
  }catch(error){$('message').textContent=error.name==='TimeoutError'?'加载超时，请重试。':error.message;$('retry').hidden=false;}
}
$('retry').addEventListener('click',()=>book?.chapters?.length?chapter(current):init());
$('chapters').addEventListener('change',e=>chapter(Number(e.target.value)));
$('prev').addEventListener('click',()=>chapter(current-1));$('next').addEventListener('click',()=>chapter(current+1));
addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(storePosition,250);},{passive:true});
addEventListener('pagehide',storePosition);document.addEventListener('visibilitychange',()=>{if(document.hidden)storePosition();});
init();
