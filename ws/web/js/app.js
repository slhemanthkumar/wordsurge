// WordSurge UI: screen rendering, input handling, timers, rewards, and system-calendar refresh.
import { ACHIEVEMENTS, DAILY_REWARDS, THEMES, getDailyLevel, getDifficulty, getLevel, getMilestoneBonus } from './data.js';
import { GameEngine } from './game.js';
import { localDateKey, playerLevelFromXp, store } from './state.js';
import { analytics, audio, haptic } from './services.js';

// The Android shell appends "WordSurge/<version>" to its user agent.
const IS_SHELL = /WordSurge\//.test(navigator.userAgent);

// PUBLISHER: replace the three example.com URLs with the publicly hosted legal pages before release.
const LINKS = {
  privacy: 'https://example.com/wordsurge/privacy-policy.html',
  terms: 'https://example.com/wordsurge/terms.html',
  support: 'https://example.com/wordsurge/support.html',
  // Inside the Android app, market:// opens the Play Store app directly; the web build uses the https URL.
  store: IS_SHELL ? 'market://details?id=ai.arena.wordsurge' : 'https://play.google.com/store/apps/details?id=ai.arena.wordsurge'
};

const app = document.querySelector('#app');
const portal = document.querySelector('#portal');
let screen = 'home';
let engine = null;
let gameMode = 'level';
let selection = [];
let pointerActive = false;
let activePointerId = null;
let tutorialPrompted = false;
let toastTimer = null;
let gameFinishing = false;
let levelCombo = 0;
let levelTimerId = null;
let levelTimerEndsAt = 0;
let levelTimerSeconds = 0;
let timerStarted = false;
let renderedDateKey = localDateKey();
const particlePool = [];

