# CLI

## 查看模板列表

```bash
postgen template --action list
postgen template --action list --json
```

## 查看模板详情

```bash
postgen template --action show --name xhs-note
postgen template --action show --name xhs-quote-blue
```

## 输出模板示例 JSON

```bash
postgen template --action init --name xhs-note
postgen template --action init --name xhs-note --out ./note.json
postgen template --action init --name xhs-quote-blue --out ./quote.json
```

## 渲染图片

```bash
postgen render --template xhs-note --title "把普通项目\n包装成作品感页面"
postgen render --template xhs-quote-blue "别再迷信\n信息密度了"
```

需要更多字段时，也可以继续直接传命令行参数：

```bash
postgen render \
  --template xhs-note \
  --title "把普通项目\n包装成作品感页面" \
  --subtitle "不是随便出张图就完事，而是让层次一起把质感撑起来" \
  --bullet "先抓第一眼，再解释细节" \
  --bullet "比起功能截图，更像一张会传播的内容卡" \
  --theme cream \
  --icon "💻" \
  --label "Text Note"
```

如果你更喜欢维护完整数据，也可以继续传 JSON：

```bash
postgen render --template xhs-note --data ./note.json
postgen render --template xhs-quote-blue --data ./quote.json
```

### 常用参数

- `--title`：直接传标题文本，支持 `\n`
- `--subtitle` / `--footer`：直接传文本字段，支持 `\n`
- `--bullet`：可重复传入，组成 bullets 数组
- `--theme` / `--icon` / `--label` / `--day` / `--serial`：直接传模板常用字段
- `--out`：指定输出路径
- `--stable-name`：输出稳定文件名 `<template>.png`
- `--width` / `--height`：覆盖模板默认尺寸
- `--font`：指定常规字体路径
- `--fontBold`：指定粗体字体路径
