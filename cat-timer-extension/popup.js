const setupView = document.getElementById('setup-view');
const runningView = document.getElementById('running-view');
const remainingTimeEl = document.getElementById('remaining-time');
const customMinutesInput = document.getElementById('custom-minutes');
const startBtn = document.getElementById('start-btn');
const cancelBtn = document.getElementById('cancel-btn');

let timerInterval = null;

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
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(async () => {
    const et = await getTimerState();
    if (et && et > Date.now()) {
      updateRemainingTime(et);
    } else if (et && et <= Date.now()) {
      showSetup();
      chrome.storage.local.set({ endTime: null }); // Clear stale state
    }
  }, 1000);
}

init();