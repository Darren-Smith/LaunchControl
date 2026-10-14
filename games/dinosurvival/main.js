import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const hud = document.getElementById('hud');
    const gameOverScreen = document.getElementById('game-over-screen');
    const victoryScreen = document.getElementById('victory-screen');
    const announcement = document.getElementById('announcement');
    const timerEl = document.getElementById('timer');
    const levelInfoEl = document.getElementById('level-info');

    const crosshairsContainer = document.getElementById('crosshairs');
    const ch1 = document.getElementById('ch-1');
    const ch2 = document.getElementById('ch-2');
    const ch3 = document.getElementById('ch-3');

    let game = null;

    const onGameOver = () => {
        hud.classList.add('hidden');
        crosshairsContainer.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    };

    const onVictory = () => {
        hud.classList.add('hidden');
        crosshairsContainer.classList.add('hidden');
        victoryScreen.classList.remove('hidden');
    };

    const onLevelChange = (levelNum) => {
        const dinos = ['Stegosaurus', 'Triceratops', 'T-Rex'];
        levelInfoEl.innerText = `Level ${levelNum}: ${dinos[levelNum-1]} Chase`;
        
        announcement.innerText = `LEVEL ${levelNum}`;
        announcement.classList.remove('hidden');
        setTimeout(() => {
            announcement.classList.add('hidden');
        }, 2000);
    };

    const updateHUD = (gameState) => {
        const mins = Math.floor(gameState.timeRemaining / 60);
        const secs = Math.floor(gameState.timeRemaining % 60);
        timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        for (let i = 0; i < gameState.players.length; i++) {
            const p = gameState.players[i];
            document.getElementById(`p${i+1}-lives`).innerText = p.lives > 0 ? p.lives : 'DEAD';
            
            const slot1 = document.getElementById(`p${i+1}-slot1`);
            const slot2 = document.getElementById(`p${i+1}-slot2`);
            
            slot1.innerText = p.inventory[0] ? p.inventory[0].toUpperCase() : 'Empty';
            slot2.innerText = p.inventory[1] ? p.inventory[1].toUpperCase() : 'Empty';

            if (p.activeSlot === 0) {
                slot1.classList.add('active-slot');
                slot2.classList.remove('active-slot');
            } else {
                slot1.classList.remove('active-slot');
                slot2.classList.add('active-slot');
            }

            if (p.isDead) {
                document.getElementById(`p${i+1}-hud`).style.opacity = 0.5;
            } else {
                document.getElementById(`p${i+1}-hud`).style.opacity = 1;
            }
        }
    };

    game = new Game(
        document.getElementById('game-container'),
        onGameOver,
        onVictory,
        onLevelChange,
        updateHUD
    );

    window.addEventListener('keydown', (e) => {
        game.handleInput(e.code, true);
    });
    window.addEventListener('keyup', (e) => {
        game.handleInput(e.code, false);
    });

    const setupCrosshairs = (numPlayers) => {
        crosshairsContainer.classList.remove('hidden');
        ch1.classList.add('hidden');
        ch2.classList.add('hidden');
        ch3.classList.add('hidden');

        if (numPlayers === 1) {
            ch1.classList.remove('hidden');
            ch1.style.left = '50%';
            ch1.style.top = '50%';
        } else if (numPlayers === 2) {
            ch1.classList.remove('hidden');
            ch2.classList.remove('hidden');
            
            ch1.style.left = '25%';
            ch1.style.top = '50%';
            
            ch2.style.left = '75%';
            ch2.style.top = '50%';
        } else if (numPlayers === 3) {
            ch1.classList.remove('hidden');
            ch2.classList.remove('hidden');
            ch3.classList.remove('hidden');
            
            // Top-Left
            ch1.style.left = '25%';
            ch1.style.top = '25%';
            // Top-Right
            ch2.style.left = '75%';
            ch2.style.top = '25%';
            // Bottom-Left
            ch3.style.left = '25%';
            ch3.style.top = '75%';
        }
    };

    const startGame = (numPlayers) => {
        splashScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        hud.classList.remove('hidden');
        
        document.getElementById('p1-hud').classList.remove('hidden');
        if (numPlayers >= 2) document.getElementById('p2-hud').classList.remove('hidden');
        if (numPlayers >= 3) document.getElementById('p3-hud').classList.remove('hidden');
        
        setupCrosshairs(numPlayers);
        game.start(numPlayers);
    };

    document.getElementById('btn-1p').addEventListener('click', () => startGame(1));
    document.getElementById('btn-2p').addEventListener('click', () => startGame(2));
    document.getElementById('btn-3p').addEventListener('click', () => startGame(3));

    document.getElementById('btn-restart-lose').addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        splashScreen.classList.remove('hidden');
    });
    document.getElementById('btn-restart-win').addEventListener('click', () => {
        victoryScreen.classList.add('hidden');
        splashScreen.classList.remove('hidden');
    });
});
