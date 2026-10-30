# 轻小说书架

首版定位：personal，书目来自公开 GitHub 仓库，静态发布，无需数据库或 Token。

## 已实现（v0.1）

- 独立仓库 `platinumist/lightnovel-bookshelf`，独立站点，不依赖原学习资料库。
- 响应式书架、书籍详情、标题/作者/标签搜索、题材和状态组合筛选、排序。
- 想读 / 在读 / 读完，使用当前浏览器 localStorage 保存；不写回 GitHub，不跨设备同步。
- 加载失败提示与重试，空结果提示，封面加载失败时使用文字封面。
- GitHub 管理入口；通过独立 GitHub Actions → GitHub Pages 发布。

## 添加真实书籍

编辑 `public/books.json`，将 `demo` 改为 `false`，替换示例书目。示例均为虚构演示，并非个人真实阅读记录。

```json
{
  "version": 1,
  "demo": false,
  "books": [{
    "id": "my-first-book",
    "title": "书名",
    "author": "作者",
    "description": "简介或自己的阅读备注",
    "tags": ["奇幻", "旅行"],
    "status": "planned",
    "updated": "2026-10-30",
    "cover": "https://example.com/cover.jpg",
    "url": "https://example.com/book"
  }]
}
```

`id` 为唯一英文、数字、下划线或连字符，修改 id 会产生新的本地状态。`status` 只接受 `planned`、`reading`、`finished`。`cover` 和 `url` 可省略；填写时只接受 HTTPS。无封面时自动生成文字封面。日期使用 YYYY-MM-DD。空书架可设置 `books: []`。

提交并推送到 main 后，本仓库 GitHub Actions 会发布书目和页面。前端读取与页面同版本的 books.json，因此加载不依赖 GitHub API 限流。浏览器中保存的阅读状态会覆盖文件里的默认状态。公开仓库中的书目和简介可被所有人读取；仅收录你愿意公开的信息。

## 开发与验证

仓库根目录运行：

```powershell
npm test
npm run build
npm run dev
```

本地预览访问 http://127.0.0.1:4173/ 。也可以用静态服务器直接服务 public；不能直接通过 file:// 打开，因为书目使用 fetch 加载。

## 后续路线

1. v0.2：分卷信息、收藏备注、阅读进度导出/导入，先解决备份。
2. v0.3：为自有或获授权内容提供 Markdown/EPUB 阅读器、目录和书签。
3. v0.4：有明确跨设备需求后，再设计登录和 GitHub 写回；令牌只由可信后端保管。

目前不包含账号、在线全文阅读、自动抓取、跨设备同步。实现保持原生 HTML/CSS/JS，后续确有复杂状态需求时再引入框架。