const icon = (name, className = '') => `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const brandLockup = (label = 'WordSurge') => `<div class="brand"><span class="brand-mark"><img src="assets/icon-192.png" alt="" /></span><span class="brand-name">${label}</span></div>`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function mixHex(hex, target = '#ffffff', amount = 0.5) {
  const parse = (value) => value.replace('#', '').match(/.{2}/g).map((part) => Number.parseInt(part, 16));
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(target);
  return `rgb(${Math.round(r1 + (r2 - r1) * amount)}, ${Math.round(g1 + (g2 - g1) * amount)}, ${Math.round(b1 + (b2 - b1) * amount)})`;
}

function systemDateContext(date = new Date()) {
  const locale = navigator.language || 'en-IN';
  const format = (options) => new Intl.DateTimeFormat(locale, options).format(date);
  return {
    key: localDateKey(date),
    full: format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    friendly: format({ weekday: 'long', day: 'numeric', month: 'short' }),
    short: format({ day: 'numeric', month: 'short' }),
    weekday: format({ weekday: 'short' }),
    monthYear: format({ month: 'long', year: 'numeric' })
  };
}

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function applyAppearance() {
  const theme = THEMES.find((item) => item.id === store.state.player.theme) || THEMES[0];
  [app, portal].forEach((surface) => {
    surface.style.setProperty('--bg-deep', theme.colors[0]);
    surface.style.setProperty('--bg-mid', theme.colors[1]);
    surface.style.setProperty('--bg-light', theme.colors[2]);
    surface.style.setProperty('--accent', theme.accent);
    surface.style.setProperty('--accent-2', mixHex(theme.accent, '#ffffff', 0.48));
    THEMES.forEach((item) => surface.classList.remove(`theme-${item.id}`));
    surface.classList.add(`theme-${theme.id}`);
    surface.classList.toggle('dark', store.state.settings.darkMode);
    surface.classList.toggle('reduced-motion', store.state.settings.reducedMotion);
    surface.classList.toggle('large-text', store.state.settings.largeText);
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors[0]);
}

function sceneArt() {
  return `<div class="scene-art" aria-hidden="true"><i class="floating-leaf"></i><i class="floating-leaf"></i><i class="floating-leaf"></i></div>`;
}

function currencyPill() {
  return `<button class="currency-pill" data-action="coin-shop" aria-label="${store.state.player.coins} coins">${icon('coin')}<span data-coin-count>${store.state.player.coins.toLocaleString()}</span></button>`;
}

function bottomNav(active) {
  const items = [
    ['home', 'Home', 'home'],
    ['challenges', 'Daily', 'calendar'],
    ['achievements', 'Awards', 'trophy'],
    ['profile', 'Profile', 'user']
  ];
  return `<nav class="bottom-nav" aria-label="Main navigation">${items.map(([id, label, iconName]) => `
    <button class="nav-item ${active === id ? 'active' : ''}" data-action="nav" data-screen="${id}" aria-label="${label}">
      ${icon(iconName)}<span>${label}</span>
    </button>`).join('')}</nav>`;
}

function themeName() {
  return (THEMES.find((item) => item.id === store.state.player.theme) || THEMES[0]).name;
}

function renderHome() {
  stopLevelTimer();
  const state = store.state;
  const today = systemDateContext();
  const periods = challengePeriods();
  const loggedDates = new Set(state.daily.loginDates || []);
  const playerXp = playerLevelFromXp(state.player.xp);
  const progressInChapter = ((state.player.currentLevel - 1) % 25) / 25;
  const nextPuzzle = getLevel(state.player.currentLevel);
  const nextDifficulty = getDifficulty(nextPuzzle);
  const nextMilestone = getMilestoneBonus(state.player.currentLevel);
  const activeAttempt = store.getAttempt(state.player.currentLevel);
  const attemptRemaining = activeAttempt ? Math.max(0, Math.ceil((activeAttempt.endsAt - Date.now()) / 1000)) : null;
  const levelsToChest = 10 - ((state.player.currentLevel - 1) % 10);
  const dailyReady = store.canClaimDaily();
  app.innerHTML = `${sceneArt()}
    <main class="screen home-light">
      <header class="topbar">
        ${brandLockup()}
        <div class="top-actions">
          <div class="streak-pill" aria-label="${state.daily.currentStreak} day streak">${icon('flame')}<span>${state.daily.currentStreak}</span></div>
          ${currencyPill()}
          <button class="icon-button" data-action="settings" aria-label="Open settings">${icon('settings')}</button>
        </div>
      </header>
      <section class="greeting">
        <p class="eyebrow">${today.friendly} · Player level ${playerXp.level}</p>
        <h1>Catch the next word surge.</h1>
        <p>Beat the clock, build combos, and unlock your next reward.</p>
      </section>
      <section class="journey-card glass-card" aria-label="Current journey">
        <div class="level-kicker"><span class="dot"></span>${nextMilestone.coins ? `${nextMilestone.label} · +${nextMilestone.coins} coins` : `Level ${state.player.currentLevel}`}</div>
        <h2>${themeName()}</h2>
        <p>${attemptRemaining !== null ? `Active attempt · ${formatTimer(attemptRemaining)} remaining` : `${nextDifficulty.label} route · ${nextPuzzle.letters.length} letters · ${nextDifficulty.seconds}s fixed timer`}</p>
        <div class="level-progress">
          <div class="progress-label"><span>World progress</span><strong>${Math.round(progressInChapter * 100)}%</strong></div>
          <div class="progress-track"><div class="progress-fill" style="width:${Math.max(4, progressInChapter * 100)}%"></div></div>
        </div>
        <button class="primary-button" data-action="play">${icon('play','fill')}<span>${attemptRemaining !== null ? `Resume · ${formatTimer(attemptRemaining)}` : state.player.currentLevel === 1 ? 'Start journey' : 'Continue'}</span></button>
      </section>
      <div class="section-heading"><div><h2>Today</h2><small class="system-date-label">${today.full}</small></div><button data-action="nav" data-screen="challenges">View all</button></div>
      <section class="quick-grid">
        <button class="quick-card reward" data-action="daily-reward">
          <span class="quick-icon">${icon('gift')}</span><h3>Daily gift</h3><p>${today.short} · ${dailyReady ? `Day ${((state.daily.currentStreak - 1) % 7) + 1} ready` : 'Claimed today'}</p>
          ${dailyReady ? '<span class="badge">Claim</span>' : ''}
        </button>
        <button class="quick-card" data-action="daily-challenge">
          <span class="quick-icon">${icon('calendar')}</span><h3>Daily puzzle</h3><p>${today.weekday} ${today.short} · ${state.progress.dailyCompleted.includes(`daily-${today.key}`) ? 'Complete' : 'Ready'}</p>
          <div class="mini-progress"><span style="width:${state.progress.dailyCompleted.includes(`daily-${today.key}`) ? 100 : 0}%"></span></div>
        </button>
        <button class="quick-card" data-action="nav" data-screen="achievements">
          <span class="quick-icon">${icon('trophy')}</span><h3>Achievements</h3><p>${state.achievements.unlocked.length} of ${ACHIEVEMENTS.length} unlocked</p>
        </button>
        <button class="quick-card" data-action="themes">
          <span class="quick-icon">${icon('palette')}</span><h3>Theme store</h3><p>${THEMES.filter((item) => state.player.currentLevel >= item.level).length} environments ready</p>
        </button>
      </section>
      <button class="bonus-track glass-card" data-action="play" aria-label="Milestone reward progress">
        <span class="bonus-track-icon">${icon('gift')}</span><span class="bonus-track-copy"><strong>Treasure Chest</strong><small>${levelsToChest === 1 ? 'Next level unlocks 120 bonus coins' : `${levelsToChest} levels to 120 bonus coins`}</small></span>
        <span class="bonus-track-meter"><i style="width:${((10 - levelsToChest) / 10) * 100}%"></i></span>${icon('chevron')}
      </button>
      <section class="weekly-strip glass-card" aria-label="System calendar week">
        <div class="weekly-label"><strong>${periods.weekLabel}</strong><span>${loggedDates.size ? 'Login calendar' : 'This week'}</span></div>
        <div class="weekly-days">${periods.weekDays.map((date) => {
          const context = systemDateContext(date);
          const logged = loggedDates.has(context.key);
          return `<span class="day-dot ${logged ? 'done' : ''} ${context.key === today.key ? 'today' : ''}"><small>${context.weekday.slice(0, 1)}</small><strong>${date.getDate()}</strong></span>`;
        }).join('')}</div>
      </section>
    </main>
    ${bottomNav('home')}`;
  screen = 'home';
  applyAppearance();
}

function challengePeriods() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
  const weekKey = localDateKey(monday);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dates = Object.values(store.state.progress.completionDates || {});
  const locale = navigator.language || 'en-IN';
  const shortDate = (date) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  return {
    weekKey,
    monthKey,
    weekDays,
    weekLabel: `${shortDate(monday)}–${shortDate(sunday)}`,
    monthLabel: systemDateContext(now).monthYear,
    weekly: dates.filter((date) => date >= weekKey && date <= localDateKey(sunday)).length,
    monthly: dates.filter((date) => date.startsWith(monthKey)).length
  };
}

function renderChallenges() {
  const state = store.state;
  const today = systemDateContext();
  const periods = challengePeriods();
  const dailyDone = state.progress.dailyCompleted.includes(`daily-${today.key}`);
  const weeklyProgress = Math.min(7, periods.weekly);
  const monthlyProgress = Math.min(30, periods.monthly);
  const wheelReady = state.daily.lastWheel !== today.key;
  const chestReady = state.daily.lastChest !== today.key;
  app.innerHTML = `${sceneArt()}
    <main class="screen inner-screen">
      <header class="topbar">
        ${brandLockup('Challenges')}
        <div class="top-actions">${currencyPill()}</div>
      </header>
      <section class="page-intro"><p class="eyebrow">${today.full}</p><h2>Make today count.</h2><p>Daily, weekly, and monthly challenges follow your device calendar.</p></section>
      <section class="challenge-list">
        <article class="challenge-card">
          <div class="challenge-art">${icon('calendar')}</div>
          <div class="challenge-copy"><h3>Daily Challenge</h3><p>${today.friendly} · ${dailyDone ? 'Completed' : 'Ready to solve'}</p><div class="progress-track"><div class="progress-fill" style="width:${dailyDone ? 100 : 0}%"></div></div></div>
          ${dailyDone ? `<span class="reward-amount">${icon('check')} Done</span>` : `<button class="small-action" data-action="daily-challenge" aria-label="Play daily challenge">${icon('play','fill')}</button>`}
        </article>
        <article class="challenge-card">
          <div class="challenge-art gold">${icon('trophy')}</div>
          <div class="challenge-copy"><h3>Weekly Trail</h3><p>${periods.weekLabel} · ${weeklyProgress}/7 levels</p><div class="progress-track"><div class="progress-fill" style="width:${weeklyProgress / 7 * 100}%"></div></div></div>
          ${weeklyProgress >= 7 && state.daily.weeklyClaim !== periods.weekKey ? `<button class="claim-button" data-action="claim-period" data-period="weekly">Claim 150</button>` : `<span class="reward-amount">${state.daily.weeklyClaim === periods.weekKey ? icon('check') + ' Done' : icon('coin') + ' 150'}</span>`}
        </article>
        <article class="challenge-card">
          <div class="challenge-art purple">${icon('crown')}</div>
          <div class="challenge-copy"><h3>Monthly Mastery</h3><p>${periods.monthLabel} · ${monthlyProgress}/30 levels</p><div class="progress-track"><div class="progress-fill" style="width:${monthlyProgress / 30 * 100}%"></div></div></div>
          ${monthlyProgress >= 30 && state.daily.monthlyClaim !== periods.monthKey ? `<button class="claim-button" data-action="claim-period" data-period="monthly">Claim 500</button>` : `<span class="reward-amount">${state.daily.monthlyClaim === periods.monthKey ? icon('check') + ' Done' : icon('coin') + ' 500'}</span>`}
        </article>
        <article class="challenge-card">
          <div class="challenge-art gold">${icon('sparkles')}</div>
          <div class="challenge-copy"><h3>Lucky Spin</h3><p>${wheelReady ? 'Your daily spin is ready' : 'Another spin arrives tomorrow'}</p></div>
          <button class="small-action" data-action="lucky-spin" ${wheelReady ? '' : 'disabled'} aria-label="Open lucky spin">${icon('chevron')}</button>
        </article>
        <article class="challenge-card">
          <div class="challenge-art">${icon('gift')}</div>
          <div class="challenge-copy"><h3>Mystery Chest</h3><p>${chestReady ? 'Open today’s calm little surprise' : 'Opened · check back tomorrow'}</p></div>
          <button class="small-action" data-action="mystery-chest" ${chestReady ? '' : 'disabled'} aria-label="Open mystery chest">${icon('chevron')}</button>
        </article>
      </section>
    </main>${bottomNav('challenges')}`;
  screen = 'challenges';
  applyAppearance();
}

function achievementValues() {
  return {
    ...store.state.stats,
    bestStreak: store.state.daily.bestStreak,
    themesUnlocked: THEMES.filter((theme) => store.state.player.currentLevel >= theme.level).length
  };
}

function renderAchievementRows() {
  store.refreshAchievements();
  const values = achievementValues();
  return ACHIEVEMENTS.map((item) => {
    const value = values[item.metric] || 0;
    const unlocked = store.state.achievements.unlocked.includes(item.id);
    const claimed = store.state.achievements.claimed.includes(item.id);
    return `<article class="achievement-row">
      <div class="achievement-badge ${unlocked ? '' : 'locked'}">${icon(unlocked ? item.icon : 'lock')}</div>
      <div class="achievement-copy"><h3>${item.title}</h3><p>${item.description} · ${Math.min(value, item.target).toLocaleString()}/${item.target.toLocaleString()}</p><div class="progress-track"><div class="progress-fill" style="width:${clamp(value / item.target * 100, 0, 100)}%"></div></div></div>
      ${unlocked && !claimed ? `<button class="claim-button" data-action="claim-achievement" data-id="${item.id}">+${item.coins}</button>` : `<button class="claim-button" disabled>${claimed ? 'Claimed' : icon('lock')}</button>`}
    </article>`;
  }).join('');
}

function renderAchievements() {
  app.innerHTML = `${sceneArt()}<main class="screen inner-screen">
    <header class="topbar">${brandLockup('Achievements')}<div class="top-actions">${currencyPill()}</div></header>
    <section class="page-intro"><p class="eyebrow">${store.state.achievements.unlocked.length} unlocked</p><h2>Your word legacy.</h2><p>Milestones reward curiosity, consistency, and skill.</p></section>
    <section class="achievement-list" data-achievement-list>${renderAchievementRows()}</section>
  </main>${bottomNav('achievements')}`;
  screen = 'achievements';
  applyAppearance();
}

function formatPlayTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function renderProfile() {
  const state = store.state;
  const playerXp = playerLevelFromXp(state.player.xp);
  const success = state.stats.wordsFound ? Math.round((state.stats.wordsFound / (state.stats.wordsFound + state.stats.failedWords)) * 100) : 100;
  app.innerHTML = `${sceneArt()}<main class="screen inner-screen">
    <header class="topbar">${brandLockup('Profile')}<div class="top-actions"><button class="icon-button" data-action="settings" aria-label="Settings">${icon('settings')}</button></div></header>
    <section class="profile-hero"><div class="avatar-ring"><div class="avatar">${state.player.avatar}</div></div><h2>${state.player.name}</h2><p>Player level ${playerXp.level} · ${themeName()}</p></section>
    <section class="xp-card glass-card"><div class="xp-head"><strong>Next player level</strong><span>${playerXp.current}/${playerXp.needed} XP</span></div><div class="progress-track"><div class="progress-fill" style="width:${playerXp.ratio * 100}%"></div></div></section>
    <section class="stats-grid">
      <article class="stat-card">${icon('flag')}<strong>${state.stats.levelsCompleted}</strong><span>Levels</span></article>
      <article class="stat-card">${icon('sparkles')}<strong>${state.stats.wordsFound}</strong><span>Words</span></article>
      <article class="stat-card">${icon('flame')}<strong>${state.daily.bestStreak}</strong><span>Best streak</span></article>
      <article class="stat-card">${icon('star')}<strong>${state.player.stars}</strong><span>Stars</span></article>
      <article class="stat-card">${icon('chart')}<strong>${success}%</strong><span>Accuracy</span></article>
      <article class="stat-card">${icon('calendar')}<strong>${formatPlayTime(state.stats.totalPlaySeconds)}</strong><span>Play time</span></article>
    </section>
    <section class="menu-list">
      <button class="menu-row" data-action="themes">${icon('palette')}<strong>Theme store</strong><small>${THEMES.filter((item) => state.player.currentLevel >= item.level).length}/${THEMES.length}</small>${icon('chevron')}</button>
      <button class="menu-row" data-action="statistics">${icon('chart')}<strong>Lifetime statistics</strong>${icon('chevron')}</button>
      <button class="menu-row" data-action="settings">${icon('settings')}<strong>Settings & accessibility</strong>${icon('chevron')}</button>
    </section>
  </main>${bottomNav('profile')}`;
  screen = 'profile';
  applyAppearance();
}

function crosswordHTML() {
  const { layout } = engine;
  return `<div class="crossword-grid" role="grid" aria-label="Crossword puzzle" style="--cols:${layout.cols};--rows:${layout.rows}">
    ${[...layout.cells.values()].map((cell) => {
      const visible = engine.isCellVisible(cell);
      const hinted = engine.revealedCells.has(cell.key);
      return `<div class="cross-cell ${visible ? 'visible' : ''} ${hinted ? 'hinted' : ''}" role="gridcell" data-cell="${cell.key}" style="grid-row:${cell.row + 1};grid-column:${cell.col + 1}" aria-label="${visible ? cell.char : 'empty letter'}">${visible ? cell.char : ''}</div>`;
    }).join('')}
  </div>`;
}

function wheelHTML() {
  const count = engine.wheelLetters.length;
  const radius = count >= 7 ? 39 : count >= 5 ? 37 : 34;
  return `<div class="letter-wheel" data-wheel aria-label="Letter wheel">
    <svg class="swipe-lines" viewBox="0 0 100 100" preserveAspectRatio="none"><path class="swipe-path" data-swipe-path d=""></path></svg>
    ${engine.wheelLetters.map((letter, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
      const left = 50 + Math.cos(angle) * radius;
      const top = 50 + Math.sin(angle) * radius;
      return `<button class="letter-button" data-letter-index="${index}" style="left:${left}%;top:${top}%" aria-label="Letter ${letter}">${letter}</button>`;
    }).join('')}
    <button class="shuffle-center" data-action="shuffle" aria-label="Shuffle letters">${icon('shuffle')}</button>
  </div>`;
}

function fitCrossword() {
  if (!engine || screen !== 'game') return;
  const wrap = app.querySelector('.crossword-wrap');
  const grid = app.querySelector('.crossword-grid');
  if (!wrap || !grid) return;
  const gap = Number.parseFloat(getComputedStyle(grid).gap) || 3;
  const width = Math.max(160, wrap.clientWidth - 8);
  const height = Math.max(150, wrap.clientHeight - 8);
  const maxCell = app.classList.contains('theme-beach') ? 66 : 44;
  const cell = Math.max(19, Math.min(maxCell, Math.floor((width - gap * (engine.layout.cols - 1)) / engine.layout.cols), Math.floor((height - gap * (engine.layout.rows - 1)) / engine.layout.rows)));
  grid.style.width = `${cell * engine.layout.cols + gap * (engine.layout.cols - 1)}px`;
  grid.style.height = `${cell * engine.layout.rows + gap * (engine.layout.rows - 1)}px`;
}

function stopLevelTimer() {
  if (levelTimerId) window.clearInterval(levelTimerId);
  levelTimerId = null;
  levelTimerEndsAt = 0;
  timerStarted = false;
}

function formatTimer(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function updateLevelTimer() {
  if (!timerStarted || screen !== 'game' || gameFinishing) return;
  const remaining = Math.max(0, Math.ceil((levelTimerEndsAt - Date.now()) / 1000));
  const timer = app.querySelector('[data-level-timer]');
  if (timer) {
    timer.querySelector('strong').textContent = formatTimer(remaining);
    timer.classList.toggle('warning', remaining <= 15 && remaining > 5);
    timer.classList.toggle('danger', remaining <= 5);
    timer.setAttribute('aria-label', `${remaining} seconds remaining`);
  }
  if (remaining > 0) return;
  handleLevelTimeout();
}

function startLevelTimer() {
  if (!engine || screen !== 'game' || gameFinishing || timerStarted) return;
  const attempt = store.startAttempt(engine.level.id, levelTimerSeconds);
  levelTimerEndsAt = attempt.endsAt;
  timerStarted = true;
  updateLevelTimer();
  if (!gameFinishing) levelTimerId = window.setInterval(updateLevelTimer, 250);
}

function handleLevelTimeout() {
  if (!engine || gameFinishing) return;
  const expiredLevel = engine.level.id;
  stopLevelTimer();
  gameFinishing = true;
  pointerActive = false;
  clearSelection();
  store.recordTimeout(expiredLevel);
  audio.play('wrong');
  haptic([40, 50, 40]);
  analytics.track('level_timed_out', { level: expiredLevel, mode: gameMode, found: engine.found.size, total: engine.answers.length });
  showModal(`<section class="level-complete timeout-card">
    <div class="completion-orb timer-orb"><strong>0:00</strong></div>
    <p class="eyebrow">This surge has ended</p>
    <h2>Time’s up</h2>
    <p>You found ${engine.found.size} of ${engine.answers.length} words. The board resets for a fair new attempt—time cannot be extended.</p>
    <button class="primary-button" style="margin-top:20px" data-action="retry-level">Try again</button>
    <button class="secondary-button" data-action="back-home">Return home</button>
  </section>`, true, false);
}

function renderGame() {
  const difficulty = getDifficulty(engine.level);
  const milestone = gameMode === 'daily' ? { coins: 0, label: '' } : getMilestoneBonus(engine.level.id);
  const dailyDate = gameMode === 'daily' ? systemDateContext(dateFromKey(String(engine.level.id).replace('daily-', ''))) : null;
  const title = gameMode === 'daily' ? `Daily · ${dailyDate.short}` : milestone.coins ? `${milestone.label} · ${engine.level.id}` : `Level ${engine.level.id}`;
  const activeTheme = THEMES.find((item) => item.id === store.state.player.theme) || THEMES[0];
  const foundCount = engine.found.size;
  levelTimerSeconds = difficulty.seconds;
  app.innerHTML = `${sceneArt()}<main class="game-screen difficulty-${difficulty.id} ${milestone.coins ? 'bonus-level' : ''}">
    <header class="game-topbar">
      <button class="icon-button" data-action="back-home" aria-label="Back to home">${icon('back')}</button>
      <div class="game-title"><strong>${title}</strong><span>${difficulty.label} · ${activeTheme.short} · ${foundCount}/${engine.answers.length}</span></div>
      <div class="game-hud"><div class="level-timer" data-level-timer role="timer" aria-live="off" aria-label="${difficulty.seconds} seconds remaining"><i></i><span><small>TIME</small><strong>${formatTimer(difficulty.seconds)}</strong></span></div>${currencyPill()}</div>
    </header>
    <div class="game-progress"><span style="width:${engine.progress * 100}%"></span></div>
    <section class="puzzle-stage"><div class="crossword-wrap">${crosswordHTML()}</div></section>
    <section class="play-zone">
      <div class="word-feedback-row"><div class="word-preview" data-word-preview aria-live="assertive"></div><div class="combo-badge" data-combo-badge>Surge ×2</div></div>
      <div class="wheel-row">${wheelHTML()}</div>
      <div class="hint-dock" aria-label="Hints">
        <button class="hint-button" data-action="hint-letter">${icon('bulb')}<span>Letter</span><span class="hint-count">${store.state.inventory.revealLetter}</span></button>
        <button class="hint-button" data-action="hint-word">${icon('eye')}<span>Word</span><span class="hint-count">${store.state.inventory.revealWord}</span></button>
        <button class="hint-button" data-action="hint-smart">${icon('sparkles')}<span>Smart</span><span class="hint-count">${store.state.inventory.smartHint}</span></button>
      </div>
    </section>
  </main>`;
  screen = 'game';
  gameFinishing = false;
  applyAppearance();
  requestAnimationFrame(fitCrossword);
  if (!store.state.meta.tutorialComplete && engine.level.id === 1 && !tutorialPrompted) {
    tutorialPrompted = true;
    window.setTimeout(showTutorialStart, 380);
  } else {
    window.setTimeout(startLevelTimer, 300);
  }
}

function openGame(mode = 'level') {
  stopLevelTimer();
  closeModal();
  gameMode = mode;
  levelCombo = 0;
  const level = mode === 'daily' ? getDailyLevel(localDateKey()) : getLevel(store.state.player.currentLevel);
  const existing = store.state.progress.foundByLevel[String(level.id)] || [];
  engine = new GameEngine(level, existing);
  selection = [];
  renderGame();
  analytics.track('level_started', { level: level.id, mode, handcrafted: Boolean(level.handcrafted) });
}

function navigate(next) {
  closeModal();
  if (next === 'home') renderHome();
  if (next === 'challenges') renderChallenges();
  if (next === 'achievements') renderAchievements();
  if (next === 'profile') renderProfile();
  window.scrollTo(0, 0);
  analytics.track('screen_viewed', { screen: next });
}

function updateHUD() {
  app.querySelectorAll('[data-coin-count]').forEach((node) => { node.textContent = store.state.player.coins.toLocaleString(); });
  if (screen !== 'game' || !engine) return;
  const title = app.querySelector('.game-title');
  if (title) {
    const activeTheme = THEMES.find((item) => item.id === store.state.player.theme) || THEMES[0];
    const difficulty = getDifficulty(engine.level);
    title.querySelector('span').textContent = `${difficulty.label} · ${activeTheme.short} · ${engine.found.size}/${engine.answers.length}`;
  }
  const progress = app.querySelector('.game-progress span');
  if (progress) progress.style.width = `${engine.progress * 100}%`;
}

function updateGrid(placement = null) {
  const cells = placement?.cells || [...engine.layout.cells.keys()];
  cells.forEach((key, index) => {
    window.setTimeout(() => {
      const element = app.querySelector(`[data-cell="${key}"]`);
      const cell = engine.layout.cells.get(key);
      if (!element || !cell || !engine.isCellVisible(cell)) return;
      element.textContent = cell.char;
      element.classList.add('visible');
      if (engine.revealedCells.has(key)) element.classList.add('hinted');
      element.classList.add('spark');
      window.setTimeout(() => element.classList.remove('spark'), 700);
    }, index * 65);
  });
  updateHUD();
}

function clearSelection(delay = 0) {
  window.setTimeout(() => {
    selection = [];
    app.querySelectorAll('.letter-button.selected').forEach((button) => button.classList.remove('selected'));
    const path = app.querySelector('[data-swipe-path]');
    if (path) path.setAttribute('d', '');
    const preview = app.querySelector('[data-word-preview]');
    if (preview) {
      preview.className = 'word-preview';
      preview.textContent = '';
    }
  }, delay);
}

function updateSelection(point = null) {
  const preview = app.querySelector('[data-word-preview]');
  const wheel = app.querySelector('[data-wheel]');
  const path = app.querySelector('[data-swipe-path]');
  if (!preview || !wheel || !path) return;
  const word = selection.map((index) => engine.wheelLetters[index]).join('');
  preview.textContent = word;
  preview.classList.toggle('active', Boolean(word));
  const rect = wheel.getBoundingClientRect();
  const coords = selection.map((index) => {
    const button = wheel.querySelector(`[data-letter-index="${index}"]`);
    return [button.offsetLeft + button.offsetWidth / 2, button.offsetTop + button.offsetHeight / 2];
  });
  if (point) coords.push([clamp(point.x - rect.left, 0, rect.width), clamp(point.y - rect.top, 0, rect.height)]);
  if (!coords.length) return path.setAttribute('d', '');
  const scaleX = 100 / rect.width;
  const scaleY = 100 / rect.height;
  path.setAttribute('d', coords.map(([x, y], i) => `${i ? 'L' : 'M'} ${x * scaleX} ${y * scaleY}`).join(' '));
}

function addSelectedIndex(index) {
  if (!pointerActive || selection.includes(index)) return;
  selection.push(index);
  app.querySelector(`[data-letter-index="${index}"]`)?.classList.add('selected');
  audio.play('select');
  haptic(7);
  updateSelection();
}

function submitSelection() {
  if (!engine || !selection.length || gameFinishing) return clearSelection();
  const word = selection.map((index) => engine.wheelLetters[index]).join('');
  const result = engine.submit(word);
  const preview = app.querySelector('[data-word-preview]');
  if (result.status === 'correct') {
    preview?.classList.add('correct');
    audio.play('correct');
    haptic([18, 35, 18]);
    store.recordWord(engine.level.id, result.word);
    levelCombo += 1;
    store.recordCombo(levelCombo);
    const baseWordCoins = Math.max(2, result.word.length - 1);
    const comboBonus = levelCombo >= 2 ? Math.min(10, levelCombo * 2) : 0;
    const wordCoins = baseWordCoins + comboBonus;
    store.addCoins(baseWordCoins);
    if (comboBonus) store.addBonusCoins(comboBonus);
    store.addXp(result.word.length * 2);
    const comboBadge = app.querySelector('[data-combo-badge]');
    if (comboBadge) {
      comboBadge.textContent = `Surge ×${levelCombo}${comboBonus ? ` · +${comboBonus}` : ''}`;
      comboBadge.classList.toggle('show', levelCombo >= 2);
    }
    updateGrid(result.placement);
    burstParticles(window.innerWidth / 2, window.innerHeight * .43, 10);
    flyCoin(wordCoins);
    analytics.track('word_found', { level: engine.level.id, wordLength: result.word.length, mode: gameMode });
    if (!store.state.meta.tutorialComplete && engine.level.id === 1 && store.state.meta.tutorialStep < 2 && !result.complete) {
      store.update('meta.tutorialStep', 2);
      window.setTimeout(showTutorialHint, 620);
    }
    if (result.complete) {
      stopLevelTimer();
      gameFinishing = true;
      window.setTimeout(finishLevel, 650);
    }
    clearSelection(380);
  } else {
    levelCombo = 0;
    app.querySelector('[data-combo-badge]')?.classList.remove('show');
    preview?.classList.add('wrong');
    audio.play('wrong');
    haptic(28);
    if (result.status === 'already') showToast('Already found — try another path');
    else store.recordFailure(engine.level.id);
    analytics.track('word_rejected', { level: engine.level.id, length: word.length, reason: result.status });
    clearSelection(430);
  }
}

function finishLevel() {
  stopLevelTimer();
  const daily = gameMode === 'daily';
  const perfect = engine.hintsUsed === 0;
  const difficulty = getDifficulty(engine.level);
  const milestone = daily ? { coins: 0, label: '' } : getMilestoneBonus(engine.level.id);
  const baseReward = daily ? 60 : 16 + engine.level.letters.length * 2 + engine.answers.length * 2;
  const complexityBonus = difficulty.coinBonus;
  const perfectBonus = perfect ? 15 : 0;
  const bonusCoins = complexityBonus + milestone.coins + perfectBonus;
  const totalCoins = baseReward + bonusCoins;
  const rawXp = daily ? 45 : 25 + engine.answers.length * 4;
  const xp = Math.round(rawXp * difficulty.xpMultiplier);
  store.completeLevel(engine.level.id, { perfect, daily });
  store.addCoins(baseReward);
  if (bonusCoins) store.addBonusCoins(bonusCoins);
  store.addXp(xp);
  if (!store.state.meta.tutorialComplete && engine.level.id === 1) {
    store.update('meta.tutorialComplete', true);
  }
  audio.play('complete');
  haptic([25, 50, 25, 50, 40]);
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
  analytics.track('level_completed', { level: engine.level.id, daily, perfect, hints: engine.hintsUsed, difficulty: difficulty.id, baseReward, complexityBonus, milestoneBonus: milestone.coins, perfectBonus, reward: totalCoins });
  showCompletion({ totalCoins, baseReward, complexityBonus, milestone, perfectBonus }, xp, perfect, daily, difficulty);
}

function useHint(kind) {
  const config = {
    letter: { inventory: 'revealLetter', price: 35, label: 'Reveal letter' },
    word: { inventory: 'revealWord', price: 70, label: 'Reveal word' },
    smart: { inventory: 'smartHint', price: 50, label: 'Smart hint' }
  }[kind];
  if (!config) return;
  if ((store.state.inventory[config.inventory] || 0) > 0) {
    store.useInventory(config.inventory);
    executeHint(kind);
    return;
  }
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><h2>${config.label}</h2><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <div class="reward-hero"><div class="reward-icon">${icon(kind === 'letter' ? 'bulb' : kind === 'word' ? 'eye' : 'sparkles')}</div><p>You’re out of this hint. Use ${config.price} coins now, or earn more from challenges.</p></div>
    <button class="primary-button" style="width:100%;margin-top:20px" data-action="buy-hint" data-kind="${kind}" data-price="${config.price}">${icon('coin')} Use ${config.price} coins</button>
    <p class="integration-note">Earn more coins from levels, Daily Gifts, achievements, and calendar challenges.</p>`);
}

