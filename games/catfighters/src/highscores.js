// Cat Fighters - LocalStorage High Score & Leaderboard System

class HighScoreManager {
  constructor() {
    this.storageKey = 'catfighters_highscores_v1';
    this.defaultScores = [
      { name: 'CLAW_MASTER', cat: 'Red Cat', score: 9300, difficulty: 'HARD', date: '2026-10-11', perfect: true },
      { name: 'STINK_LORD', cat: 'Blue Cat', score: 6200, difficulty: 'NORMAL', date: '2026-10-10', perfect: false },
      { name: 'NINJA_PAWS', cat: 'Red Cat', score: 4850, difficulty: 'NORMAL', date: '2026-10-09', perfect: false },
      { name: 'POO_SNIPER', cat: 'Blue Cat', score: 3100, difficulty: 'EASY', date: '2026-10-08', perfect: false },
      { name: 'LITTER_BOXER', cat: 'Red Cat', score: 1800, difficulty: 'EASY', date: '2026-10-07', perfect: false },
    ];
  }

  getScores() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [...this.defaultScores];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.score - a.score).slice(0, 10);
      }
    } catch (e) {
      console.warn('Failed to load high scores', e);
    }
    return [...this.defaultScores];
  }

  addScore(entry) {
    const scores = this.getScores();
    const newEntry = {
      name: (entry.name || 'ANON_CAT').toUpperCase().slice(0, 12),
      cat: entry.cat || 'Cat',
      score: Math.max(0, Math.floor(entry.score || 0)),
      difficulty: (entry.difficulty || 'NORMAL').toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      perfect: !!entry.perfect,
    };

    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(topScores));
    } catch (e) {
      console.warn('Failed to save high scores', e);
    }

    return topScores;
  }

  calculateMatchScore(fighter, timeRemaining, isWinner, difficulty = 'normal', gameMode = 'cpu') {
    let score = fighter.score || 0;
    if (isWinner) {
      // Victory bonus
      score += 1500;
      // Health remaining bonus
      score += Math.floor(fighter.health * 25);
      // Time remaining bonus
      score += Math.floor(timeRemaining * 40);
      // Perfect bonus if full health preserved
      if (fighter.health >= 100) {
        score += 1000;
      }

      // Difficulty Competency Multipliers:
      // Hard grants 1.5x score, Normal 1.0x, Easy 0.6x
      if (gameMode === 'cpu') {
        const mult = difficulty === 'hard' ? 1.5 : (difficulty === 'easy' ? 0.6 : 1.0);
        score = Math.floor(score * mult);
      }
    }
    return score;
  }
}

window.highScores = new HighScoreManager();
