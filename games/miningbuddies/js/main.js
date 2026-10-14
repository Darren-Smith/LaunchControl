import { Game } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    // Set fixed internal resolution
    canvas.width = 1200;
    canvas.height = 700;
    
    const game = new Game(canvas);
    game.start();
});