function executeHint(kind, paid = false) {
  closeModal();
  let result;
  if (kind === 'letter') {
    result = engine.revealLetter();
    if (result) {
      updateGrid({ cells: [result.key] });
      showToast(`A letter glows: ${result.char}`);
    }
  }
  if (kind === 'word') {
    result = engine.revealWord();
    if (result) {
      store.recordWord(engine.level.id, result.word);
      updateGrid(result.placement);
      showToast(`${result.word} revealed`);
      if (result.complete) {
        stopLevelTimer();
        gameFinishing = true;
        window.setTimeout(finishLevel, 700);
      }
    }
  }
  if (kind === 'smart') {
    result = engine.getSmartHint();
    if (result) {
      const button = app.querySelector(`[data-letter-index="${result.index}"]`);
      button?.classList.add('smart');
      window.setTimeout(() => button?.classList.remove('smart'), 2200);
      showToast(`Try a ${result.wordLength}-letter word beginning with ${result.first}`);
    }
  }
  if (!result) showToast('Nothing left to reveal');
  else {
    audio.play('hint');
    haptic(16);
    analytics.track('hint_used', { type: kind, level: engine.level.id, paid });
  }
  updateHUD();
}

function shuffleWheel() {
  if (!engine || pointerActive) return;
  engine.shuffle();
  const oldButtons = [...app.querySelectorAll('.letter-button')];
  oldButtons.forEach((button) => { button.style.transform = 'scale(.6)'; button.style.opacity = '.3'; });
  window.setTimeout(() => {
    const wheel = app.querySelector('[data-wheel]');
    if (wheel) wheel.outerHTML = wheelHTML();
    audio.play('tap');
  }, 150);
  analytics.track('letters_shuffled', { level: engine.level.id });
}

