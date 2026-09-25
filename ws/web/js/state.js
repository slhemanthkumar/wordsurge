// Persistent player state (localStorage) plus all progression/economy mutations.
import { ACHIEVEMENTS, THEMES } from './data.js';

const STORAGE_KEY = 'wordsurge.save.v1';
// Pre-release builds used other keys; imported once so testers keep their progress.
const LEGACY_STORAGE_KEYS = ['letterride.save.v1', 'lettertide.save.v1', 'shabdlehar.save.v1', 'wordverse.save.v1'];
// Analytics queues written by pre-release builds; removed on first launch.
const STALE_KEYS = ['wordsurge.analytics.v1', 'letterride.analytics.v1', 'lettertide.analytics.v1', 'shabdlehar.analytics.v1', 'wordverse.analytics.v1'];

function defaultState() {
  return {
    player: {
      name: 'Surge Rider',
      avatar: 'W',
      currentLevel: 1,
      coins: 180,
      xp: 0,
      stars: 0,
      theme: 'beach'
    },
    inventory: {
      revealLetter: 3,
      revealWord: 1,
      smartHint: 2
    },
    progress: {
      foundByLevel: {},
      activeAttempts: {},
      completedLevels: [],
      completionDates: {},
      dailyCompleted: []
    },
    achievements: {
      unlocked: [],
      claimed: []
    },
    daily: {
      lastOpen: null,
      lastClaim: null,
      currentStreak: 0,
      bestStreak: 0,
      lastWheel: null,
      lastChest: null,
      weeklyClaim: null,
      monthlyClaim: null,
      loginDates: []
    },
    stats: {
      levelsCompleted: 0,
      wordsFound: 0,
      perfectLevels: 0,
      totalHints: 0,
      lifetimeCoins: 180,
      totalPlaySeconds: 0,
      sessions: 0,
      longestWord: 0,
      dailyChallenges: 0,
      failedWords: 0,
      failuresByLevel: {},
      timedOutLevels: 0,
      bonusCoins: 0,
      bestCombo: 0
    },
    settings: {
      music: true,
      sound: true,
      vibration: true,
      darkMode: false,
      reducedMotion: false,
      largeText: false
    },
    meta: {
      tutorialComplete: false,
      tutorialStep: 0,
      brandVersion: 4
    }
  };
}

function mergeDeep(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  const output = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(incoming)) {
    if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key]) && base[key]) {
      output[key] = mergeDeep(base[key], incoming[key]);
    } else {
      output[key] = incoming[key];
    }
  }
  return output;
}

export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayDistance(fromKey, toKey) {
  if (!fromKey || !toKey) return Infinity;
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  return Math.round((new Date(ty, tm - 1, td) - new Date(fy, fm - 1, fd)) / 86400000);
}

