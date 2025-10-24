import { gameData } from './data.js';

export function updateUI() {
    document.getElementById('bytes').textContent = Math.floor(window.gameState.bytes);
    document.getElementById('bytesPerSecond').textContent = window.gameState.bytesPerSecond;
    document.getElementById('clickValue').textContent = window.gameState.bytesPerClick;
}

export function createShopItem(item, type) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    
    const canAfford = window.gameState.bytes >= item.cost;
    const isPurchased = type === 'upgrade' && window.gameState.upgrades[item.id];
    const owned = type === 'generator' ? (window.gameState.generators[item.id] || 0) : 0;
    
    if (!canAfford) div.classList.add('disabled');
    if (isPurchased) div.classList.add('purchased');
    
    div.innerHTML = `
        <div class="item-header">
            <span class="item-name">${item.name}</span>
            <span class="item-cost">${item.cost} bytes</span>
        </div>
        <div class="item-effect">${item.effect}</div>
        ${type === 'generator' && owned > 0 ? `<div class="item-owned">Owned: ${owned}</div>` : ''}
    `;
    
    return div;
}

export function showAchievement(title, description) {
    const achievement = document.createElement('div');
    achievement.className = 'achievement';
    achievement.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
    `;
    
    document.getElementById('achievements').appendChild(achievement);
    
    setTimeout(() => achievement.remove(), 5000);
}