function showCompletion(rewards, xp, perfect, daily, difficulty) {
  const rewardRows = [
    rewards.complexityBonus ? `<span>${difficulty.label} complexity <strong>+${rewards.complexityBonus}</strong></span>` : '',
    rewards.perfectBonus ? `<span>Perfect clear <strong>+${rewards.perfectBonus}</strong></span>` : '',
    rewards.milestone.coins ? `<span>${rewards.milestone.label} <strong>+${rewards.milestone.coins}</strong></span>` : ''
  ].filter(Boolean).join('');
  showModal(`<section class="level-complete ${rewards.milestone.coins ? 'milestone-complete' : ''}">
    <div class="completion-orb">${icon(rewards.milestone.coins ? 'gift' : perfect ? 'crown' : 'star')}</div>
    <p class="eyebrow">${rewards.milestone.coins ? rewards.milestone.label : perfect ? 'Perfect clear' : `${difficulty.label} cleared`}</p>
    <h2>${daily ? 'Daily complete!' : rewards.milestone.coins ? 'Bonus unlocked!' : 'Surge cleared!'}</h2>
    <p>${daily ? 'Today’s challenge is tucked away.' : `Level ${engine.level.id} is complete. Harder routes pay more.`}</p>
    <div class="complete-stats">
      <div class="complete-stat"><strong>+${rewards.totalCoins}</strong><span>Total coins</span></div>
      <div class="complete-stat"><strong>+${xp}</strong><span>XP</span></div>
      <div class="complete-stat"><strong>${perfect ? 3 : 2}</strong><span>Stars</span></div>
    </div>
    ${rewardRows ? `<div class="reward-breakdown">${rewardRows}</div>` : ''}
    <button class="primary-button" data-action="next-level">${daily ? 'Return home' : 'Next level'} ${icon('chevron')}</button>
    ${daily ? '' : '<button class="secondary-button" data-action="back-home">Take a break</button>'}
  </section>`, true, false);
}