class Store {
  constructor() {
    this.state = this.load();
    this.listeners = new Set();
    this.sessionStarted = Date.now();
    this.initializeDaily();
    this.state.stats.sessions += 1;
    this.refreshAchievements();
    this.save(false);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.commitSessionTime();
      else this.sessionStarted = Date.now();
    });
    window.addEventListener('pagehide', () => this.commitSessionTime());
  }

  load() {
    try {
      STALE_KEYS.forEach((key) => localStorage.removeItem(key));
      const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const saved = mergeDeep(defaultState(), parsed);
      // One-time migration for saves written by pre-release builds.
      if (!parsed.meta?.brandVersion || parsed.meta.brandVersion < 4) {
        if (['Word Wanderer', 'Lehar Explorer', 'Tide Explorer', 'Word Rider'].includes(saved.player.name)) saved.player.name = 'Surge Rider';
        if (['L', 'S'].includes(saved.player.avatar)) saved.player.avatar = 'W';
        saved.meta.brandVersion = 4;
      }
      return saved;
    } catch (error) {
      console.warn('Could not load save; using a fresh profile.', error);
      return defaultState();
    }
  }

  save(notify = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Progress remains in memory because device storage is unavailable.', error);
    }
    if (notify) this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  initializeDaily() {
    const today = localDateKey();
    if (!this.state.daily.loginDates.includes(today)) {
      this.state.daily.loginDates.push(today);
      this.state.daily.loginDates = this.state.daily.loginDates.slice(-90);
    }
    if (this.state.daily.lastOpen === today) return false;
    const gap = dayDistance(this.state.daily.lastOpen, today);
    this.state.daily.currentStreak = gap === 1 ? this.state.daily.currentStreak + 1 : 1;
    this.state.daily.bestStreak = Math.max(this.state.daily.bestStreak, this.state.daily.currentStreak);
    this.state.daily.lastOpen = today;
    return true;
  }

  refreshSystemDate() {
    const changed = this.initializeDaily();
    if (changed) {
      this.refreshAchievements();
      this.save();
    }
    return changed;
  }

  commitSessionTime() {
    if (!this.sessionStarted) return;
    const seconds = Math.max(0, Math.round((Date.now() - this.sessionStarted) / 1000));
    if (seconds < 21600) this.state.stats.totalPlaySeconds += seconds;
    this.sessionStarted = null;
    this.save(false);
  }

  update(path, value) {
    const parts = path.split('.');
    let cursor = this.state;
    parts.slice(0, -1).forEach((part) => { cursor = cursor[part]; });
    cursor[parts[parts.length - 1]] = value;
    this.save();
  }

  addCoins(amount) {
    this.state.player.coins = Math.max(0, this.state.player.coins + amount);
    if (amount > 0) this.state.stats.lifetimeCoins += amount;
    this.refreshAchievements();
    this.save();
  }

  spendCoins(amount) {
    if (this.state.player.coins < amount) return false;
    this.state.player.coins -= amount;
    this.save();
    return true;
  }

  addXp(amount) {
    this.state.player.xp += amount;
    this.save();
  }

  recordWord(levelId, word) {
    const key = String(levelId);
    const list = this.state.progress.foundByLevel[key] || [];
    if (list.includes(word)) return false;
    list.push(word);
    this.state.progress.foundByLevel[key] = list;
    this.state.stats.wordsFound += 1;
    this.state.stats.longestWord = Math.max(this.state.stats.longestWord, word.length);
    this.refreshAchievements();
    this.save();
    return true;
  }

  recordFailure(levelId = 'unknown') {
    this.state.stats.failedWords += 1;
    const key = String(levelId);
    this.state.stats.failuresByLevel[key] = (this.state.stats.failuresByLevel[key] || 0) + 1;
    this.save(false);
  }

  getAttempt(levelId) {
    return this.state.progress.activeAttempts[String(levelId)] || null;
  }

  startAttempt(levelId, seconds) {
    const key = String(levelId);
    const existing = this.state.progress.activeAttempts[key];
    if (existing) {
      // Never let an older build or reopened screen extend the fixed attempt limit.
      const maximumEnd = existing.startedAt + seconds * 1000;
      if (existing.endsAt > maximumEnd) {
        existing.endsAt = maximumEnd;
        this.save(false);
      }
      return existing;
    }
    const attempt = { startedAt: Date.now(), endsAt: Date.now() + seconds * 1000 };
    this.state.progress.activeAttempts[key] = attempt;
    this.save(false);
    return attempt;
  }

  clearAttempt(levelId, notify = false) {
    delete this.state.progress.activeAttempts[String(levelId)];
    if (notify) this.save();
  }

  recordTimeout(levelId) {
    this.state.stats.timedOutLevels += 1;
    this.clearAttempt(levelId, false);
    this.resetLevelProgress(levelId, false);
    this.save();
  }

  resetLevelProgress(levelId, notify = true) {
    delete this.state.progress.foundByLevel[String(levelId)];
    if (notify) this.save();
  }

  recordCombo(combo) {
    this.state.stats.bestCombo = Math.max(this.state.stats.bestCombo, combo);
    this.refreshAchievements();
    this.save(false);
  }

  addBonusCoins(amount) {
    this.state.stats.bonusCoins += Math.max(0, amount);
    this.addCoins(amount);
  }

  useInventory(kind) {
    if ((this.state.inventory[kind] || 0) <= 0) return false;
    this.state.inventory[kind] -= 1;
    this.state.stats.totalHints += 1;
    this.save();
    return true;
  }

  completeLevel(levelId, { perfect = false, daily = false } = {}) {
    const key = String(levelId);
    this.clearAttempt(levelId, false);
    if (daily) {
      if (!this.state.progress.dailyCompleted.includes(key)) {
        this.state.progress.dailyCompleted.push(key);
        this.state.stats.dailyChallenges += 1;
      }
    } else if (!this.state.progress.completedLevels.includes(Number(levelId))) {
      this.state.progress.completedLevels.push(Number(levelId));
      this.state.progress.completionDates[key] = localDateKey();
      this.state.stats.levelsCompleted += 1;
      this.state.player.stars += perfect ? 3 : 2;
      if (perfect) this.state.stats.perfectLevels += 1;
      if (Number(levelId) >= this.state.player.currentLevel) this.state.player.currentLevel = Number(levelId) + 1;
    }
    this.refreshAchievements();
    this.save();
  }

  refreshAchievements() {
    const values = {
      ...this.state.stats,
      bestStreak: this.state.daily.bestStreak,
      themesUnlocked: THEMES.filter((theme) => this.state.player.currentLevel >= theme.level).length
    };
    ACHIEVEMENTS.forEach((item) => {
      if ((values[item.metric] || 0) >= item.target && !this.state.achievements.unlocked.includes(item.id)) {
        this.state.achievements.unlocked.push(item.id);
      }
    });
  }

  claimAchievement(id) {
    const achievement = ACHIEVEMENTS.find((item) => item.id === id);
    if (!achievement || !this.state.achievements.unlocked.includes(id) || this.state.achievements.claimed.includes(id)) return null;
    this.state.achievements.claimed.push(id);
    this.state.player.coins += achievement.coins;
    this.state.stats.lifetimeCoins += achievement.coins;
    this.save();
    return achievement;
  }

  claimDailyReward(amount) {
    const today = localDateKey();
    if (this.state.daily.lastClaim === today) return false;
    this.state.daily.lastClaim = today;
    this.state.player.coins += amount;
    this.state.stats.lifetimeCoins += amount;
    this.refreshAchievements();
    this.save();
    return true;
  }

  canClaimDaily() {
    return this.state.daily.lastClaim !== localDateKey();
  }

  setTheme(themeId) {
    const theme = THEMES.find((item) => item.id === themeId);
    if (!theme || this.state.player.currentLevel < theme.level) return false;
    this.state.player.theme = themeId;
    this.save();
    return true;
  }

  reset() {
    this.state = defaultState();
    this.initializeDaily();
    this.save();
  }

  exportSave() {
    return JSON.stringify(this.state, null, 2);
  }
}

export const store = new Store();

export function playerLevelFromXp(xp) {
  let level = 1;
  let remaining = xp;
  let needed = 100;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = 100 + (level - 1) * 25;
  }
  return { level, current: remaining, needed, ratio: remaining / needed };
}
