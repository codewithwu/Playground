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