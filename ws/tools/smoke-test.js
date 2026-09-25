// End-to-end smoke test of the web game in headless Chromium (mobile profile).
// Usage: serve web/ on port 4173, then:  node tools/smoke-test.js [baseUrl]
// Requires playwright (npm i playwright) and a Chromium download.
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const SHELL_UA = 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 WordSurge/1.4.1';
let failures = 0;
const check = (label, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`); if (!ok) failures += 1; };

async function stage(page, mutate) {
  await page.goto(`${BASE}/manifest.webmanifest`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((fn) => {
    const state = JSON.parse(localStorage.getItem('wordsurge.save.v1'));
    // eslint-disable-next-line no-new-func
    new Function('state', fn)(state);
    localStorage.setItem('wordsurge.save.v1', JSON.stringify(state));
  }, mutate);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-action="play"]');
}

async function drag(page, word) {
  const buttons = page.locator('.letter-button');
  const count = await buttons.count();
  const used = new Set();
  const points = [];
  for (const char of word) {
    let index = -1;
    for (let i = 0; i < count; i += 1) {
      if (used.has(i)) continue;
      if ((await buttons.nth(i).innerText()).trim() === char) { index = i; break; }
    }
    if (index < 0) throw new Error(`letter ${char} missing for ${word}`);
    used.add(index);
    const box = await buttons.nth(index).boundingBox();
    points.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(point.x, point.y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-IN', timezoneId: 'Asia/Calcutta', userAgent: SHELL_UA });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });

  // 1. Boot + system date
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-action="play"]');
  // Compare date parts (ICU versions differ in comma placement between Node and Chromium).
  const parts = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Calcutta' }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => part.value);
  const shown = await page.locator('.system-date-label').first().innerText();
  check('home shows device date', parts.every((part) => shown.includes(part)), shown);
  check('no service worker under Android shell UA', (await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)) === 0);

  // 2. Tutorial + first level
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  await page.waitForTimeout(700);
  check('tutorial shown on level 1', (await page.locator('[data-tutorial]').count()) === 1);
  await page.click('[data-action="start-tutorial"]');
  await page.waitForTimeout(400);
  check('basic timer starts at 0:30', (await page.locator('[data-level-timer] strong').innerText()) === '0:30');
  check('timer has role=timer', (await page.locator('[data-level-timer]').getAttribute('role')) === 'timer');
  await drag(page, 'CAT');
  check('CAT accepted', (await page.locator('.game-title span').innerText()).includes('1/2'));
  await page.waitForTimeout(800);
  if (await page.locator('[data-action="tutorial-hint"]').count()) await page.click('[data-action="tutorial-hint"]');
  else await drag(page, 'ACT');
  await page.waitForSelector('.level-complete h2', { timeout: 5000 });
  check('level complete sheet', (await page.locator('.level-complete h2').innerText()).length > 0, (await page.locator('.complete-stats').innerText()).replace(/\s+/g, ' '));
  await page.click('[data-action="next-level"]');
  await page.waitForSelector('.letter-wheel');
  await page.waitForTimeout(400);
  check('level 2 opens', (await page.locator('.game-title strong').innerText()).toUpperCase() === 'LEVEL 2');

  // 3. Wrong word + already-found
  await drag(page, 'GDO');
  check('wrong word does not advance', (await page.locator('.game-title span').innerText()).includes('0/2'));

  // 4. Expired attempt persisted on disk -> Time's up -> retry
  await stage(page, "state.meta.tutorialComplete = true; state.player.currentLevel = 2; state.progress.activeAttempts = { '2': { startedAt: Date.now() - 70000, endsAt: Date.now() - 10000 } };");
  check('home shows 0:00 remaining for expired attempt', (await page.locator('.journey-card p').first().innerText()).includes('0:00'));
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  await page.waitForTimeout(900);
  check("expired attempt shows Time's up", (await page.locator('.timeout-card h2').count()) === 1);
  await page.click('[data-action="retry-level"]');
  await page.waitForSelector('.letter-wheel');
  await page.waitForTimeout(500);
  const t1 = await page.locator('[data-level-timer] strong').innerText();
  await page.waitForTimeout(2500);
  const t2 = await page.locator('[data-level-timer] strong').innerText();
  check('retry restarts full timer and counts down', t1 === '0:30' && t2 < t1, `${t1} -> ${t2}`);

  // 5. Milestones + timers per difficulty
  await stage(page, 'state.meta.tutorialComplete = true; state.player.currentLevel = 10; state.progress.activeAttempts = {};');
  check('home kicker shows Treasure Chest', (await page.locator('.level-kicker').innerText()).toUpperCase().includes('TREASURE CHEST'));
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  await page.waitForTimeout(500);
  check('level 10 is Expert with 1:00', (await page.locator('.game-title span').innerText()).toUpperCase().includes('EXPERT') && (await page.locator('[data-level-timer] strong').innerText()) === '1:00');

  // 6. Generated level performance
  await stage(page, 'state.meta.tutorialComplete = true; state.player.currentLevel = 4321; state.progress.activeAttempts = {};');
  const t0 = Date.now();
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  const elapsed = Date.now() - t0;
  check('generated level 4321 opens < 1500 ms', elapsed < 1500, `${elapsed} ms, wheel ${(await page.locator('.letter-button').allInnerTexts()).join('')}`);

  // 7. Settings, links, no monetisation UI, dark mode legibility
  await page.click('[data-action="back-home"]');
  await page.click('[data-action="settings"]');
  await page.waitForSelector('.settings-list');
  const rows = await page.locator('.settings-list .setting-row strong').allInnerTexts();
  check('settings rows', rows.join('|').includes('Privacy policy') && rows.join('|').includes('Rate WordSurge') && !rows.join('|').includes('Language'), rows.join(', '));
  check('close buttons labelled', (await page.locator('.sheet-close[aria-label]').count()) >= 1);
  await page.click('[data-setting="darkMode"]');
  await page.waitForTimeout(200);
  const darkColor = await page.evaluate(() => getComputedStyle(document.querySelector('.setting-row strong')).color);
  const [dr, dg, db] = darkColor.match(/\d+/g).map(Number);
  check('dark mode text is light', (0.2126 * dr + 0.7152 * dg + 0.0722 * db) > 200, darkColor);
  await page.click('[data-setting="darkMode"]');
  check('rate link present', (await page.locator('[data-link="store"]').count()) === 1);
  await page.click('[data-action="close-modal"]');
  await page.click('[data-action="coin-shop"]');
  await page.waitForSelector('.reward-hero');
  const shop = await page.locator('.bottom-sheet').innerText();
  check('coin sheet has no ad/purchase UI', !/video|purchase|advert|watch/i.test(shop));
  await page.click('[data-action="close-modal"]');

  // 8. Storage hygiene
  const keys = await page.evaluate(() => Object.keys(localStorage));
  check('only one storage key', keys.length === 1 && keys[0] === 'wordsurge.save.v1', keys.join(','));

  // 9. Touch targets >= 44px on main screens
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, [role=button]').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width && b.height && (b.width < 44 || b.height < 44)) out.push(`${el.className.split(' ')[0]} ${Math.round(b.width)}x${Math.round(b.height)}`);
    });
    return out;
  });
  check('home touch targets >= 44px', small.length === 0, small.join(', '));

  // 10. Native back bridge
  await page.click('[data-action="play"]');
  await page.waitForSelector('.letter-wheel');
  check('native back: game -> home', (await page.evaluate(() => window.handleNativeBack())) === true);
  check('native back on home -> exit', (await page.evaluate(() => window.handleNativeBack())) === false);

  await browser.close();
  check('no console/page/network errors', errors.length === 0, errors.join(' | '));
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})().catch((error) => { console.error('SMOKE TEST CRASHED', error); process.exit(1); });
