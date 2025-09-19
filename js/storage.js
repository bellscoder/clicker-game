import { DEFAULT_SETTINGS, DEFAULT_STATE, VERSION } from './data.js';

const KEY = 'byte-clicker-save';
const SETTINGS_KEY = 'byte-clicker-settings';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : DEFAULT_STATE();
    if (!state.version) state.version = VERSION;
    return state;
  } catch {
    return DEFAULT_STATE();
  }
}

export function save(state) {
  try {
    state.lastSave = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    markSaved();
  } catch {}
}

export function exportSave(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'byte-clicker-save.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try { resolve(JSON.parse(r.result)); } catch (e) { reject(e); }
    };
    r.onerror = reject;
    r.readAsText(file);
  });
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

let saveTimer;
export function markDirty() {
  const el = document.getElementById('saveStatus');
  if (el) el.textContent = 'Saving...';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const el2 = document.getElementById('saveStatus');
    if (el2) el2.textContent = 'Saved';
  }, 600);
}
function markSaved() {
  const el = document.getElementById('saveStatus');
  if (el) el.textContent = 'Saved';
}