function showTutorialStart() {
  if (screen !== 'game' || store.state.meta.tutorialComplete) return;
  portal.insertAdjacentHTML('beforeend', `<div class="tutorial-overlay" data-tutorial>
    <div class="coach-card wheel-coach"><h3>Start your first word surge</h3><p>Press a letter, glide through <strong>C → A → T</strong>, then lift. Your fixed timer begins when you start.</p><div class="coach-actions"><button data-action="skip-tutorial">Skip</button><button class="coach-primary" data-action="start-tutorial">Start timer</button></div></div>
  </div>`);
}

function showTutorialHint() {
  document.querySelector('[data-tutorial]')?.remove();
  portal.insertAdjacentHTML('beforeend', `<div class="tutorial-overlay" data-tutorial>
    <div class="coach-card hint-coach"><h3>A gentle nudge</h3><p>Hints can reveal a letter, solve a word, or suggest a smart starting point.</p><div class="coach-actions"><button class="coach-primary" data-action="tutorial-hint">Use a free word hint</button></div></div>
  </div>`);
}

function showModal(content, centered = false, closeable = true) {
  portal.innerHTML = `<div class="modal-backdrop ${centered ? 'centered' : ''}" data-modal-backdrop data-closeable="${closeable}">
    <div class="${centered ? 'modal-card' : 'bottom-sheet'}">${content}</div>
  </div>`;
}

