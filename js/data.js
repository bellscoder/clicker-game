export const VERSION = '1.0.0';

export const NUMBER_FORMATS = {
  short: (n) => formatShort(n),
  full: (n) => Math.floor(n).toLocaleString(),
  sci: (n) => formatSci(n),
};

function formatShort(n) {
  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return `${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)}${units[i]}`;
}
function formatSci(n) {
  if (n < 1000) return Math.floor(n).toString();
  const exp = Math.floor(Math.log10(n));
  const mant = n / 10 ** exp;
  return `${mant.toFixed(2)}e${exp}`;
}

export const DEFAULT_SETTINGS = {
  theme: 'light',
  numfmt: 'short',
  volume: 0.3,
};

export const DEFAULT_STATE = () => ({
  bytes: 0,
  perClick: 1,
  generators: {
    cursor: { owned: 0 },
    bot: { owned: 0 },
    server: { owned: 0 },
  },
  upgrades: {},
  achievements: {},
  lastSave: Date.now(),
  createdAt: Date.now(),
  version: VERSION,
});

export const GENERATORS = [
  {
    id: 'cursor',
    name: 'Cursor',
    emoji: '🖱️',
    baseCost: 15,
    bps: 0.1,
    desc: 'A little helper that clicks for you.',
  },
  {
    id: 'bot',
    name: 'Bot',
    emoji: '🤖',
    baseCost: 100,
    bps: 1,
    desc: 'Automates byte collection.',
  },
  {
    id: 'server',
    name: 'Server',
    emoji: '🖥️',
    baseCost: 1100,
    bps: 8,
    desc: 'Dedicated server farm.',
  },
];

export const UPGRADES = [
  {
    id: 'doubleClick',
    name: 'Double Click',
    emoji: '⚡',
    desc: 'Doubles bytes per click.',
    cost: 100,
    type: 'mult_click',
    value: 2,
    requires: null,
  },
  {
    id: 'cursorBoost',
    name: 'Cursor Boost',
    emoji: '🎯',
    desc: 'Cursors are twice as effective.',
    cost: 250,
    type: 'mult_gen',
    gen: 'cursor',
    value: 2,
    requires: 'cursor',
  },
  {
    id: 'botOverclock',
    name: 'Bot Overclock',
    emoji: '🔥',
    desc: 'Bots produce 2.5x bytes.',
    cost: 1200,
    type: 'mult_gen',
    gen: 'bot',
    value: 2.5,
    requires: 'bot',
  },
  {
    id: 'serverCluster',
    name: 'Server Cluster',
    emoji: '🧬',
    desc: 'Servers produce 2x bytes.',
    cost: 5000,
    type: 'mult_gen',
    gen: 'server',
    value: 2,
    requires: 'server',
  },
];

export const ACHIEVEMENTS = [
  { id: 'firstClick', name: 'First Click', emoji: '👆', desc: 'Make your first click.', cond: (s) => s.bytes >= 1 },
  { id: 'hundredBytes', name: 'Hundreds', emoji: '💯', desc: 'Earn 100 bytes total.', cond: (s) => s.bytes >= 100 },
  { id: 'kiloBytes', name: 'A Thousand!', emoji: '🧱', desc: 'Earn 1,000 bytes.', cond: (s) => s.bytes >= 1000 },
  { id: 'firstGen', name: 'Automation', emoji: '🔁', desc: 'Own your first generator.', cond: (s) => Object.values(s.generators).some(g => g.owned > 0) },
  { id: 'tenCursors', name: 'Cursor Crew', emoji: '🧑‍💻', desc: 'Own 10 cursors.', cond: (s) => s.generators.cursor.owned >= 10 },
];
