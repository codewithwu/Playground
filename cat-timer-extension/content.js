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