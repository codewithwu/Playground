# Getting Started

## 安装

```bash
npm i
npm run build
npm link
```

## 最常用工作流

1. 看模板列表

```bash
postgen template --action list
```

2. 直接渲染标题

```bash
postgen render --template xhs-note --title "把普通项目\n包装成作品感页面"
# 或：
postgen render --template xhs-quote-blue "别再迷信\n信息密度了"
```

3. 如果你需要 `theme` / `icon` / `label` / `subtitle` / `bullets` 等更多字段，可以继续直接传参数

```bash
postgen render \
  --template xhs-note \
  --title "把普通项目\n包装成作品感页面" \
  --subtitle "不是随便出张图就完事，而是把质感撑起来" \
  --bullet "先抓第一眼，再解释细节" \
  --bullet "比起功能截图，更像一张会传播的内容卡" \
  --theme cream \
  --icon "💻" \
  --label "Text Note"
```

4. 如果你更想维护一份完整 JSON，再导出示例 JSON

```bash
postgen template --action init --name xhs-note --out ./note.json
# 或：
postgen template --action init --name xhs-quote-blue --out ./quote.json
```

5. 修改 JSON 内容

6. 渲染 PNG

```bash
postgen render --template xhs-note --data ./note.json
# 或：
postgen render --template xhs-quote-blue --data ./quote.json
```

## 默认输出目录

如果不传 `--out`，图片默认输出到：

```bash
./out/
```

## 文件命名

- 默认：`<template>-YYYYMMDD-HHmmss.png`
- 如果传 `--stable-name`：`<template>.png`
