export const statuses = {planned:'想读', reading:'在读', finished:'读完'};
export function validateCatalog(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.books)) throw new Error('书目格式无效：需要 version: 1 和 books 数组。');
  const ids = new Set();
  for (const book of data.books) {
    if (!book || typeof book.id !== 'string' || !/^[a-z0-9_-]+$/i.test(book.id) || ids.has(book.id)) throw new Error('每本书需要唯一的英文或数字 id。');
    ids.add(book.id);
    for (const field of ['title','author','description']) if (typeof book[field] !== 'string' || !book[field].trim()) throw new Error(`${book.id} 缺少 ${field}。`);
    if (!Object.hasOwn(statuses, book.status) || !Array.isArray(book.tags) || book.tags.some(t => typeof t !== 'string')) throw new Error(`${book.id} 的状态或标签无效。`);
    if (typeof book.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(book.updated) || !Number.isFinite(Date.parse(book.updated))) throw new Error(`${book.id} 的更新日期无效。`);
    for (const field of ['url','cover']) if (book[field] != null && (typeof book[field] !== 'string' || (book[field] && !safeUrl(book[field])))) throw new Error(`${book.id} 的 ${field} 必须为 HTTPS 链接。`);
    if(book.volumes != null){
      if(!Array.isArray(book.volumes)||book.volumes.length===0)throw new Error(book.id+' 的分卷不能为空。');
      if(book.epub || book.chapters?.length || book.downloads?.length)throw new Error(book.id+' 请将文件配置放入各分卷。');
      const volumeIds=new Set();
      for(const volume of book.volumes){
        if(!volume || typeof volume.id!=='string' || !/^[a-z0-9_-]+$/i.test(volume.id) || volumeIds.has(volume.id))throw new Error(book.id+' 的分卷 id 必须唯一。');
        volumeIds.add(volume.id);
        if(typeof volume.title!=='string' || !volume.title.trim() || !safeFile(volume.epub) || !volume.epub.endsWith('.epub'))throw new Error(book.id+' 的分卷需要标题和 EPUB 文件。');
        if(volume.downloads != null && (!Array.isArray(volume.downloads) || volume.downloads.some(d=>!d || typeof d.label!=='string' || !d.label.trim() || !safeFile(d.file))))throw new Error(book.id+' 的分卷下载配置无效。');
      }
    }
    if(book.epub != null && (!safeFile(book.epub) || !book.epub.endsWith('.epub'))) throw new Error(book.id+' 的 EPUB 路径无效。');
    if(book.chapters != null && (!Array.isArray(book.chapters) || book.chapters.some(c => !c || typeof c.title !== 'string' || !c.title.trim() || !safeFile(c.file) || !c.file.endsWith('.txt')))) throw new Error(book.id+' 的章节需要标题和本地 TXT 文件。');
    if(book.downloads != null && (!Array.isArray(book.downloads) || book.downloads.some(d => !d || typeof d.label !== 'string' || !d.label.trim() || !safeFile(d.file)))) throw new Error(book.id+' 的下载配置无效。');
  }
  return data;
}
export function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } }
export function selectBooks(books, {query='',status='all',tag='all',sort='updated'}={}, overrides={}) {
  const q = query.trim().toLocaleLowerCase();
  return books.filter(b => (status === 'all' || (overrides[b.id] || b.status) === status) && (tag === 'all' || b.tags.includes(tag)) && [b.title,b.author,...b.tags,...(b.volumes||[]).map(v=>v.title)].join(' ').toLocaleLowerCase().includes(q)).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title,'zh-CN') : b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title,'zh-CN'));
}

export function safeFile(value) { return typeof value === 'string' && /^files\/[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/.test(value) && !value.split('/').includes('..'); }


export function resolveBook(data,bookId,volumeId=null){
  const book=data.books.find(b=>b.id===bookId);
  if(!book)throw new Error('没有找到这本书，请返回书架重新选择。');
  if(book.volumes){
    const volume=volumeId?book.volumes.find(v=>v.id===volumeId):book.volumes[0];
    if(!volume)throw new Error('没有找到这一卷，请返回书架重新选择。');
    return {...book,...volume,id:book.id,title:book.title+' · '+volume.title,seriesTitle:book.title,volumeId:volume.id};
  }
  if(volumeId)throw new Error('这本书没有分卷，请返回书架重新选择。');
  return book;
}
export function bookFiles(book){
  const items=[...(book.chapters||[]),...(book.downloads||[]),...(book.epub?[{file:book.epub}]:[])];
  for(const volume of book.volumes||[])items.push(...bookFiles(volume));
  return items;
}