function closeModal() {
  const modal = portal.querySelector('[data-modal-backdrop]');
  if (modal) modal.remove();
}

function showDailyReward() {
  const state = store.state;
  const today = systemDateContext();
  const dayIndex = (Math.max(1, state.daily.currentStreak) - 1) % 7;
  const ready = store.canClaimDaily();
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><div><h2>Daily gift</h2><small class="system-date-label">${today.full}</small></div><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <div class="reward-hero"><div class="reward-icon">${icon('gift')}</div><h2>${ready ? `${DAILY_REWARDS[dayIndex]} coins are ready` : 'See you tomorrow'}</h2><p>${state.daily.currentStreak}-day streak · Reward date ${today.short}.</p></div>
    <div class="daily-track">${DAILY_REWARDS.map((reward, index) => `<div class="daily-day ${index === dayIndex ? 'today' : ''} ${!ready && index === dayIndex ? 'claimed' : ''}"><span>D${index + 1}</span><strong>${reward}</strong></div>`).join('')}</div>
    <button class="primary-button" style="width:100%" data-action="claim-daily" data-reward="${DAILY_REWARDS[dayIndex]}" ${ready ? '' : 'disabled'}>${ready ? `${icon('coin')} Claim ${DAILY_REWARDS[dayIndex]}` : `${icon('check')} Claimed today`}</button>`);
}

function showThemes() {
  const currentLevel = store.state.player.currentLevel;
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><div><p class="eyebrow">New world every 25 levels</p><h2>Theme store</h2></div><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <div class="theme-grid">${THEMES.map((theme) => {
      const unlocked = currentLevel >= theme.level;
      const selected = store.state.player.theme === theme.id;
      return `<button class="theme-card ${unlocked ? '' : 'locked'} ${selected ? 'selected' : ''}" data-action="select-theme" data-theme="${theme.id}" style="--c1:${theme.colors[0]};--c2:${theme.colors[1]};--c3:${theme.colors[2]}" ${unlocked ? '' : 'aria-disabled="true"'}>
        ${icon(theme.icon)}${!unlocked ? `<span class="theme-lock">${icon('lock')}</span>` : selected ? `<span class="theme-lock">${icon('check')}</span>` : ''}
        <strong>${theme.name}</strong><small>${unlocked ? (selected ? 'Active' : 'Tap to use') : `Unlocks at level ${theme.level}`}</small>
      </button>`;
    }).join('')}</div>`);
}

function settingToggle(key, label, iconName) {
  return `<div class="setting-row">${icon(iconName)}<strong>${label}</strong><button class="switch ${store.state.settings[key] ? 'on' : ''}" role="switch" aria-checked="${store.state.settings[key]}" data-action="toggle-setting" data-setting="${key}" aria-label="Toggle ${label}"></button></div>`;
}

