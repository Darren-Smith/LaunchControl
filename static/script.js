let games = [];
let selectedIndex = -1;
let isLaunching = false;
let isStopping = false;
let statusPollInterval = null;
let activeTerminalGameId = null;

// DOM Elements
const gameGridEl = document.getElementById('game-grid');
const btnStopAll = document.getElementById('btn-stop-all');
const btnAdmin = document.getElementById('btn-admin');
const adminModal = document.getElementById('admin-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const addGameForm = document.getElementById('add-game-form');

const btnArchitect = document.getElementById('btn-architect');
const architectModal = document.getElementById('architect-modal');
const btnCloseArchitect = document.getElementById('btn-close-architect');
const architectForm = document.getElementById('architect-form');

const blueprintModal = document.getElementById('blueprint-modal');
const btnCloseBlueprint = document.getElementById('btn-close-blueprint');
const blueprintOutput = document.getElementById('blueprint-output');
const btnCopyBlueprint = document.getElementById('btn-copy-blueprint');
const btnEmojiPicker = document.getElementById('btn-emoji-picker');
const emojiPickerContainer = document.getElementById('emoji-picker-container');
const emojiPicker = document.querySelector('emoji-picker');

// Form & Stepper Elements
const gameDirInput = document.getElementById('game-dir');
const btnBrowseDir = document.getElementById('btn-browse-dir');
const gamePortInput = document.getElementById('game-port');
const btnPortInc = document.getElementById('btn-port-inc');
const btnPortDec = document.getElementById('btn-port-dec');
const portRecBadge = document.getElementById('port-rec-badge');
const portStatusMsg = document.getElementById('port-status-msg');
const gameTitleInput = document.getElementById('game-title');
const gameCmdInput = document.getElementById('game-cmd');

// Folder Picker Modal Elements
const folderPickerModal = document.getElementById('folder-picker-modal');
const btnCloseFolderModal = document.getElementById('btn-close-folder-modal');
const btnFolderParent = document.getElementById('btn-folder-parent');
const btnFolderSelectCurrent = document.getElementById('btn-folder-select-current');
const folderCurrentPath = document.getElementById('folder-current-path');
const folderItemsList = document.getElementById('folder-items-list');

// Terminal Elements
const termEmptyState = document.getElementById('terminal-empty-state');
const termBootText = document.getElementById('terminal-boot-text');
const termGameInfo = document.getElementById('terminal-game-info');
const termActions = document.getElementById('terminal-actions');
const termLoading = document.getElementById('terminal-loading');

const termIcon = document.getElementById('terminal-icon');
const termTitle = document.getElementById('terminal-title');
const termDesc = document.getElementById('terminal-desc');
const termPort = document.getElementById('terminal-port-val');
const termStatus = document.getElementById('terminal-status-val');

const btnTermLaunch = document.getElementById('btn-terminal-launch');
const btnTermStop = document.getElementById('btn-terminal-stop');

// ── Helpers ──────────────────────────────────────────────────────────────────

function anyRunning() {
    return games.some(g => g.running);
}

// ── Data / Polling ────────────────────────────────────────────────────────────

async function fetchGames() {
    try {
        const res = await fetch('/api/games');
        const freshGames = await res.json();

        freshGames.forEach(fg => {
            const existing = games.find(g => g.id === fg.id);
            if (existing) fg.running = fg.running || existing.running;
        });

        games = freshGames;
        renderGameList();

        if (games.length > 0 && !statusPollInterval) {
            statusPollInterval = setInterval(pollStatus, 3000);
        }
    } catch (e) {
        console.error("Failed to fetch games", e);
    }
}

async function pollStatus() {
    try {
        const res = await fetch('/api/games');
        const freshGames = await res.json();
        let changed = false;
        freshGames.forEach(fg => {
            const g = games.find(g => g.id === fg.id);
            if (g && g.running !== fg.running) {
                g.running = fg.running;
                changed = true;
            }
        });
        if (changed) {
            renderGameList();
            if (activeTerminalGameId) updateTerminalState(activeTerminalGameId);
        }
    } catch (e) {
        // silently ignore
    }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderGameList() {
    gameGridEl.innerHTML = '';
    
    // Sort games: Favourites first, then alphabetical by title
    const sortedGames = [...games].sort((a, b) => {
        const aFav = a.favourite ? 1 : 0;
        const bFav = b.favourite ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return a.title.localeCompare(b.title);
    });

    sortedGames.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.setProperty('--game-color', game.color || 'var(--accent-primary)');

        const isRunning = !!game.running;

        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon">${game.icon || '🎮'}</div>
                <div class="card-title-group">
                    <div class="card-title">
                        ${game.title}
                        ${game.is_new ? '<span class="badge-new">NEW</span>' : ''}
                    </div>
                    <div class="card-status ${isRunning ? 'running' : ''}">
                        <span class="status-dot ${isRunning ? 'running' : ''}"></span>
                        ${isRunning ? 'Running' : 'Offline'}
                    </div>
                </div>
                <button class="btn-edit" onclick="editGame('${game.id}', event)" title="Edit Game">✎</button>
                <button class="btn-favourite ${game.favourite ? 'active' : ''}" onclick="toggleFavourite('${game.id}', event)" title="${game.favourite ? 'Unfavourite' : 'Favourite'}">♥</button>
            </div>
            <div class="card-desc">${game.description}</div>
        `;

        card.onclick = () => openTerminal(game.id);
        gameGridEl.appendChild(card);
    });
}

// ── Terminal Logic ────────────────────────────────────────────────────────────

async function toggleFavourite(gameId, event) {
    if (event) event.stopPropagation();
    
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // Optimistic UI update
    game.favourite = !game.favourite;
    renderGameList();

    try {
        const res = await fetch(`/api/toggle_favourite/${gameId}`, { method: 'POST' });
        const data = await res.json();
        
        if (data.status !== 'success') {
            throw new Error(data.error);
        }
    } catch (e) {
        console.error("Error toggling favourite:", e);
        // Revert on error
        game.favourite = !game.favourite;
        renderGameList();
    }
}

function editGame(gameId, event) {
    if (event) event.stopPropagation();
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    document.getElementById('admin-modal-title').textContent = 'Edit Game';
    document.getElementById('game-id').value = game.id;
    document.getElementById('game-title').value = game.title;
    document.getElementById('game-desc').value = game.description;
    document.getElementById('game-dir').value = game.dir;
    let cmdStr = game.command.join(' ');
    if (cmdStr.startsWith("/bin/bash -c ")) {
        cmdStr = game.command[2];
    }
    document.getElementById('game-cmd').value = cmdStr;
    document.getElementById('game-port').value = game.port;
    document.getElementById('game-color').value = game.color || '#3b82f6';
    document.getElementById('game-icon').value = game.icon || '🎮';
    
    const rec = getRecommendedPort();
    if (portRecBadge) portRecBadge.textContent = `Rec: ${rec}`;
    updatePortStatus();
    
    adminModal.showModal();
}

function openTerminal(gameId, event) {
    if (event) event.stopPropagation();
    
    activeTerminalGameId = gameId;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // Reset Terminal UI
    termEmptyState.classList.add('hidden');
    termBootText.classList.remove('hidden');
    termGameInfo.classList.add('hidden');
    termActions.classList.add('hidden');
    termLoading.classList.add('hidden');
    
    // Disable Launch Button until loaded
    btnTermLaunch.disabled = true;
    btnTermStop.disabled = true;

    // Populate data
    termIcon.textContent = game.icon || '🎮';
    termTitle.textContent = game.title;
    termDesc.textContent = game.description;
    termPort.textContent = game.port;
    updateTerminalState(gameId);

    // Boot sequence animation
    setTimeout(() => {
        termBootText.classList.add('hidden');
        termGameInfo.classList.remove('hidden');
        setTimeout(() => {
            if (!isLaunching) {
                termActions.classList.remove('hidden');
                btnTermLaunch.disabled = false;
                btnTermStop.disabled = false;
            }
        }, 300);
    }, 800);
}

function updateTerminalState(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (game.running) {
        termStatus.textContent = "ONLINE & RUNNING";
        termStatus.style.color = "var(--term-green)";
        btnTermLaunch.innerHTML = `<span class="prompt">></span> ACCESS_RUNNING_INSTANCE <span class="blink">_</span>`;
        btnTermLaunch.classList.remove('hidden');
        btnTermStop.classList.remove('hidden');
    } else {
        termStatus.textContent = "OFFLINE";
        termStatus.style.color = "inherit";
        btnTermLaunch.innerHTML = `<span class="prompt">></span> EXECUTE_LAUNCH_SEQUENCE <span class="blink">_</span>`;
        btnTermLaunch.classList.remove('hidden');
        btnTermStop.classList.add('hidden');
    }
}

async function terminalLaunch() {
    const game = games.find(g => g.id === activeTerminalGameId);
    if (!game) return;

    if (game.running) {
        window.open(`http://localhost:${game.port}`, `_game_${game.id}`, 'noopener,noreferrer');
        return;
    }

    isLaunching = true;
    termActions.classList.add('hidden');
    termLoading.classList.remove('hidden');
    termLoading.innerHTML = `> EXECUTING LAUNCH SEQUENCE... PLEASE WAIT <span class="blink">_</span>`;

    try {
        const res = await fetch(`/api/launch/${game.id}`, { method: 'POST' });
        const data = await res.json();

        if (data.status === 'started' || data.status === 'already_running') {
            game.running = true;
            renderGameList();
            updateTerminalState(game.id);

            termLoading.innerHTML = `> LAUNCH SUCCESSFUL. REDIRECTING IN 2 SECONDS... <span class="blink">_</span>`;

            setTimeout(() => {
                window.open(data.url, `_game_${game.id}`, 'noopener,noreferrer');
                termLoading.classList.add('hidden');
                termActions.classList.remove('hidden');
                isLaunching = false;
            }, 2000);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (e) {
        console.error("Error launching game:", e);
        termLoading.innerHTML = `> ERROR: ${e.message} <span class="blink">_</span>`;
        setTimeout(() => {
            isLaunching = false;
            termLoading.classList.add('hidden');
            termActions.classList.remove('hidden');
        }, 2000);
    }
}

async function terminalStop() {
    const gameId = activeTerminalGameId;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    termActions.classList.add('hidden');
    termLoading.classList.remove('hidden');
    termLoading.innerHTML = `> INITIATING KILL PROCESS... <span class="blink">_</span>`;

    try {
        const res = await fetch(`/api/stop/${gameId}`, { method: 'POST' });
        const data = await res.json();

        if (data.status === 'stopped' || data.status === 'not_running') {
            game.running = false;
            renderGameList();
            updateTerminalState(gameId);
            
            termLoading.innerHTML = `> PROCESS TERMINATED. <span class="blink">_</span>`;
            setTimeout(() => {
                termLoading.classList.add('hidden');
                termActions.classList.remove('hidden');
            }, 1000);
        }
    } catch (e) {
        console.error("Error stopping game:", e);
        termLoading.innerHTML = `> ERROR: KILL PROCESS FAILED <span class="blink">_</span>`;
        setTimeout(() => {
            termLoading.classList.add('hidden');
            termActions.classList.remove('hidden');
        }, 2000);
    }
}

// ── Global Actions ──────────────────────────────────────────────────────────

async function stopAllGames() {
    if (isStopping || !anyRunning()) return;

    isStopping = true;
    
    try {
        const res = await fetch('/api/stop_all', { method: 'POST' });
        await res.json();

        games.forEach(g => g.running = false);
        renderGameList();
        if (activeTerminalGameId) updateTerminalState(activeTerminalGameId);
    } catch (e) {
        console.error("Stop all failed:", e);
    } finally {
        isStopping = false;
    }
}

// ── Port Recommendation & Stepper Logic ──────────────────────────────────────

function getRecommendedPort() {
    const usedPorts = new Set(
        games.map(g => parseInt(g.port, 10)).filter(p => !isNaN(p) && p > 0)
    );
    usedPorts.add(9000); // Launch Control server port

    // Look at 8000 series
    const ports8000 = [...usedPorts].filter(p => p >= 8000 && p < 9000);
    let candidate = ports8000.length > 0 ? Math.max(...ports8000) + 1 : 8001;

    while (usedPorts.has(candidate)) {
        candidate++;
    }
    return candidate;
}

function updatePortStatus() {
    if (!gamePortInput || !portStatusMsg) return;
    const currentVal = parseInt(gamePortInput.value, 10);
    const currentGameId = document.getElementById('game-id').value;
    
    if (isNaN(currentVal) || currentVal <= 0) {
        portStatusMsg.textContent = '';
        portStatusMsg.className = 'port-status-msg';
        return;
    }
    
    if (currentVal === 9000) {
        portStatusMsg.textContent = '⚠️ Port 9000 is used by Launch Control itself!';
        portStatusMsg.className = 'port-status-msg taken';
        return;
    }
    
    const conflict = games.find(g => parseInt(g.port, 10) === currentVal && g.id !== currentGameId);
    if (conflict) {
        portStatusMsg.textContent = `⚠️ Port ${currentVal} is used by ${conflict.title}`;
        portStatusMsg.className = 'port-status-msg taken';
    } else {
        portStatusMsg.textContent = `✓ Port ${currentVal} is available`;
        portStatusMsg.className = 'port-status-msg avail';
    }
}

function stepPort(direction) {
    if (!gamePortInput) return;
    let val = parseInt(gamePortInput.value, 10);
    const rec = getRecommendedPort();
    
    if (isNaN(val) || val <= 0) {
        gamePortInput.value = rec;
    } else {
        let newVal = val + direction;
        if (newVal < 1024) newVal = 1024;
        if (newVal > 65535) newVal = 65535;
        gamePortInput.value = newVal;
    }
    updatePortStatus();
}

// ── Directory Selection & Auto-detect Logic ───────────────────────────────────

function applySelectedFolder(path, suggestedTitle, suggestedCmd) {
    if (!gameDirInput) return;
    gameDirInput.value = path;
    
    // Auto-fill title if empty
    if (gameTitleInput && !gameTitleInput.value.trim() && suggestedTitle) {
        gameTitleInput.value = suggestedTitle;
    }
    
    // Auto-fill command if empty
    if (gameCmdInput && !gameCmdInput.value.trim() && suggestedCmd) {
        const portVal = (gamePortInput && gamePortInput.value) ? gamePortInput.value : '8000';
        gameCmdInput.value = suggestedCmd.replace('{port}', portVal);
    }
}

async function triggerFolderSelector() {
    if (btnBrowseDir) btnBrowseDir.classList.add('loading');
    
    const initialDir = (gameDirInput && gameDirInput.value) ? gameDirInput.value : '/home/darren/Documents/AntiGravityProjects';
    
    try {
        const res = await fetch('/api/select_folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initial_dir: initialDir })
        });
        const data = await res.json();
        
        if (data.status === 'success' && data.path) {
            applySelectedFolder(data.path, data.suggested_title, data.suggested_command);
        } else if (data.status === 'fallback') {
            openInAppFolderPicker(initialDir);
        }
    } catch (e) {
        console.warn('Native folder selection fallback:', e);
        openInAppFolderPicker(initialDir);
    } finally {
        if (btnBrowseDir) btnBrowseDir.classList.remove('loading');
    }
}

// ── In-App Folder Picker Modal Fallback ────────────────────────────────────────

let currentBrowsePath = '/home/darren/Documents/AntiGravityProjects';
let parentBrowsePath = null;
let selectedFolderItemPath = null;

async function openInAppFolderPicker(path) {
    currentBrowsePath = path || '/home/darren/Documents/AntiGravityProjects';
    await loadBrowseDir(currentBrowsePath);
    if (folderPickerModal) folderPickerModal.showModal();
}

async function loadBrowseDir(path) {
    if (!folderItemsList || !folderCurrentPath) return;
    
    try {
        folderCurrentPath.textContent = path;
        folderItemsList.innerHTML = '<div class="folder-item-empty">Loading folders...</div>';
        const res = await fetch(`/api/browse_dir?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        
        currentBrowsePath = data.current;
        parentBrowsePath = data.parent;
        folderCurrentPath.textContent = data.current;
        selectedFolderItemPath = null;
        
        if (btnFolderParent) {
            btnFolderParent.disabled = !parentBrowsePath || currentBrowsePath === '/';
        }
        
        folderItemsList.innerHTML = '';
        if (!data.folders || data.folders.length === 0) {
            folderItemsList.innerHTML = '<div class="folder-item-empty">No subfolders found</div>';
            return;
        }
        
        data.folders.forEach(f => {
            const item = document.createElement('div');
            item.className = 'folder-item';
            item.innerHTML = `<span class="folder-item-icon">📁</span><span>${f.name}</span>`;
            
            // Double-click navigates into folder
            item.ondblclick = () => loadBrowseDir(f.path);
            
            // Single-click selects folder
            item.onclick = () => {
                document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedFolderItemPath = f.path;
            };
            
            folderItemsList.appendChild(item);
        });
    } catch (e) {
        console.error('Error loading browse dir:', e);
        folderItemsList.innerHTML = '<div class="folder-item-empty">Error loading directory</div>';
    }
}

// ── Event Listeners ───────────────────────────────────────────────────────────

btnStopAll.addEventListener('click', stopAllGames);

btnTermLaunch.addEventListener('click', terminalLaunch);
btnTermStop.addEventListener('click', terminalStop);

// Port Stepper Events
if (btnPortInc) {
    btnPortInc.addEventListener('click', () => stepPort(1));
}
if (btnPortDec) {
    btnPortDec.addEventListener('click', () => stepPort(-1));
}
if (portRecBadge) {
    portRecBadge.addEventListener('click', () => {
        if (gamePortInput) {
            gamePortInput.value = getRecommendedPort();
            updatePortStatus();
        }
    });
}
if (gamePortInput) {
    gamePortInput.addEventListener('input', updatePortStatus);
    gamePortInput.addEventListener('keydown', (e) => {
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !gamePortInput.value) {
            e.preventDefault();
            gamePortInput.value = getRecommendedPort();
            updatePortStatus();
        }
    });
}

// Folder Browser Events
if (btnBrowseDir) {
    btnBrowseDir.addEventListener('click', triggerFolderSelector);
}
if (gameDirInput) {
    gameDirInput.addEventListener('click', () => {
        if (!gameDirInput.value.trim()) {
            triggerFolderSelector();
        }
    });
    // If user finishes typing or pasting a directory path, auto-detect details if fields empty
    gameDirInput.addEventListener('change', async () => {
        const enteredPath = gameDirInput.value.trim();
        if (enteredPath) {
            try {
                const res = await fetch('/api/inspect_folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dir: enteredPath })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    applySelectedFolder(enteredPath, data.suggested_title, data.suggested_command);
                }
            } catch (err) {
                // Ignore silent inspect errors
            }
        }
    });
}

// In-App Folder Modal Events
if (btnCloseFolderModal && folderPickerModal) {
    btnCloseFolderModal.addEventListener('click', () => folderPickerModal.close());
    folderPickerModal.addEventListener('click', (e) => {
        if (e.target === folderPickerModal) folderPickerModal.close();
    });
}
if (btnFolderParent) {
    btnFolderParent.addEventListener('click', () => {
        if (parentBrowsePath) loadBrowseDir(parentBrowsePath);
    });
}
if (btnFolderSelectCurrent && folderPickerModal) {
    btnFolderSelectCurrent.addEventListener('click', async () => {
        const chosen = selectedFolderItemPath || currentBrowsePath;
        try {
            const res = await fetch('/api/inspect_folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dir: chosen })
            });
            const data = await res.json();
            applySelectedFolder(chosen, data.suggested_title, data.suggested_command);
        } catch {
            applySelectedFolder(chosen);
        }
        folderPickerModal.close();
    });
}

if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        document.getElementById('admin-modal-title').textContent = 'Add New Game';
        addGameForm.reset();
        document.getElementById('game-id').value = '';
        
        // Prefill recommended port!
        const rec = getRecommendedPort();
        if (gamePortInput) {
            gamePortInput.value = rec;
            gamePortInput.placeholder = rec;
        }
        if (portRecBadge) {
            portRecBadge.textContent = `Rec: ${rec}`;
            portRecBadge.title = `Click to set recommended port (${rec})`;
        }
        updatePortStatus();
        
        adminModal.showModal();
    });
}
if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
        adminModal.close();
    });
}
if (adminModal) {
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.close();
        }
    });
}

if (addGameForm) {
    addGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let cmdStr = document.getElementById('game-cmd').value;
        if (cmdStr.startsWith("/bin/bash -c ")) {
            cmdStr = cmdStr.replace("/bin/bash -c ", "").replace(/^['"](.*)['"]$/, '$1');
        }

        const gameId = document.getElementById('game-id').value;
        const newGame = {
            id: gameId || undefined,
            title: document.getElementById('game-title').value,
            description: document.getElementById('game-desc').value,
            dir: document.getElementById('game-dir').value,
            command: ["/bin/bash", "-c", cmdStr],
            port: parseInt(document.getElementById('game-port').value, 10),
            color: document.getElementById('game-color').value,
            icon: document.getElementById('game-icon').value
        };
        
        const endpoint = gameId ? `/api/edit_game/${gameId}` : '/api/add_game';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGame)
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                adminModal.close();
                addGameForm.reset();
                document.getElementById('game-id').value = '';
                fetchGames();
            } else {
                alert('Error saving game: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save game');
        }
    });
}

// Emoji Picker Event Listeners
if (btnEmojiPicker && emojiPickerContainer) {
    btnEmojiPicker.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPickerContainer.classList.toggle('hidden');
    });
    
    emojiPickerContainer.addEventListener('emoji-click', event => {
        document.getElementById('game-icon').value = event.detail.unicode;
        emojiPickerContainer.classList.add('hidden');
    });
    
    document.addEventListener('click', (e) => {
        if (!emojiPickerContainer.contains(e.target) && e.target !== btnEmojiPicker) {
            emojiPickerContainer.classList.add('hidden');
        }
    });
}

// ── Game Architect Logic ───────────────────────────────────────────────────

if (btnArchitect) {
    btnArchitect.addEventListener('click', () => {
        architectForm.reset();
        architectModal.showModal();
    });
}

if (btnCloseArchitect) {
    btnCloseArchitect.addEventListener('click', () => architectModal.close());
}

if (architectModal) {
    architectModal.addEventListener('click', (e) => {
        if (e.target === architectModal) {
            architectModal.close();
        }
    });
}

if (architectForm) {
    architectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Gather values
        const name = document.getElementById('arch-name').value;
        const desc = document.getElementById('arch-desc').value;
        const char = document.getElementById('arch-char').value || 'None specified';
        const winLoss = document.getElementById('arch-win').value || 'Standard / None specified';
        const mechanic = document.getElementById('arch-mechanic').value || 'Standard / None specified';
        
        const category = document.getElementById('arch-category').value;
        const style = document.getElementById('arch-style').value;
        const audio = document.getElementById('arch-audio').value;
        const controls = document.getElementById('arch-controls').value;
        const size = document.getElementById('arch-size').value;
        
        const perspectiveVal = document.getElementById('arch-perspective').value;
        const perspective = perspectiveVal === '1' ? '2D' : perspectiveVal === '2' ? 'Isometric' : '3D';
        
        const isWeb = document.getElementById('arch-web').checked;
        const hasPause = document.getElementById('arch-pause').checked;
        const hasScore = document.getElementById('arch-score').checked;

        // Construct Verbose Blueprint
        const prompt = `I need you to build a complete, fully playable game with the following strict parameters:

**1. Game Identity & Core Loop**
- Name: ${name}
- Category: ${category}
- Platform: ${isWeb ? 'Web-based (HTML/JS/CSS)' : 'Desktop Python (Pygame)'}
- Description: ${desc}

**2. Visual & Audio Design**
- Target Window Size: ${size}
- Perspective: ${perspective}
- Art Style: ${style}
- Sound & Music Style: ${audio}

**3. Mechanics & Entities**
- Main Character: ${char}
- Core Unique Mechanic: ${mechanic}
- Win/Loss Condition: ${winLoss}
- Control Scheme: ${controls}

**4. Additional Systems**
- Pause Menu: ${hasPause ? 'REQUIRED' : 'NOT REQUIRED'}
- High Score System: ${hasScore ? 'REQUIRED' : 'NOT REQUIRED'}

Please write the full implementation. Ensure the game loop is robust, controls are responsive, and all visual assets (using shapes or generated graphics if needed) fit the described Art Style perfectly. Use best practices and provide the complete runnable code.`;

        blueprintOutput.value = prompt;
        
        architectModal.close();
        blueprintModal.showModal();
    });
}

if (btnCloseBlueprint) {
    btnCloseBlueprint.addEventListener('click', () => blueprintModal.close());
}

if (blueprintModal) {
    blueprintModal.addEventListener('click', (e) => {
        if (e.target === blueprintModal) {
            blueprintModal.close();
        }
    });
}

if (btnCopyBlueprint) {
    btnCopyBlueprint.addEventListener('click', () => {
        blueprintOutput.select();
        document.execCommand('copy');
        const originalText = btnCopyBlueprint.innerText;
        btnCopyBlueprint.innerText = 'Copied!';
        setTimeout(() => {
            btnCopyBlueprint.innerText = originalText;
        }, 2000);
    });
}

// ── Init ─────────────────────────────────────────────────────────────────────
window.onload = () => {
    setTimeout(fetchGames, 500);
};
