import { gameData } from './data.js';
import { loadGame, saveGame, getGameState } from './storage.js';
import { playClickSound } from './audio.js';
import { updateUI, createShopItem, showAchievement } from './ui.js';

let gameState = getGameState();
window.gameState = gameState;

let lastSave = Date.now();
let achievements = new Set();

function init() {
    loadGame();
    setupEventListeners();
    renderShop();
    gameLoop();
    checkAchievements();
}

function setupEventListeners() {
    const clickButton = document.getElementById('clickButton');
    clickButton.addEventListener('click', handleClick);
    
    // Visual feedback
    clickButton.addEventListener('mousedown', () => {
        clickButton.style.transform = 'scale(0.95)';
    });
    
    clickButton.addEventListener('mouseup', () => {
        clickButton.style.transform = 'scale(1)';
    });
}

function handleClick() {
    gameState.bytes += gameState.bytesPerClick;
    playClickSound();
    showClickValue();
    updateUI();
    checkAchievements();
}

function showClickValue() {
    const clickValue = document.createElement('span');
    clickValue.className = 'click-value';
    clickValue.innerHTML = `+${gameState.bytesPerClick}`;
    document.querySelector('.click-button').appendChild(clickValue);
    
    setTimeout(() => clickValue.remove(), 1000);
}

function renderShop() {
    const upgradesList = document.getElementById('upgradesList');
    const generatorsList = document.getElementById('generatorsList');
    
    upgradesList.innerHTML = '';
    generatorsList.innerHTML = '';
    
    gameData.upgrades.forEach(upgrade => {
        const element = createShopItem(upgrade, 'upgrade');
        element.addEventListener('click', () => purchaseUpgrade(upgrade));
        upgradesList.appendChild(element);
    });
    
    gameData.generators.forEach(generator => {
        const element = createShopItem(generator, 'generator');
        element.addEventListener('click', () => purchaseGenerator(generator));
        generatorsList.appendChild(element);
    });
}

function purchaseUpgrade(upgrade) {
    if (gameState.bytes >= upgrade.cost && !gameState.upgrades[upgrade.id]) {
        gameState.bytes -= upgrade.cost;
        gameState.upgrades[upgrade.id] = true;
        gameState.bytesPerClick = Math.floor(gameState.bytesPerClick * upgrade.multiplier);
        updateUI();
        renderShop();
        checkAchievements();
    }
}

function purchaseGenerator(generator) {
    if (gameState.bytes >= generator.cost) {
        gameState.bytes -= generator.cost;
        gameState.generators[generator.id] = (gameState.generators[generator.id] || 0) + 1;
        calculateBytesPerSecond();
        updateUI();
        renderShop();
        checkAchievements();
    }
}

function calculateBytesPerSecond() {
    let bps = 0;
    gameData.generators.forEach(generator => {
        const owned = gameState.generators[generator.id] || 0;
        bps += generator.production * owned;
    });
    gameState.bytesPerSecond = bps;
}

function gameLoop() {
    const now = Date.now();
    const delta = (now - gameState.lastUpdate) / 1000;
    
    gameState.bytes += gameState.bytesPerSecond * delta;
    gameState.lastUpdate = now;
    
    updateUI();
    
    // Auto-save every 10 seconds
    if (now - lastSave > 10000) {
        saveGame(gameState);
        lastSave = now;
    }
    
    requestAnimationFrame(gameLoop);
}

function checkAchievements() {
    const milestones = [
        { bytes: 100, title: 'First Steps', desc: 'Reached 100 bytes!' },
        { bytes: 1000, title: 'Kilobyte King', desc: 'Reached 1,000 bytes!' },
        { bytes: 10000, title: 'Data Hoarder', desc: 'Reached 10,000 bytes!' },
        { bytes: 100000, title: 'Byte Boss', desc: 'Reached 100,000 bytes!' },
        { bytes: 1000000, title: 'Megabyte Master', desc: 'Reached 1,000,000 bytes!' }
    ];
    
    milestones.forEach(milestone => {
        if (gameState.bytes >= milestone.bytes && !achievements.has(milestone.title)) {
            achievements.add(milestone.title);
            showAchievement(milestone.title, milestone.desc);
        }
    });
}

// Start the game
init();
