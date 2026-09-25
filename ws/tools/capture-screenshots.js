const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Captures Google Play screenshots from the running web build (serve web/ on port 4173 first).
//   node tools/capture-screenshots.js            -> phone 1080x1920 (360x640 @3x)
//   node tools/capture-screenshots.js tablet     -> 10" tablet 1600x2560 (800x1280 @2x)
const ROOT = path.resolve(__dirname, '..');
const TABLET = process.argv.includes('tablet');
const OUT = path.join(ROOT, 'store-assets', TABLET ? 'screenshots-tablet' : 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

async function setState(page, mutate) {
  // Leave the running app first so its pagehide save cannot overwrite our staged capture state.
  await page.goto('http://127.0.0.1:4173/manifest.webmanifest', { waitUntil: 'domcontentloaded' });
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('wordsurge.save.v1')));
  mutate(state);
  await page.evaluate((value) => localStorage.setItem('wordsurge.save.v1', JSON.stringify(value)), state);
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.app-shell, #app');
  await page.waitForTimeout(250);
}

async function dragWord(page, word) {
  const used = new Set();
  const points = [];
  for (const char of word) {
    const buttons = page.locator('.letter-button');
    const count = await buttons.count();
    let found = null;
    for (let i = 0; i < count; i++) {
      if (used.has(i)) continue;
      if ((await buttons.nth(i).innerText()).trim() === char) {
        found = i;
        used.add(i);
        break;
      }
    }
    if (found === null) {
      const visible = await buttons.allInnerTexts();
      throw new Error(`Could not trace ${word}: missing ${char}; wheel=${visible.join('')}`);
    }
    const box = await buttons.nth(found).boundingBox();
    points.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(point.x, point.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false, animations: 'disabled' });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: TABLET ? { width: 800, height: 1280 } : { width: 360, height: 640 },
    deviceScaleFactor: TABLET ? 2 : 3,
    isMobile: true,
    hasTouch: true,
    locale: 'en-IN',
    timezoneId: 'Asia/Calcutta',
    colorScheme: 'light',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-action="play"]');

  const today = new Date();
  const todayKey = dateKey(today);
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const loginDates = Array.from({ length: 7 }, (_, i) => dateKey(addDays(today, -i))).reverse();
  const completionDates = {};
  for (let i = 1; i <= 24; i++) completionDates[String(i)] = dateKey(addDays(today, -(i % 6)));

  const common = (state) => {
    state.player.name = 'Surge Rider';
    state.player.avatar = 'W';
    state.player.coins = 2460;
    state.player.xp = 680;
    state.player.stars = 72;
    state.player.theme = 'beach';
    state.meta.tutorialComplete = true;
    state.meta.tutorialStep = 3;
    state.meta.brandVersion = 4;
    state.settings.reducedMotion = true;
    state.daily.lastOpen = todayKey;
    state.daily.currentStreak = 7;
    state.daily.bestStreak = 12;
    state.daily.loginDates = loginDates;
    state.daily.lastClaim = null;
    state.daily.lastWheel = null;
    state.daily.lastChest = null;
    state.progress.completedLevels = Array.from({ length: 24 }, (_, i) => i + 1);
    state.progress.completionDates = completionDates;
    state.progress.activeAttempts = {};
    state.progress.foundByLevel = {};
    state.stats.levelsCompleted = 24;
    state.stats.wordsFound = 96;
    state.stats.perfectLevels = 11;
    state.stats.bestCombo = 6;
    state.stats.bonusCoins = 430;
    state.stats.lifetimeCoins = 4110;
    state.achievements.unlocked = ['first_word', 'level_10', 'streak_7', 'combo_5'];
    state.achievements.claimed = ['first_word', 'level_10'];
  };

  // 1 — Home with system date and milestone progression.
  await setState(page, (state) => { common(state); state.player.currentLevel = 25; });
  await shot(page, '01-home-system-date.png');

  // 2 — Basic route, visible 60-second timer, one completed word.
  await setState(page, (state) => { common(state); state.player.currentLevel = 4; state.progress.completedLevels = [1, 2, 3]; state.stats.levelsCompleted = 3; });
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  await dragWord(page, 'POT');
  await shot(page, '02-basic-route-30s.png');

  // 3 — Complex Surge Bonus with a visible combo and 40-second timer.
  await setState(page, (state) => { common(state); state.player.currentLevel = 5; state.progress.completedLevels = [1, 2, 3, 4]; state.stats.levelsCompleted = 4; });
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  await dragWord(page, 'STOP');
  await dragWord(page, 'POST');
  await shot(page, '03-complex-surge-bonus-60s.png');

  // 4 — Expert Treasure Chest route with 30-second timer.
  await setState(page, (state) => { common(state); state.player.currentLevel = 10; state.progress.completedLevels = Array.from({ length: 9 }, (_, i) => i + 1); state.stats.levelsCompleted = 9; });
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  await dragWord(page, 'HEART');
  await shot(page, '04-expert-treasure-chest-60s.png');

  // 5 — Device-calendar daily, weekly and monthly challenge widgets.
  await setState(page, (state) => { common(state); state.player.currentLevel = 25; });
  await page.click('[data-action="nav"][data-screen="challenges"]');
  await page.waitForSelector('.challenge-list');
  await shot(page, '05-calendar-challenges.png');

  // 6 — Profile, statistics and progression.
  await page.click('[data-action="nav"][data-screen="profile"]');
  await page.waitForSelector('.profile-hero');
  await shot(page, '06-profile-statistics.png');

  // 7 — Theme collection surface (extra promotional option).
  await page.click('[data-action="themes"]');
  await page.waitForSelector('.theme-grid');
  await shot(page, '07-theme-collection.png');

  await browser.close();
  console.log(`Captured screenshots in ${OUT}`);
})();