function showSettings() {
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><h2>Settings</h2><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <div class="settings-list">
      ${settingToggle('music', 'Music', 'wave')}${settingToggle('sound', 'Sound effects', 'sparkles')}${settingToggle('vibration', 'Vibration', 'flame')}${settingToggle('darkMode', 'Dark mode', 'sparkles')}${settingToggle('reducedMotion', 'Reduce motion', 'eye')}${settingToggle('largeText', 'Larger text', 'user')}
      <button class="setting-row" data-action="open-link" data-link="privacy">${icon('lock')}<strong>Privacy policy</strong>${icon('chevron')}</button>
      <button class="setting-row" data-action="open-link" data-link="terms">${icon('map')}<strong>Terms of play</strong>${icon('chevron')}</button>
      <button class="setting-row" data-action="open-link" data-link="support">${icon('user')}<strong>Help &amp; support</strong>${icon('chevron')}</button>
      <button class="setting-row" data-action="open-link" data-link="store">${icon('star')}<strong>Rate WordSurge</strong>${icon('chevron')}</button>
      <button class="setting-row" data-action="export-save">${icon('download')}<strong>Export local save</strong>${icon('chevron')}</button>
      <button class="setting-row danger-row" data-action="confirm-reset">${icon('reset')}<strong>Reset progress</strong>${icon('chevron')}</button>
    </div>`);
}

function showStatistics() {
  const s = store.state.stats;
  const accuracy = s.wordsFound ? Math.round(s.wordsFound / (s.wordsFound + s.failedWords) * 100) : 100;
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><h2>Lifetime statistics</h2><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <section class="stats-grid">
      <article class="stat-card"><strong>${s.levelsCompleted}</strong><span>Levels completed</span></article><article class="stat-card"><strong>${s.wordsFound}</strong><span>Words found</span></article><article class="stat-card"><strong>${s.perfectLevels}</strong><span>Perfect levels</span></article>
      <article class="stat-card"><strong>${accuracy}%</strong><span>Accuracy</span></article><article class="stat-card"><strong>${s.totalHints}</strong><span>Hints used</span></article><article class="stat-card"><strong>${s.longestWord}</strong><span>Longest word</span></article>
      <article class="stat-card"><strong>${s.lifetimeCoins.toLocaleString()}</strong><span>Coins collected</span></article><article class="stat-card"><strong>${s.dailyChallenges}</strong><span>Daily puzzles</span></article><article class="stat-card"><strong>${formatPlayTime(s.totalPlaySeconds)}</strong><span>Play time</span></article>
      <article class="stat-card"><strong>${s.bestCombo || 0}×</strong><span>Best Surge</span></article><article class="stat-card"><strong>${(s.bonusCoins || 0).toLocaleString()}</strong><span>Bonus coins</span></article><article class="stat-card"><strong>${s.timedOutLevels || 0}</strong><span>Timed attempts</span></article>
    </section>`);
}

