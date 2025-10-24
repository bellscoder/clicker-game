const SAVE_KEY = 'byteClickerSave';

export function getGameState() {
    return {
        bytes: 0,
        bytesPerClick: 1,
        bytesPerSecond: 0,
        upgrades: {},
        generators: {},
        lastUpdate: Date.now()
    };
}

export function saveGame(gameState) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

export function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        const loadedState = JSON.parse(saved);
        Object.assign(getGameState(), loadedState);
    }
}
