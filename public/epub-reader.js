import {validateCatalog,resolveBook} from './catalog.mjs';
const $=id=>document.getElementById(id);
const bookId=new URLSearchParams(location.search).get('book');
const volumeId=new URLSearchParams(location.search).get('volume');
let positionKey='platinumist.epub.position.'+bookId;
let ebook,rendition,toc=[],loading=false,ready=false,lastLocation,source,storageOK=true;
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{storageOK=false;return null;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{storageOK=false;}}
const settings=read('platinumist.reader.settings')||{};
if([18,20,24].includes(settings.font))$('font-size').value=String(settings.font);
if(settings.night===true)document.body.classList.add('night');
function theme(){const night=document.body.classList.contains('night');$('theme').textContent=night?'日间':'夜间';$('theme').setAttribute('aria-pressed',String(night));if(rendition){rendition.themes.default({'body':{'color':(night?'#ced8e5':'#263d5b')+' !important','background':(night?'#142032':'#f5f8fc')+' !important','line-height':'1.9 !important','padding':'0 12px !important'},'h1':{'font-size':'1.4em !important','line-height':'1.6 !important'},'h2':{'font-size':'1.2em !important','line-height':'1.6 !important'},'a':{'color':(night?'#92bdf0':'#2865ad')+' !important'},'img':{'max-width':'100% !important','height':'auto'},'p':{'line-height':'1.9 !important'}});rendition.themes.fontSize($('font-size').value+'px');}}
function preferences(){save('platinumist.reader.settings',{font:Number($('font-size').value),night:document.body.classList.contains('night')});theme();}
$('theme').addEventListener('click',()=>{document.body.classList.toggle('night');preferences();});$('font-size').addEventListener('change',preferences);theme();
function flatten(items,depth=0){return items.flatMap(item=>[{href:item.href,label:'　'.repeat(depth)+item.label.trim()},...flatten(item.subitems||[],depth+1)]);}
function controls(){const location=rendition?.currentLocation();$('prev').disabled=!ready||loading||!!location?.atStart;$('next').disabled=!ready||loading||!!location?.atEnd;}
function error(message){$('message').hidden=false;$('message').textContent=message;$('retry').hidden=false;}
async function move(target){if(!ready||loading)return;loading=true;controls();try{if(target==='next')await rendition.next();else if(target==='prev')await rendition.prev();else await rendition.display(target);}catch{error('翻页失败，请重试或下载原文件阅读。');}finally{loading=false;controls();}}
function keydown(e){if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();move('next');}if(e.key==='ArrowLeft'){e.preventDefault();move('prev');}}
$('prev').addEventListener('click',()=>move('prev'));$('next').addEventListener('click',()=>move('next'));$('chapters').addEventListener('change',e=>move(e.target.value));addEventListener('keydown',keydown);
async function init(){
  ready=false;loading=true;controls();$('retry').hidden=true;$('message').hidden=false;$('message').textContent='正在打开 EPUB…';$('chapters').disabled=true;
  let watchdog;
  try{
    rendition?.destroy();ebook?.destroy();$('viewer').replaceChildren();
    const response=await fetch('./books.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('书目加载失败');
    const data=validateCatalog(await response.json());source=resolveBook(data,bookId,volumeId);
    positionKey='platinumist.epub.position.'+bookId+(source.volumeId?'.'+source.volumeId:'');
    const series=data.books.find(b=>b.id===bookId);
    $('volumes').hidden=$('volume-label').hidden=!series.volumes;
    if(series.volumes){$('volumes').replaceChildren(...series.volumes.map(v=>new Option(v.title,v.id)));$('volumes').value=source.volumeId;}
    if(!source?.epub)throw new Error('没有找到 EPUB 文件，请返回书架重新选择。');
    $('book-title').textContent=source.title;document.title=source.title+' · 在线阅读';$('download').href='./'+source.epub;$('download').hidden=false;$('download').download=source.epub.split('/').pop();
    const file=await fetch('./'+source.epub,{signal:AbortSignal.timeout(60000)});if(!file.ok)throw new Error('EPUB 文件加载失败（'+file.status+'）');
    const buffer=await file.arrayBuffer();
    if(typeof window.ePub!=='function')throw new Error('阅读器加载失败，请刷新重试。');
    ebook=window.ePub();
    // Stop a malformed archive from leaving the reader in a permanent loading state.
    await Promise.race([ebook.open(buffer,'binary'),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(new Error('EPUB 解析超时，请下载原文件检查。')),30000);})]);clearTimeout(watchdog);
    rendition=ebook.renderTo('viewer',{width:'100%',height:'100%',spread:'none',flow:'paginated',allowScriptedContent:false});
    theme();
    rendition.on('keydown',keydown);
    rendition.on('relocated',location=>{lastLocation=location;save(positionKey,{file:source.epub,cfi:location.start.cfi});$('progress').textContent=storageOK?'进度已保存':'浏览器无法保存进度';const href=location.start.href;const selected=toc.find(c=>c.href.split('#')[0]===href.split('#')[0]);if(selected)$('chapters').value=selected.href;$('page-info').textContent=location.atEnd?'已到末页':'本章第 '+location.start.displayed.page+' / '+location.start.displayed.total+' 页';controls();});
    const navigation=await ebook.loaded.navigation;toc=flatten(navigation.toc||[]);
    if(!toc.length)toc=ebook.spine.spineItems.filter(s=>s.linear!=='no').map((s,i)=>({href:s.href,label:'第 '+(i+1)+' 节'}));
    $('chapters').replaceChildren(...toc.map(c=>new Option(c.label,c.href)));$('chapters').disabled=toc.length===0;
    const saved=read(positionKey);try{await rendition.display(saved?.file===source.epub?saved.cfi:undefined);}catch{await rendition.display();}
    ready=true;loading=false;$('message').hidden=true;controls();
  }catch(err){clearTimeout(watchdog);loading=false;ready=false;error(err.name==='TimeoutError'?'文件加载超时，请重试。':err.message);controls();}
}
$('volumes').addEventListener('change',e=>{location.href='./epub-reader.html?book='+encodeURIComponent(bookId)+'&volume='+encodeURIComponent(e.target.value);});
$('retry').addEventListener('click',init);init();
