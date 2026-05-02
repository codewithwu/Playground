# Cat Timer Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chrome Extension with timer → animated cat appears on screen → 1min screen lock → cat leaves

**Architecture:** Manifest V3 Chrome Extension, popup for UI, background for timer logic, content script for cat rendering and screen lock. Pure HTML/CSS/JS, CSS keyframes for all cat animations.

**Tech Stack:** Chrome Extension Manifest V3, CSS Animations, chrome.storage API

---

## File Structure

```
cat-timer-extension/
├── manifest.json          # Extension config
├── popup.html            # Timer setting UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── background.js         # Timer countdown + message relay
├── content.js           # Cat rendering + screen lock
├── cat.css              # Cat animations (6 keyframe sets)
├── images/
│   └── cat.svg          # Cat SVG (body, eyes, ears, tail, mouth)
└── icons/
    └── icon.png         # Extension icon (16/32/48/128)
```

---

## Task 1: Create Project Skeleton & manifest.json

**Files:**
- Create: `cat-timer-extension/manifest.json`

- [ ] **Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Cat Timer",
  "version": "1.0.0",
  "description": "设定倒计时，时间到了猫会出现在屏幕上，锁屏1分钟后离开",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

- [ ] **Step 2: Create directory structure**

Run: `mkdir -p cat-timer-extension/images cat-timer-extension/icons`

- [ ] **Step 3: Commit**

```bash
git add cat-timer-extension/manifest.json
git commit -m "feat: init cat-timer-extension manifest"
```

---

## Task 2: Create SVG Cat Image

**Files:**
- Create: `cat-timer-extension/images/cat.svg`

The SVG must have these named parts for CSS animation targeting:
- `.cat-body` - main body
- `.cat-tail` - tail element
- `.cat-ear-left`, `.cat-ear-right` - ear elements
- `.cat-eye-left`, `.cat-eye-right` - eye elements (with `.cat-eyelid` overlaid for blink)
- `.cat-mouth` - mouth element (for yawn)

- [ ] **Step 1: Write cat.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 250" width="300" height="250">
  <!-- Tail -->
  <g class="cat-tail" style="transform-origin: 240px 160px;">
    <path d="M230 160 Q270 140 280 100 Q285 80 275 75" stroke="#8B7355" stroke-width="14" fill="none" stroke-linecap="round"/>
  </g>

  <!-- Body -->
  <ellipse class="cat-body" cx="150" cy="170" rx="85" ry="60" fill="#D4A574"/>

  <!-- Left Ear -->
  <g class="cat-ear-left" style="transform-origin: 90px 95px;">
    <polygon points="65,110 90,60 115,110" fill="#D4A574" stroke="#8B7355" stroke-width="2"/>
    <polygon points="75,105 90,72 105,105" fill="#FFB6C1"/>
  </g>

  <!-- Right Ear -->
  <g class="cat-ear-right" style="transform-origin: 210px 95px;">
    <polygon points="185,110 210,60 235,110" fill="#D4A574" stroke="#8B7355" stroke-width="2"/>
    <polygon points="195,105 210,72 225,105" fill="#FFB6C1"/>
  </g>

  <!-- Head -->
  <ellipse cx="150" cy="115" rx="70" ry="55" fill="#D4A574" stroke="#8B7355" stroke-width="2"/>

  <!-- Left Eye -->
  <g class="cat-eye-left">
    <ellipse cx="120" cy="110" rx="12" ry="14" fill="#2D2D2D"/>
    <ellipse cx="123" cy="107" rx="4" ry="5" fill="#FFFFFF"/>
    <ellipse class="cat-eyelid" cx="120" cy="110" rx="12" ry="14" fill="#D4A574" style="transform-origin: 120px 110px; transform: scaleY(1);"/>
  </g>

  <!-- Right Eye -->
  <g class="cat-eye-right">
    <ellipse cx="180" cy="110" rx="12" ry="14" fill="#2D2D2D"/>
    <ellipse cx="183" cy="107" rx="4" ry="5" fill="#FFFFFF"/>
    <ellipse class="cat-eyelid" cx="180" cy="110" rx="12" ry="14" fill="#D4A574" style="transform-origin: 180px 110px; transform: scaleY(1);"/>
  </g>

  <!-- Nose -->
  <ellipse cx="150" cy="128" rx="6" ry="4" fill="#FFB6C1"/>

  <!-- Mouth -->
  <g class="cat-mouth">
    <path d="M140 135 Q150 145 160 135" stroke="#8B7355" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>

  <!-- Whiskers -->
  <g stroke="#8B7355" stroke-width="1.5" fill="none">
    <line x1="65" y1="125" x2="100" y2="128"/>
    <line x1="65" y1="132" x2="100" y2="132"/>
    <line x1="65" y1="139" x2="100" y2="136"/>
    <line x1="235" y1="125" x2="200" y2="128"/>
    <line x1="235" y1="132" x2="200" y2="132"/>
    <line x1="235" y1="139" x2="200" y2="136"/>
  </g>

  <!-- Front Paws -->
  <ellipse cx="110" cy="225" rx="22" ry="14" fill="#D4A574" stroke="#8B7355" stroke-width="2"/>
  <ellipse cx="190" cy="225" rx="22" ry="14" fill="#D4A574" stroke="#8B7355" stroke-width="2"/>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add cat-timer-extension/images/cat.svg
