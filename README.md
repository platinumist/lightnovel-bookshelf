# 轻小说书架

网站：https://platinumist.github.io/lightnovel-bookshelf/

个人轻小说书架，蓝色界面。支持 EPUB 在线阅读和原文件下载，使用 GitHub Pages 发布。

## 上传 EPUB

1. 把 EPUB 放入 `public/files/`，例如 `public/files/my-book/book.epub`。
2. 在 `public/books.json` 添加书目：

```json
{
  "id": "my-book",
  "title": "书名",
  "author": "作者",
  "description": "简介",
  "tags": ["奇幻"],
  "status": "planned",
  "updated": "2026-10-30",
  "epub": "files/my-book/book.epub"
}
```

3. 用真实书目替换示例后，将文件顶部的 `demo` 改为 `false`。
4. 提交到 `main`，等待 GitHub Actions 发布。

EPUB 不需要解压或拆章。阅读器会读取文件内的目录、正文和图片，并自动提供原文件下载。文件路径使用英文、数字、下划线或连字符；书名和作者照常使用中文。

`id` 必须唯一，修改后会产生新的阅读记录。`status` 可用 `planned`、`reading`、`finished`。封面 `cover` 和作品来源 `url` 是可选的 HTTPS 链接。当前支持未加密的 EPUB，不能打开带 DRM 的文件。

## 阅读功能

- EPUB 内置目录、上一页/下一页、左右方向键翻页。
- 三档字号、日间/夜间模式，手机和桌面适配。
- 保存阅读位置，重新打开后继续；进度仅保存在当前浏览器。
- EPUB 原文件下载。其他格式也可通过 `downloads` 添加：

```json
"downloads": [{"label": "下载 PDF", "file": "files/my-book/book.pdf"}]
```

现有 TXT 分章阅读仍可使用：

```json
"chapters": [{"title": "第一章", "file": "files/my-book/01.txt"}]
```

TXT 使用 UTF-8 编码，段落间空一行。同一本书填写 `epub` 时，在线阅读优先打开 EPUB。章节和下载文件必须存在且不为空，否则构建会失败。所有上传文件都会公开发布，请使用你拥有或获准分发的内容。

## 本地开发

Node.js 22 或更新版本，无需安装 npm 依赖：

```sh
node --test tests/catalog.test.mjs
node scripts/build.mjs
node scripts/serve.mjs
```

也可使用 `npm test`、`npm run build`、`npm run dev`。预览地址：http://127.0.0.1:4173/ 。

GitHub Actions 会运行测试、检查书目及文件，然后发布到 GitHub Pages。

## 阅读组件

EPUB 阅读使用 [epub.js 0.3.93](https://github.com/futurepress/epub.js) 和 [JSZip 3.10.1](https://github.com/Stuk/jszip)。库文件随站点部署，不依赖外部 CDN；许可证保存在 `public/vendor/`。EPUB 内的脚本默认禁用。
