# 轻小说书架

网站：https://platinumist.github.io/lightnovel-bookshelf/

个人轻小说书架，支持系列分卷、EPUB 在线阅读和原文件下载。

## 在 GitHub 网页上传书籍

### 1. 准备文件

每卷一个 EPUB，不用解压。例如将某部作品的文件重命名为：

```text
my-series-v01.epub
my-series-v02.epub
my-series-v03.epub
```

文件名和目录可以用中文、英文、数字、空格、下划线或连字符。作品 id 和分卷 id 只能用英文、数字、下划线或连字符，不能含空格。

### 2. 上传文件

打开 [public/files 文件夹](https://github.com/platinumist/lightnovel-bookshelf/tree/main/public/files)，点击 **Add file → Upload files**，把 EPUB 拖进去。填写提交说明，例如“上传某作品第1至3卷”，提交到 `main`。

这里直接上传文件即可，不必新建目录。上传后的路径例如：`public/files/my-series-v01.epub`。

GitHub 网页每个文件限 25 MiB；更大的文件需要使用本地 Git 上传。[GitHub 文件上传说明](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

### 3. 添加作品和分卷

打开 [books.json 编辑页面](https://github.com/platinumist/lightnovel-bookshelf/edit/main/public/books.json)。第一次添加时，可以将文件整体替换成下面的内容，再修改作品信息和文件名：

```json
{
  "version": 1,
  "demo": false,
  "books": [
    {
      "id": "my-series",
      "title": "作品名",
      "author": "作者名",
      "description": "作品简介",
      "tags": ["奇幻"],
      "status": "planned",
      "updated": "2026-10-30",
      "volumes": [
        {
          "id": "v01",
          "title": "第1卷",
          "epub": "files/my-series-v01.epub"
        },
        {
          "id": "v02",
          "title": "第2卷",
          "epub": "files/my-series-v02.epub"
        }
      ]
    }
  ]
}
```

点击 **Commit changes**，将修改提交到 `main`。书目里只写 `files/...`，不要写开头的 `public/`，也不要填写电脑上的 `D:/...` 地址；文件名和大小写必须与上传的文件一致。例如 `public/files/紫罗兰/紫罗兰永恒花园 上.epub` 对应 `files/紫罗兰/紫罗兰永恒花园 上.epub`。

### 4. 等待发布

进入仓库的 [Actions](https://github.com/platinumist/lightnovel-bookshelf/actions)，最新的 **Publish bookshelf** 显示成功后，刷新网站。书架只显示一张作品卡片；打开后会列出各卷，每卷都有阅读和下载入口。

如果发布失败，点开运行记录查看原因。常见原因是 JSON 少了逗号、文件路径写错、书目引用了尚未上传的文件。上传 EPUB 时还没有修改书目，网站不会自动识别新书；完成第 3 步才会显示。

## 以后添加新卷

将新 EPUB 上传到相同目录，在该作品的 `volumes` 数组末尾添加：

```json
{
  "id": "v03",
  "title": "第3卷",
  "epub": "files/my-series-v03.epub"
}
```

记得在前一卷对象后加逗号，并更新作品的 `updated` 日期。分卷按数组顺序显示，番外也可以作为一卷加入，例如 `id: side-story`、`title: 番外篇`。

添加另一部作品时，在 `books` 数组里添加一个新的作品对象。同一作品内的分卷 `id` 必须唯一，作品的 `id` 也必须唯一。保持 id 不变，才能继续使用浏览器保存的阅读进度。

## 单本书

单本不需要 `volumes`，直接在作品对象里填写：

```json
"epub": "files/my-book.epub"
```

系列和单本可以放在同一个书架。一个作品使用 `volumes` 后，文件配置都应放在各卷里，不要再在作品外层填写 `epub`、`chapters` 或 `downloads`。

## 阅读与下载

- 自动读取 EPUB 内置目录、正文和图片，不需要手动拆章。
- 阅读页的“分卷”可切换卷数，每卷分别保存位置；设置与进度保存在当前浏览器。
- “模式”可切换翻页或连续滚动，切换时保留阅读位置，选择保存在当前浏览器。
- 三档字号、日间/夜间模式、上一页/下一页和左右方向键翻页。
- 每卷自动提供 EPUB 原文件下载。可选的 `downloads` 数组可添加 PDF 等其他格式。
- `status` 为整部作品的状态，可填 `planned`、`reading`、`finished`。书架的数量按作品统计。
- `cover`（封面）和 `url`（作品来源）是可选的 HTTPS 链接。
- 当前支持未加密的 EPUB。文件会公开发布，请上传你拥有或获准分发的内容。

原有 TXT 分章配置仍然可用。章节和下载文件必须存在且不为空，否则构建会失败。

## 本地开发

Node.js 22 或更新版本，无需安装 npm 依赖：

```sh
node --test tests/catalog.test.mjs
node scripts/build.mjs
node scripts/serve.mjs
```

也可使用 `npm test`、`npm run build`、`npm run dev`。预览地址：http://127.0.0.1:4173/ 。

## 阅读组件

EPUB 阅读使用 [epub.js 0.3.93](https://github.com/futurepress/epub.js) 和 [JSZip 3.10.1](https://github.com/Stuk/jszip)。库文件随站点部署；许可证保存在 `public/vendor/`。EPUB 内的脚本默认禁用。