git commit -m "feat: add cat SVG asset"
```

---

## Task 3: Create Extension Icons

**Files:**
- Create: `cat-timer-extension/icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

- [ ] **Step 1: Generate simple PNG icons using ImageMagick**

Run:
```bash
cd cat-timer-extension/icons
# Create a simple colored circle as placeholder icon for each size
convert -size 16x16 xc:'#FFD700' -fill '#8B7355' -draw "circle 8,8 8,2" icon16.png
convert -size 32x32 xc:'#FFD700' -fill '#8B7355' -draw "circle 16,16 16,4" icon32.png
convert -size 48x48 xc:'#FFD700' -fill '#8B7355' -draw "circle 24,24 24,6" icon48.png
convert -size 128x128 xc:'#FFD700' -fill '#8B7355' -draw "circle 64,64 64,16" icon128.png
```

- [ ] **Step 2: Verify icons exist**

Run: `ls -la cat-timer-extension/icons/`

- [ ] **Step 3: Commit**

```bash
git add cat-timer-extension/icons/
git commit -m "feat: add extension icon placeholders"
```

---

## Task 4: Create popup.html

**Files:**
- Create: `cat-timer-extension/popup.html`, `cat-timer-extension/popup.css`, `cat-timer-extension/popup.js`

- [ ] **Step 1: Write popup.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <h1 class="title">🐱 猫猫计时器</h1>

    <div id="setup-view">
      <div class="preset-buttons">
        <button class="preset-btn" data-minutes="25">25 分钟</button>
        <button class="preset-btn" data-minutes="30">30 分钟</button>
        <button class="preset-btn" data-minutes="45">45 分钟</button>
        <button class="preset-btn" data-minutes="60">60 分钟</button>
      </div>
      <div class="custom-input">
        <input type="number" id="custom-minutes" placeholder="分钟数" min="1" max="480">
        <button id="start-btn">开始</button>
      </div>
    </div>

    <div id="running-view" class="hidden">
      <div class="timer-display">
        <span id="remaining-time">--:--</span>
      </div>
      <button id="cancel-btn">取消计时</button>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write popup.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #FFF8E7;
  padding: 16px;
}

.popup-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #5D4037;
  text-align: center;
}

.hidden {
  display: none !important;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.preset-btn {
  padding: 10px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #5D4037;
  background: #FFE4B5;
  border: 2px solid #DEB887;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.preset-btn:hover {
  background: #FFD4A0;
}

.preset-btn:active {
  background: #FFC078;
}

.custom-input {
  display: flex;
  gap: 8px;
}

.custom-input input {
  flex: 1;
  padding: 8px 10px;
  font-size: 14px;
  border: 2px solid #DEB887;
  border-radius: 8px;
  background: #FFF;
  outline: none;
}

.custom-input input:focus {
  border-color: #FFB74D;
}

#start-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #FFF;
  background: #FF8C64;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

#start-btn:hover {
  background: #FF7043;
}

.timer-display {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #5D4037;
  padding: 12px;
  background: #FFE4B5;
  border-radius: 8px;
}

#cancel-btn {
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #FFF;
  background: #EF5350;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

