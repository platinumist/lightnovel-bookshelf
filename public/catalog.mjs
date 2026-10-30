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
  }
  return data;
}
export function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } }
export function selectBooks(books, {query='',status='all',tag='all',sort='updated'}={}, overrides={}) {
  const q = query.trim().toLocaleLowerCase();
  return books.filter(b => (status === 'all' || (overrides[b.id] || b.status) === status) && (tag === 'all' || b.tags.includes(tag)) && [b.title,b.author,...b.tags].join(' ').toLocaleLowerCase().includes(q)).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title,'zh-CN') : b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title,'zh-CN'));
}
