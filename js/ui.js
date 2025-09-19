import { ACHIEVEMENTS, GENERATORS, NUMBER_FORMATS, UPGRADES } from './data.js';
import { markDirty } from './storage.js';

export function format(n, settings) {
  const f = NUMBER_FORMATS[settings.numfmt] || NUMBER_FORMATS.short;
  return f(n);
}

export function renderAll(state, settings) {
  renderHeader(state, settings);
  renderUpgrades(state, settings);
  renderGenerators(state, settings);
  renderAchievementsPanel(state, settings);
}

export function renderHeader(state, settings) {
  document.getElementById('bytes').textContent = format(state.bytes, settings);
  document.getElementById('bps').textContent = format(totalBps(state), settings);
  document.getElementById('perClick').textContent = `+${format(state.perClick, settings)}`;
}

export function totalBps(state) {
  let total = 0;
  for (const g of GENERATORS) {
    const owned = state.generators[g.id]?.owned || 0;
    const mult = getGenMultiplier(state, g.id);
    total += owned * g.bps * mult;
  }
  return total;
}

export function getGenMultiplier(state, genId) {
  let m = 1;
  for (const up of UPGRADES) {
    if (state.upgrades[up.id] && up.type === 'mult_gen' && up.gen === genId) {
      m *= up.value;
    }
  }
  return m;
}

export function renderUpgrades(state, settings) {
  const wrap = document.getElementById('upgrades');
  wrap.innerHTML = '';
  for (const up of UPGRADES) {
    if (up.requires && (state.generators[up.requires]?.owned || 0) <= 0 && !state.upgrades[up.id]) {
      continue; // hide until relevant
    }
    const owned = !!state.upgrades[up.id];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="title">
        <span>${up.emoji} ${up.name}</span>
        ${owned ? '<span class="badge">Owned</span>' : ''}
      </div>
      <div class="desc">${up.desc}</div>
      <div class="meta">
        <span>Cost: ${format(up.cost, settings)}</span>
        <span>${owned ? 'Purchased' : ''}</span>
      </div>
      <div class="actions">
        <button class="buy" ${owned ? 'disabled' : ''}>Buy</button>
      </div>
    `;
    card.querySelector('.buy').addEventListener('click', () => {
      if (!owned && state.bytes >= up.cost) {
        state.bytes -= up.cost;
        state.upgrades[up.id] = true;
        if (up.type === 'mult_click') {
          state.perClick *= up.value;
        }
        markDirty();
        renderAll(state, settings);
      }
    });
    wrap.appendChild(card);
  }
}

export function renderGenerators(state, settings) {
  const wrap = document.getElementById('generators');
  wrap.innerHTML = '';
  for (const g of GENERATORS) {
    const owned = state.generators[g.id]?.owned || 0;
    const mult = getGenMultiplier(state, g.id);
    const bps = g.bps * mult;
    const cost = generatorCost(g, owned);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="title">
        <span>${g.emoji} ${g.name}</span>
        <span class="badge">x${owned}</span>
      </div>
      <div class="desc">${g.desc}</div>
      <div class="meta">
        <span>B/s: ${format(bps, settings)} each</span>
        <span>Total: ${format(bps * owned, settings)}</span>
      </div>
      <div class="actions">
        <button class="buy">Buy (${format(cost, settings)})</button>
      </div>
    `;
    const btn = card.querySelector('.buy');
    btn.disabled = state.bytes < cost;
    btn.addEventListener('click', () => {
      if (state.bytes >= cost) {
        state.bytes -= cost;
        state.generators[g.id].owned = owned + 1;
        markDirty();
        renderAll(state, settings);
      }
    });
    wrap.appendChild(card);
  }
}

export function generatorCost(gen, owned) {
  // classic incremental cost scaling
  return Math.floor(gen.baseCost * 1.15 ** owned);
}

export function checkAchievements(state, notify) {
  let unlocked = 0, total = 0;
  for (const a of ACHIEVEMENTS) {
    total++;
    if (!state.achievements[a.id] && a.cond(state)) {
      state.achievements[a.id] = true;
      notify(`Achievement unlocked: ${a.emoji} ${a.name}`, a.desc);
    }
    if (state.achievements[a.id]) unlocked++;
  }
  const pill = document.getElementById('achCount');
  if (pill) pill.textContent = `${unlocked}/${total}`;
}

export function renderAchievementsPanel(state, settings) {
  const list = document.getElementById('achievements');
  list.innerHTML = '';
  for (const a of ACHIEVEMENTS) {
    const got = !!state.achievements[a.id];
    const div = document.createElement('div');
    div.className = 'ach-item';
    div.innerHTML = `
      <span>${a.emoji}</span>
      <span>${a.name}</span>
      <span class="desc" style="color: var(--muted)">${a.desc}</span>
      <span class="check">${got ? '✓' : ''}</span>
    `;
    list.appendChild(div);
  }
}