#cancel-btn:hover {
  background: #E53935;
}
```

- [ ] **Step 3: Write popup.js**

```javascript
const setupView = document.getElementById('setup-view');
const runningView = document.getElementById('running-view');
const remainingTimeEl = document.getElementById('remaining-time');
const customMinutesInput = document.getElementById('custom-minutes');
const startBtn = document.getElementById('start-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Get stored timer state
async function getTimerState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['endTime'], (result) => {
      resolve(result.endTime || null);
    });
  });
}

// Save timer state
function saveTimerState(endTime) {
  chrome.storage.local.set({ endTime });
}

// Format ms to MM:SS or HH:MM:SS
function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Update UI to reflect timer running
function showRunning(endTime) {
  setupView.classList.add('hidden');
  runningView.classList.remove('hidden');
  updateRemainingTime(endTime);
}

// Update UI to reflect timer stopped
function showSetup() {
  runningView.classList.add('hidden');
  setupView.classList.remove('hidden');
  chrome.storage.local.set({ endTime: null });
}

// Update remaining time display
function updateRemainingTime(endTime) {
  const remaining = endTime - Date.now();
  if (remaining <= 0) {
    remainingTimeEl.textContent = '0:00';
    return;
  }
  remainingTimeEl.textContent = formatTime(remaining);
}

// Start countdown
function startTimer(minutes) {
  const endTime = Date.now() + minutes * 60 * 1000;
  saveTimerState(endTime);
  showRunning(endTime);
  // Notify background to start badge updates
  chrome.runtime.sendMessage({ type: 'START_TIMER', endTime });
}

// Cancel countdown
function cancelTimer() {
  saveTimerState(null);
  showSetup();
  chrome.runtime.sendMessage({ type: 'CANCEL_TIMER' });
}

// Event listeners
startBtn.addEventListener('click', () => {
  const minutes = parseInt(customMinutesInput.value, 10);
  if (minutes && minutes > 0) {
    startTimer(minutes);
  }
});

cancelBtn.addEventListener('click', cancelTimer);

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes, 10);
    startTimer(minutes);
  });
});

// Initialize
async function init() {
  const endTime = await getTimerState();
  if (endTime && endTime > Date.now()) {
    showRunning(endTime);
  } else {
    showSetup();
  }

  // Update timer every second
  setInterval(async () => {
    const et = await getTimerState();
    if (et && et > Date.now()) {
      updateRemainingTime(et);
    } else if (et && et <= Date.now()) {
      showSetup();
    }
  }, 1000);
}

init();
```

- [ ] **Step 4: Commit**

```bash
git add cat-timer-extension/popup.html cat-timer-extension/popup.css cat-timer-extension/popup.js
git commit -m "feat: add popup UI with timer controls"
```

---

## Task 5: Create background.js

**Files:**
- Create: `cat-timer-extension/background.js`

- [ ] **Step 1: Write background.js**

```javascript
let timerInterval = null;
let currentEndTime = null;

// Update badge every second
function startBadgeTimer(endTime) {
  stopBadgeTimer();
  currentEndTime = endTime;

  updateBadge(endTime);

  timerInterval = setInterval(() => {
    updateBadge(endTime);

    if (Date.now() >= endTime) {
      stopBadgeTimer();
      triggerCat();
    }
  }, 1000);
}

function stopBadgeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  currentEndTime = null;
  chrome.action.setBadgeText({ text: '' });
}

function updateBadge(endTime) {
  const remaining = Math.ceil((endTime - Date.now()) / 1000);
  const minutes = Math.ceil(remaining / 60);
  if (minutes > 0) {
    chrome.action.setBadgeText({ text: String(minutes) });
    chrome.action.setBadgeBackgroundColor({ color: '#FF8C64' });
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF5350' });
  }
}

function triggerCat() {
  chrome.storage.local.set({ catTriggerTime: Date.now() });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_CAT' });
    }
  });
}