function showCoinShop() {
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><h2>Coin purse</h2><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <div class="reward-hero"><div class="reward-icon">${icon('coin')}</div><h2>${store.state.player.coins.toLocaleString()} coins</h2><p>Earn coins from levels, complexity bonuses, Daily Gifts, achievements, Surge Bonuses, Treasure Chests, and calendar challenges.</p></div>
    <button class="primary-button" style="width:100%;margin-top:20px" data-action="close-modal">Keep surging</button>`);
}

function showLuckySpin() {
  const today = systemDateContext();
  if (store.state.daily.lastWheel === today.key) return showToast('Your next spin arrives tomorrow');
  const labels = [10, 25, 15, 40, 20, 60, 15, 30];
  showModal(`<div class="sheet-handle"></div><div class="sheet-head"><div><h2>Lucky spin</h2><small class="system-date-label">${today.full}</small></div><button class="sheet-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
    <div class="lucky-wheel" data-lucky-wheel>${labels.map((value, index) => {
      const angle = index * 45 + 22.5;
      const x = 50 + Math.cos((angle - 90) * Math.PI / 180) * 34;
      const y = 50 + Math.sin((angle - 90) * Math.PI / 180) * 34;
      return `<span class="wheel-label" style="left:${x}%;top:${y}%">${value}</span>`;
    }).join('')}</div>
    <button class="primary-button" style="width:100%" data-action="spin-now">Spin once</button>`);
}

function spinNow(button) {
  if (store.state.daily.lastWheel === localDateKey()) return;
  button.disabled = true;
  const rewards = [10, 25, 15, 40, 20, 60, 15, 30];
  const index = (new Date().getDate() * 7 + new Date().getMonth()) % rewards.length;
  const reward = rewards[index];
  const wheel = portal.querySelector('[data-lucky-wheel]');
  if (wheel) wheel.style.transform = `rotate(${1080 + (360 - index * 45)}deg)`;
  audio.play('tap');
  window.setTimeout(() => {
    store.state.daily.lastWheel = localDateKey();
    store.addCoins(reward);
    audio.play('reward');
    showToast(`The wheel found ${reward} coins!`);
    closeModal();
    if (screen === 'challenges') renderChallenges();
  }, store.state.settings.reducedMotion ? 100 : 2800);
}

function openMysteryChest() {
  const today = systemDateContext();
  if (store.state.daily.lastChest === today.key) return showToast('Today’s chest is already open');
  const reward = 20 + ((new Date().getDate() * 13) % 31);
  store.state.daily.lastChest = today.key;
  store.addCoins(reward);
  audio.play('reward');
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, 22);
  showModal(`<section class="level-complete"><div class="completion-orb">${icon('gift')}</div><p class="eyebrow">Mystery chest · ${today.short}</p><h2>Found ${reward} coins!</h2><p>A small reward for making time for words.</p><button class="primary-button" style="margin-top:20px" data-action="close-modal">Lovely</button></section>`, true);
}

function openExternal(url) {
  if (!url) return;
  // The Android shell intercepts non-app hosts and hands them to the system browser.
  if (IS_SHELL) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function burstParticles(x, y, count = 16) {
  if (store.state.settings.reducedMotion) return;
  const colors = ['var(--accent)', 'var(--accent-2)', '#fff', '#64bca0', '#e6857a'];
  for (let i = 0; i < count; i += 1) {
    const particle = particlePool.pop() || document.createElement('i');
    particle.className = '';
    particle.style.display = 'block';
    void particle.offsetWidth;
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = colors[i % colors.length];
    const angle = Math.PI * 2 * i / count;
    const distance = 45 + Math.random() * 85;
    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--ty', `${Math.sin(angle) * distance + 35}px`);
    particle.style.setProperty('--rot', `${Math.random() * 540}deg`);
    document.body.appendChild(particle);
    window.setTimeout(() => {
      particle.style.display = 'none';
      if (particlePool.length < 40) particlePool.push(particle);
      else particle.remove();
    }, 1000);
  }
}

function flyCoin(amount) {
  if (store.state.settings.reducedMotion) return;
  const target = app.querySelector('.currency-pill')?.getBoundingClientRect();
  if (!target) return;
  const coin = document.createElement('i');
  coin.className = 'coin-fly';
  coin.textContent = `+${amount}`;
  coin.style.left = `${window.innerWidth / 2}px`;
  coin.style.top = `${window.innerHeight * .46}px`;
  coin.style.setProperty('--to-x', `${target.left + target.width / 2}px`);
  coin.style.setProperty('--to-y', `${target.top + target.height / 2}px`);
  document.body.appendChild(coin);
  window.setTimeout(() => coin.remove(), 900);
}

async function handleAction(action, target) {
  if (!action) return;
  audio.startMusic();
  if (!['start-tutorial', 'tutorial-hint'].includes(action)) audio.play('tap');
  if (action === 'nav') navigate(target.dataset.screen);
  if (action === 'play') openGame('level');
  if (action === 'daily-challenge') {
    if (store.state.progress.dailyCompleted.includes(`daily-${localDateKey()}`)) showToast('Today’s puzzle is already complete');
    else openGame('daily');
  }
  if (action === 'back-home') { closeModal(); renderHome(); }
  if (action === 'settings') showSettings();
  if (action === 'themes') showThemes();
  if (action === 'statistics') showStatistics();
  if (action === 'coin-shop') showCoinShop();
  if (action === 'daily-reward') showDailyReward();
  if (action === 'close-modal') closeModal();
  if (action === 'shuffle') shuffleWheel();
  if (action === 'hint-letter') useHint('letter');
  if (action === 'hint-word') useHint('word');
  if (action === 'hint-smart') useHint('smart');
  if (action === 'buy-hint') {
    const price = Number(target.dataset.price);
    if (store.spendCoins(price)) executeHint(target.dataset.kind, true);
    else showToast('Not enough coins yet');
  }
  if (action === 'claim-daily') {
    const reward = Number(target.dataset.reward);
    if (store.claimDailyReward(reward)) {
      audio.play('reward');
      burstParticles(window.innerWidth / 2, window.innerHeight / 2, 25);
      showToast(`${reward} coins added`);
      closeModal();
      if (screen === 'home') renderHome();
    }
  }
  if (action === 'claim-achievement') {
    const item = store.claimAchievement(target.dataset.id);
    if (item) {
      audio.play('reward');
      showToast(`${item.title}: +${item.coins} coins`);
      renderAchievements();
    }
  }
  if (action === 'claim-period') {
    const periods = challengePeriods();
    const weekly = target.dataset.period === 'weekly';
    const progress = weekly ? periods.weekly : periods.monthly;
    const goal = weekly ? 7 : 30;
    const key = weekly ? periods.weekKey : periods.monthKey;
    const claimField = weekly ? 'weeklyClaim' : 'monthlyClaim';
    if (progress >= goal && store.state.daily[claimField] !== key) {
      store.state.daily[claimField] = key;
      store.addCoins(weekly ? 150 : 500);
      audio.play('reward');
      showToast(`${weekly ? 150 : 500} challenge coins added`);
      renderChallenges();
    }
  }
  if (action === 'select-theme') {
    const theme = THEMES.find((item) => item.id === target.dataset.theme);
    if (store.setTheme(target.dataset.theme)) {
      applyAppearance();
      audio.play('reward');
      showToast(`${theme.name} is now active`);
      showThemes();
    } else showToast(`Reach level ${theme.level} to unlock this world`);
  }
  if (action === 'toggle-setting') {
    const key = target.dataset.setting;
    store.state.settings[key] = !store.state.settings[key];
    store.save();
    target.classList.toggle('on', store.state.settings[key]);
    target.setAttribute('aria-checked', String(store.state.settings[key]));
    if (key === 'music') store.state.settings.music ? audio.startMusic() : audio.stopMusic();
    applyAppearance();
  }
  if (action === 'open-link') openExternal(LINKS[target.dataset.link]);
  if (action === 'export-save') {
    const blob = new Blob([store.exportSave()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `wordsurge-save-${localDateKey()}.json`; link.click();
    URL.revokeObjectURL(url);
  }
  if (action === 'confirm-reset') showModal(`<section class="level-complete"><div class="completion-orb">${icon('reset')}</div><h2>Reset your journey?</h2><p>This clears levels, coins, rewards, and settings from this device.</p><button class="primary-button" style="margin-top:20px;background:var(--danger);color:white" data-action="reset-progress">Reset everything</button><button class="secondary-button" data-action="close-modal">Keep my progress</button></section>`, true);
  if (action === 'reset-progress') { store.reset(); closeModal(); tutorialPrompted = false; renderHome(); }
  if (action === 'next-level') { closeModal(); dailyOrNext(); }
  if (action === 'retry-level') { closeModal(); openGame(gameMode); }
  if (action === 'lucky-spin') showLuckySpin();
  if (action === 'spin-now') spinNow(target);
  if (action === 'mystery-chest') openMysteryChest();
  if (action === 'start-tutorial') {
    document.querySelector('[data-tutorial]')?.remove();
    store.update('meta.tutorialStep', 1);
    showToast('Press C, glide to A and T, then lift');
    startLevelTimer();
  }
  if (action === 'skip-tutorial') {
    document.querySelector('[data-tutorial]')?.remove();
    store.update('meta.tutorialComplete', true);
    startLevelTimer();
  }
  if (action === 'tutorial-hint') {
    document.querySelector('[data-tutorial]')?.remove();
    if (store.state.inventory.revealWord > 0) store.useInventory('revealWord');
    executeHint('word');
    store.update('meta.tutorialStep', 3);
  }
}

function dailyOrNext() {
  if (gameMode === 'daily') {
    renderHome();
    return;
  }
  openGame('level');
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  handleAction(target.dataset.action, target);
});

portal.addEventListener('click', (event) => {
  if (event.target.matches('[data-modal-backdrop]') && event.target.dataset.closeable === 'true') closeModal();
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  handleAction(target.dataset.action, target);
});

app.addEventListener('pointerdown', (event) => {
  const button = event.target.closest('.letter-button');
  if (!button || screen !== 'game' || gameFinishing) return;
  event.preventDefault();
  pointerActive = true;
  activePointerId = event.pointerId;
  selection = [];
  app.querySelector('[data-wheel]')?.setPointerCapture?.(event.pointerId);
  addSelectedIndex(Number(button.dataset.letterIndex));
  updateSelection({ x: event.clientX, y: event.clientY });
});

app.addEventListener('pointermove', (event) => {
  if (!pointerActive || event.pointerId !== activePointerId) return;
  event.preventDefault();
  const under = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.letter-button');
  if (under && app.contains(under)) addSelectedIndex(Number(under.dataset.letterIndex));
  updateSelection({ x: event.clientX, y: event.clientY });
});

function endPointer(event) {
  if (!pointerActive || (event.pointerId !== undefined && event.pointerId !== activePointerId)) return;
  pointerActive = false;
  activePointerId = null;
  submitSelection();
}
app.addEventListener('pointerup', endPointer);
app.addEventListener('pointercancel', endPointer);

function refreshSystemCalendar() {
  const currentKey = localDateKey();
  if (currentKey === renderedDateKey) return false;
  renderedDateKey = currentKey;
  store.refreshSystemDate();
  if (screen === 'home') renderHome();
  else if (screen === 'challenges') renderChallenges();
  else if (screen === 'achievements') renderAchievements();
  else if (screen === 'profile') renderProfile();
  return true;
}

window.addEventListener('resize', () => requestAnimationFrame(fitCrossword));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshSystemCalendar();
    updateLevelTimer();
  }
});
window.setInterval(refreshSystemCalendar, 60000);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (portal.querySelector('[data-modal-backdrop]')) closeModal();
    else if (screen === 'game') renderHome();
  }
});

window.handleNativeBack = () => {
  const tutorial = portal.querySelector('[data-tutorial]');
  if (tutorial) {
    tutorial.remove();
    return true;
  }
  if (portal.querySelector('[data-modal-backdrop]')) {
    closeModal();
    return true;
  }
  if (screen !== 'home') {
    renderHome();
    return true;
  }
  return false;
};

window.addEventListener('error', (event) => analytics.track('client_error', { message: String(event.message || 'Unknown error').slice(0, 180) }));
window.addEventListener('unhandledrejection', (event) => analytics.track('client_error', { message: String(event.reason || 'Unhandled promise rejection').slice(0, 180) }));

store.subscribe(() => updateHUD());
applyAppearance();
renderHome();
analytics.track('app_opened', { level: store.state.player.currentLevel, returning: store.state.stats.sessions > 1 });

// Offline cache for the web/PWA build only; the Android shell already bundles every file.
if ('serviceWorker' in navigator && !IS_SHELL && location.protocol.startsWith('http')) {
  window.addEventListener('load', async () => {
    try {
      // Evict caches left behind by pre-release builds so a rebrand/redesign shows up immediately.
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith('wordsurge-shell-v3')).map((key) => caches.delete(key)));
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update();
    } catch { /* Offline cache is optional. */ }
  });
}
