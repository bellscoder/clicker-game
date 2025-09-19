import { DEFAULT_STATE, DEFAULT_SETTINGS } from './data.js';
import { load, save, loadSettings, saveSettings, exportSave, importSave, markDirty } from './storage.js';
import { createClickOsc, createToastOsc } from './audio.js';
import { checkAchievements, format, renderAll, renderHeader, totalBps } from './ui.js';

let state = load();
let settings = loadSettings();

applyTheme(settings.theme);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const clickSound = createClickOsc(audioCtx);
const toastSound = createToastOsc(audioCtx);
audioCtx.suspend(); // will resume on first user gesture

// DOM
const bigClick = document.getElementById('bigClick');
const themeSel = document.getElementById('theme');
const numfmtSel = document.getElementById('numfmt');
const volumeRange = document.getElementById('volume');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');
const resetBtn = document.getElementById('resetBtn');
const toasts = document.getElementById('toasts');

// init settings UI
themeSel.value = settings.theme;
numfmtSel.value = settings.numfmt;
volumeRange.value = settings.volume;

themeSel.addEventListener('change', () => {
  settings.theme = themeSel.value;
  saveSettings(settings);
  applyTheme(settings.theme);
});
numfmtSel.addEventListener('change', () => {
  settings.numfmt = numfmtSel.value;
  saveSettings(settings);
  renderHeader(state, settings);
});
volumeRange.addEventListener('input', () => {
  settings.volume = parseFloat(volumeRange.value);
  audioCtx.resume();
  setMasterVolume(settings.volume);
  saveSettings(settings);
});

// export/import/reset
exportBtn.addEventListener('click', () => exportSave(state));
importBtn.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = await importSave(file);
    state = { ...DEFAULT_STATE(), ...data }; // conservative merge
    notify('Save imported', 'Welcome back!');
    renderAll(state, settings);
    save(state);
  } catch {
    notify('Import failed', 'Invalid file.');
  } finally {
    importInput.value = '';
  }
});
resetBtn.addEventListener('click', () => {
  if (confirm('Hard reset? This will erase your progress.')) {
    state = DEFAULT_STATE();
    notify('Progress reset', 'Fresh start!');
    renderAll(state, settings);
    save(state);
  }
});

// click handling
bigClick.addEventListener('click', () => {
  audioCtx.resume();
  state.bytes += state.perClick;
  clickSound();
  markDirty();
  renderHeader(state, settings);
  checkAchievements(state, notify);
});

// keyboard: Space to click
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    bigClick.click();
  }
});

// loop: tick BPS
let lastTick = performance.now();
function tick(now) {
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  const bps = totalBps(state);
  if (bps > 0) {
    state.bytes += bps * dt;
    markDirty();
    renderHeader(state, settings);
  }
  checkAchievements(state, notify);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// offline progress
applyOfflineProgress();

// autosave
setInterval(() => save(state), 10000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save(state);
});

// initial render
renderAll(state, settings);
notify('Welcome to Byte Clicker', 'Click to earn bytes. Buy generators and upgrades!');

// helpers
function setMasterVolume(v) {
  // Use destination gain via a proxy node
  // Minimalist approach: scale per-sound envelopes by v
  // Done in audio nodes; here we just store volume for use
  window.__volume = v;
}
const _origClick = (window._clickSound = () => {});
function proxy(volFunc, fn) {
  return (...args) => {
    const v = (window.__volume ?? settings.volume) || 0;
    if (v <= 0) return;
    fn(...args);
  };
}
// already using envelopes; just gate by volume using proxy:
const gatedClick = proxy(() => settings.volume, clickSound);
const gatedToast = proxy(() => settings.volume, toastSound);

// overwrite sounds with gated versions
window.addEventListener('click', () => {
  // no-op: ensure context can resume on first gesture
}, { once: true });

function notify(title, body) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = `<strong>${title}</strong><br><span style="color: var(--muted)">${body}</span>`;
  toasts.appendChild(div);
  gatedToast();
  setTimeout(() => { div.remove(); }, 3000);
}

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme !== 'dark');
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsed = Math.max(0, (now - (state.lastSave || now)) / 1000);
  const bps = totalBps(state);
  const gain = bps * elapsed;
  if (gain > 0) {
    state.bytes += gain;
    notify('Offline gains', `You earned ${format(gain, settings)} bytes while away.`);
  }
}
