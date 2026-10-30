# 轻小说书架

网站：https://platinumist.github.io/lightnovel-bookshelf/

个人轻小说书架，使用 GitHub Pages 发布。原生 HTML、CSS 和 JavaScript，无第三方运行依赖。

## 功能

- 书名、作者和标签搜索，题材与阅读状态筛选。
- 书籍详情、在线阅读、文件下载。
- 阅读目录、章节切换、三档字号、日间/夜间模式。
- 阅读位置和设置保存在当前浏览器。
- 蓝色界面，适配手机和桌面。

目前保留一本示例作品、两章示例正文，可直接测试阅读与下载。

## 添加书籍

编辑 `public/books.json`，用真实书目替换示例，将 `demo` 改成 `false`：

```json
{
  "version": 1,
  "demo": false,
  "books": [{
    "id": "my-book",
    "title": "书名",
    "author": "作者",
    "description": "简介",
    "tags": ["奇幻"],
    "status": "planned",
    "updated": "2026-10-30",
    "chapters": [
      {"title": "第一章", "file": "files/my-book/01.txt"}
    ],
    "downloads": [
      {"label": "下载 TXT", "file": "files/my-book/full.txt"},
      {"label": "下载 EPUB", "file": "files/my-book/book.epub"}
    ]
  }]
}
```

正文放在 `public/files/my-book/`，文件名使用英文、数字、下划线或连字符。在线阅读接受 UTF-8 编码的 TXT，段落之间空一行。章节标题在 `chapters` 中填写。正文按照纯文本显示。

下载文件单独上传，可提供 TXT、EPUB、PDF 等格式。网站不会自动将章节合并或转换格式。目录中的文件路径必须存在且不为空，否则构建会失败。书籍没有正文或下载文件时，可以省略对应字段。

`id` 是每本书的唯一标识，修改后会产生新的本地阅读记录。`status` 可选 `planned`、`reading`、`finished`。可选字段 `cover`（封面）和 `url`（来源）接受 HTTPS 链接。所有文件会公开发布，请上传你拥有或获准分发的内容。

## 本地开发

安装 Node.js 22 或更新版本：

```sh
npm test
npm run build
npm run dev
```

预览地址：http://127.0.0.1:4173/ 。也可直接执行 `node --test tests/catalog.test.mjs`、`node scripts/build.mjs`、`node scripts/serve.mjs`。

推送到 `main` 后，GitHub Actions 会运行测试、检查书目文件并发布到 GitHub Pages。

## 后续

- 分卷管理和阅读记录备份。
- EPUB 在线阅读。
- 按需求增加跨设备同步。
