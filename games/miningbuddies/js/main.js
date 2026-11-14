import { Game } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    // Set fixed internal virtual resolution (responsive CSS scales it to any window)
    canvas.width = 1200;
    canvas.height = 700;

    const game = new Game(canvas);
    window.__game = game;
    game.start();
});
