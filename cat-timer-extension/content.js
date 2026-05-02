let isLocked = false;
let lockTimeout = null;
let catTriggered = false;

const LOCK_DURATION_MS = 60000;
const STALE_TRIGGER_THRESHOLD_MS = 65000;
const EXIT_ANIMATION_DURATION_MS = 1300;

// Check if cat was already triggered on page load (page refreshed while cat showing)
chrome.storage.local.get(['catTriggerTime'], (result) => {
  if (chrome.runtime.lastError) return;
  if (result.catTriggerTime) {
    const elapsed = Date.now() - result.catTriggerTime;
    if (elapsed < STALE_TRIGGER_THRESHOLD_MS) {
      // Less than 65s passed, show cat with remaining lock time
      const remainingLockTime = LOCK_DURATION_MS - elapsed;
      if (remainingLockTime > 0) {
        showCatAndLock(remainingLockTime);
      }
    }
    chrome.storage.local.remove(['catTriggerTime'], () => {
      if (chrome.runtime.lastError) return;
    });
  }
});

// Listen for SHOW_CAT message from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_CAT' && !catTriggered) {
    catTriggered = true;
    showCatAndLock(LOCK_DURATION_MS);
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 250" width="300" height="250" style="position: absolute; top: 0; left: 0;">
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
  }, EXIT_ANIMATION_DURATION_MS);
}