// Restore timer on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['endTime'], (result) => {
    if (result.endTime && result.endTime > Date.now()) {
      startBadgeTimer(result.endTime);
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    startBadgeTimer(message.endTime);
  } else if (message.type === 'CANCEL_TIMER') {
    stopBadgeTimer();
    chrome.storage.local.set({ endTime: null });
  }
  sendResponse({ ok: true });
});
```

- [ ] **Step 2: Commit**

```bash
git add cat-timer-extension/background.js
git commit -m "feat: add background script for timer management"
```

---

## Task 6: Create cat.css

**Files:**
- Create: `cat-timer-extension/cat.css`

- [ ] **Step 1: Write cat.css**

```css
/* Cat container */
.cat-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.cat-wrapper {
  position: relative;
  width: 300px;
  height: 280px;
  transform: translateX(100vw) translateY(0);
  animation: cat-enter 1.5s ease-in-out forwards;
}

/* Cat enter animation */
@keyframes cat-enter {
  0% {
    transform: translateX(100vw) translateY(0);
  }
  70% {
    transform: translateX(-20px) translateY(0);
  }
  85% {
    transform: translateX(10px) translateY(0);
  }
  100% {
    transform: translateX(0) translateY(0);
  }
}

/* Cat exit animation */
@keyframes cat-exit-yawn {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.8);
  }
}

@keyframes cat-fade-out {
  from {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(0) translateY(0);
  }
}

.cat-wrapper.exiting .cat-mouth {
  animation: cat-exit-yawn 0.8s ease-in-out;
}

.cat-wrapper.exiting {
  animation: cat-fade-out 0.5s ease-out 0.8s forwards;
  pointer-events: none;
}

/* Continuous animations */

/* 1. Breathing - body scaleY */
@keyframes cat-breathe {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
  }
  50% {
    transform: scaleY(1.03) scaleX(0.99);
  }
}

.cat-body {
  animation: cat-breathe 1.8s ease-in-out infinite;
  transform-origin: 150px 170px;
}

/* 2. Tail wag */
@keyframes cat-tail-wag {
  0%, 100% {
    transform: rotate(-15deg);
  }
  50% {
    transform: rotate(15deg);
  }
}

.cat-tail {
  animation: cat-tail-wag 0.8s ease-in-out infinite;
}

/* 3. Blink - eyelid scaleY */
@keyframes cat-blink {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

.cat-eyelid {
  animation: cat-blink 4s ease-in-out infinite;
}

/* 4. Ear wiggle */
@keyframes cat-ear-wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.cat-ear-left {
  animation: cat-ear-wiggle 1.2s ease-in-out infinite;
}

.cat-ear-right {
  animation: cat-ear-wiggle 1.2s ease-in-out 0.3s infinite;
}

/* Lock screen overlay */
.lock-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: rgba(0, 0, 0, 0.01);
  cursor: not-allowed;
  pointer-events: all;
}
```

- [ ] **Step 2: Commit**

```bash
git add cat-timer-extension/cat.css
git commit -m "feat: add cat CSS animations"
```

---

## Task 7: Create content.js

**Files:**
- Create: `cat-timer-extension/content.js`

- [ ] **Step 1: Write content.js**

```javascript
let isLocked = false;
let lockTimeout = null;
let catTriggered = false;

// Check if cat was already triggered on page load (page refreshed while cat showing)
chrome.storage.local.get(['catTriggerTime'], (result) => {
  if (result.catTriggerTime) {
    const elapsed = Date.now() - result.catTriggerTime;
    if (elapsed < 65000) {
      // Less than 65s passed, show cat with remaining lock time
      const remainingLockTime = 60000 - elapsed;
      if (remainingLockTime > 0) {
        showCatAndLock(remainingLockTime);
      }
    }
    chrome.storage.local.remove(['catTriggerTime']);
  }
});

// Listen for SHOW_CAT message from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_CAT' && !catTriggered) {
    catTriggered = true;
    showCatAndLock(60000);
  }
});

