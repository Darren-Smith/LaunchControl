class HistoryManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 50;
        this.isRestoring = false;
        
        // Save initial state
        setTimeout(() => this.saveState(true), 100);
    }
    
    saveState(force = false) {
        if (this.isRestoring) return;
        
        const state = this.uiManager.profileSerializer.serialize();
        
        // Don't save if identical
        if (!force && this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === state) {
            return;
        }
        
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        
        if (!force) {
            this.redoStack = [];
        }
        
        this.updateButtons();
    }
    
    undo() {
        if (this.undoStack.length <= 1) return; // Keep at least the initial state
        
        this.isRestoring = true;
        
        // The current state is popped and put in redo
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        
        // The previous state is peeked and loaded (we leave it on the undo stack)
        const previousState = this.undoStack[this.undoStack.length - 1];
        this.uiManager.loadState(previousState);
        
        this.isRestoring = false;
        this.updateButtons();
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        this.isRestoring = true;
        
        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);
        this.uiManager.loadState(nextState);
        
        this.isRestoring = false;
        this.updateButtons();
    }
    
    updateButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.style.opacity = this.undoStack.length <= 1 ? '0.5' : '1';
        if (redoBtn) redoBtn.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
    }
}
