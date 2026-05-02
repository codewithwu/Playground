# Cat Timer Chrome Extension - Design Spec

## 1. Concept & Vision

一个轻量的 Chrome 浏览器插件，用户设定倒计时，时间到了后一只卡通风格的猫从屏幕边缘慢慢溜达进来，趴在屏幕中央。此时整个页面鼠标和键盘都会被锁定 1 分钟，1 分钟后猫打个大呵欠然后淡出消失。整体风格轻松治愈，带有一点点"强制休息"的意味。

## 2. Technical Stack

- **Manifest V3** Chrome Extension
- 纯 HTML/CSS/JS，无框架依赖
- CSS Keyframes 实现所有猫动画
- `chrome.storage.local` 持久化计时器状态

## 3. Architecture

```
cat-timer-extension/
├── manifest.json          # 扩展配置
├── popup.html            # 计时器设置 UI
├── popup.css
├── popup.js              # popup 逻辑
├── background.js         # 计时器后台、消息中转
├── content.js            # 猫渲染 + 锁屏逻辑
├── cat.css               # 猫的 6 个动画关键帧
├── images/
│   └── cat.svg           # 猫的 SVG 图片
└── icons/
    └── icon.png          # 扩展图标 (16/32/48/128)
```

**数据流：**
popup 用户设置时间 → background 开始倒计时（badge 显示剩余分钟）→ 时间到 background 通知 content script → content script 生成猫 DOM、挂载入场动画 → 1分钟后播放退场动画 → 卸载猫、解除锁定

## 4. Component Specifications

### 4.1 Popup UI

- 顶部标题 "猫猫计时器"
- 4个预设按钮：25分钟 / 30分钟 / 45分钟 / 60分钟
- 手动输入区：数字输入框（placeholder: "分钟数"）+ "开始" 按钮
- 运行时状态：显示剩余时间 + "取消" 按钮
- 无运行时：预设按钮和手动输入可见

### 4.2 Background Script

- 接收 popup 的计时开始消息
- 使用 `setInterval` 每秒更新 badge 文字（显示剩余分钟数）
- 计时结束，发送消息给 content script 触发猫
- 扩展重启时检查 `chrome.storage.local` 中是否有未完成的计时，恢复

### 4.3 Content Script - 猫

**入场动画（从右侧边缘跑进屏幕中央）：**
- 初始状态：猫在屏幕右侧外部 (`translateX(100vw)`)
- 动画：1.5s ease-in-out 跑到屏幕中央（`translateX(0)`, `translateY(0)`）

**持续循环的4个动画：**
1. **呼吸**：身体微微上下，`transform: scaleY(0.98) → scaleY(1.02)`，周期 1.8s，ease-in-out
2. **尾巴摆动**：`transform: rotate(-15deg) → rotate(15deg)`，周期 0.8s，ease-in-out
3. **眨眼**：眼睑元素 `scaleY(1) → scaleY(0.1) → scaleY(1)`，周期 0.3s，每 4s 触发一次（用 animationDelay 错开）
4. **耳朵微动**：`transform: rotate(-5deg) → rotate(5deg)`，周期 1.2s，ease-in-out

**退场动画（打呵欠后淡出）：**
- 呵欠：嘴巴区域 `scaleY(1) → scaleY(1.8) → scaleY(1)`，0.8s
- 淡出：`opacity: 1 → 0`，0.5s，延迟 0.8s 后执行

### 4.4 锁屏机制

- 遮罩层：`position: fixed; inset: 0; z-index: 2147483647; cursor: not-allowed; pointer-events: all`
- 鼠标锁定：`addEventListener` 在遮罩层上 `preventDefault()`
- 键盘锁定：`addEventListener('keydown', 'keyup')` 在 document 上 `preventDefault()` + `stopPropagation()`
- 1分钟到点后移除遮罩层

## 5. Storage Schema

```json
{
  "endTime": 1714652400000  // 计时结束的 Unix ms 时间戳，null 表示无进行中计时
}
```

## 6. Edge Cases

- 用户在计时中关闭 popup：计时继续在 background 中运行
- 标签页在计时期间切换：content script 通过 `chrome.runtime.sendMessage` 确保通信
- 用户刷新页面：content script 重新注入，需要向 background 确认当前状态
- 多个标签页同时打开：只在一个标签页（最后打开的）显示猫

## 7. Out of Scope

- 自定义猫的样式/颜色
- 计时完成后的声音提醒
- 锁屏时间的自定义
- 多种猫的款式选择
