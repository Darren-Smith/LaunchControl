window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas') || document.getElementById('gameCanvas');
    const game = new Game(canvas);
    window.heroMakerGame = game;
    game.start();
});