function showCatAndLock(lockDuration) {
  if (isLocked) return;
  isLocked = true;

  // Create lock overlay first
  const lockOverlay = document.createElement('div');
  lockOverlay.className = 'lock-overlay';
  lockOverlay.id = 'cat-lock-overlay';

  // Block mouse events
  lockOverlay.addEventListener('mousedown', (e) => e.preventDefault());
  lockOverlay.addEventListener('mouseup', (e) => e.preventDefault());
  lockOverlay.addEventListener('click', (e) => e.preventDefault());

  // Block all keyboard events at document level
  const blockKeys = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  document.addEventListener('keydown', blockKeys, { capture: true });
  document.addEventListener('keyup', blockKeys, { capture: true });
  document.addEventListener('keypress', blockKeys, { capture: true });

  lockOverlay._blockKeys = blockKeys;

  document.body.appendChild(lockOverlay);

  // Create cat overlay
  const catOverlay = document.createElement('div');
  catOverlay.className = 'cat-overlay';
  catOverlay.id = 'cat-overlay';

  const catWrapper = document.createElement('div');
  catWrapper.className = 'cat-wrapper';
  catWrapper.id = 'cat-wrapper';

  catWrapper.innerHTML = `
    <link rel="stylesheet" href="${chrome.runtime.getURL('cat.css')}">
    <img src="${chrome.runtime.getURL('images/cat.svg')}"
         alt="cat"
         width="300"
         height="250"
         style="position: absolute; top: 0; left: 0;">
  `;

  catOverlay.appendChild(catWrapper);
  document.body.appendChild(catOverlay);

  // After lock duration, play exit animation then cleanup
  lockTimeout = setTimeout(() => {
    playExitAndCleanup(lockOverlay, lockOverlay._blockKeys, catWrapper);
  }, lockDuration);
}

function playExitAndCleanup(lockOverlay, blockKeys, catWrapper) {
  // Remove lock overlay
  document.removeEventListener('keydown', blockKeys, { capture: true });
  document.removeEventListener('keyup', blockKeys, { capture: true });
  document.removeEventListener('keypress', blockKeys, { capture: true });
  if (lockOverlay.parentNode) {
    lockOverlay.parentNode.removeChild(lockOverlay);
  }

  // Play exit animation
  catWrapper.classList.add('exiting');

  // After exit animation (0.8s yawn + 0.5s fade = 1.3s), remove cat
  setTimeout(() => {
    const catOverlay = document.getElementById('cat-overlay');
    if (catOverlay && catOverlay.parentNode) {
      catOverlay.parentNode.removeChild(catOverlay);
    }
    isLocked = false;
    catTriggered = false;
  }, 1300);
}
```

- [ ] **Step 2: Commit**

```bash
git add cat-timer-extension/content.js
git commit -m "feat: add content script for cat rendering and screen lock"
```

---

## Task 8: Verify Extension Loads

**Files:**
- Modify: `cat-timer-extension/manifest.json` (add `"web_accessible_resources"`)

- [ ] **Step 1: Fix manifest - add web_accessible_resources for SVG and CSS**

The content script loads cat.svg and cat.css via chrome.runtime.getURL, so these must be listed as web_accessible_resources.

```json
{
  "web_accessible_resources": [
    {
      "resources": ["images/cat.svg", "cat.css"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

Read the manifest and update it.

- [ ] **Step 2: Load extension in Chrome**

Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `cat-timer-extension` folder
- Click the extension icon and test:
  1. Click "25 分钟" preset
  2. Verify badge shows minutes
  3. Wait for cat to appear (or for quick test, set a 1-minute timer)
  4. Verify cat animates in, screen locks, cat exits after 1 min

- [ ] **Step 3: Quick smoke test with 10-second timer**

Set custom input to `1` (1 minute for lock), but first test with a smaller timer by temporarily editing popup to use seconds. Just verify the full flow works end-to-end.

For actual testing, use a 1-minute timer to verify full flow.

- [ ] **Step 4: Commit web_accessible_resources fix**

```bash
git add cat-timer-extension/manifest.json
git commit -m "fix: add web_accessible_resources for cat assets"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All 4 cat animations (breathing, tail, blink, ear) present in cat.css
- [ ] Entry animation: `cat-enter` keyframe moves cat from right edge to center
- [ ] Exit animation: `cat-exit-yawn` + `cat-fade-out` on .exiting class
- [ ] Lock overlay: pointer-events: all + preventDefault on mouse and keyboard
- [ ] Badge timer: background.js updates badge text every second
- [ ] Storage: endTime saved/restored so timer survives popup close
- [ ] web_accessible_resources: cat.svg and cat.css accessible to content script
- [ ] No placeholder/TODO comments in code
- [ ] All file paths consistent across tasks

---

## Final Project Structure After All Tasks

```
cat-timer-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── background.js
├── content.js
├── cat.css
├── images/
│   └── cat.svg
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```
