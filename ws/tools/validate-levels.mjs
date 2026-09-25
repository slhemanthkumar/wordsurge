// Validates every level WordSurge can serve: run with `node tools/validate-levels.mjs`.
import { getLevel, getDifficulty, getDailyLevel, HANDCRAFTED_LEVELS } from '../web/js/data.js';
import { createCrossword } from '../web/js/layout.js';
import { COMMON_WORDS } from '../web/js/dictionary.js';
const t0 = Date.now();
const canSpell = (letters, word) => { const a = {}; for (const c of letters) a[c] = (a[c]||0)+1; for (const c of word) { if (!a[c]) return false; a[c]--; } return true; };
const dict = new Set(COMMON_WORDS);
const problems = [];
const seenLetters = new Set();
const timers = {};
let minWords = 99, maxWords = 0;
const usedWords = new Set();
for (let i = 1; i <= 5000; i++) {
  const l = getLevel(i);
  if (l.id !== i) problems.push(`${i}: id mismatch`);
  if (new Set(l.words).size !== l.words.length) problems.push(`${i}: duplicate words`);
  if (l.words[0] !== l.letters) problems.push(`${i}: root not first`);
  for (const w of l.words) { if (!canSpell(l.letters, w)) problems.push(`${i}: ${w} not spellable from ${l.letters}`); usedWords.add(w); if (i > 100 && !dict.has(w)) problems.push(`${i}: ${w} not in dictionary`); }
  const sig = [...l.letters].sort().join('');
  if (seenLetters.has(sig)) problems.push(`${i}: duplicate letter set ${l.letters}`); seenLetters.add(sig);
  const layout = createCrossword(l.words);
  if (layout.rows > 12 || layout.cols > 12) problems.push(`${i}: layout too big ${layout.rows}x${layout.cols}`);
  if (layout.placements.length !== l.words.length) problems.push(`${i}: placement count`);
  const d = getDifficulty(l); timers[d.seconds] = (timers[d.seconds]||0)+1;
  const expectedSeconds = (d.id === 'basic' || d.id === 'standard') ? 30 : 60;
  if (d.seconds !== expectedSeconds) problems.push(`${i}: ${d.id} timer is ${d.seconds}s, expected ${expectedSeconds}s`);
  minWords = Math.min(minWords, l.words.length); maxWords = Math.max(maxWords, l.words.length);
}
// Daily levels for the next 400 days
const start = new Date();
for (let d = 0; d < 400; d++) { const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d); const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; const l = getDailyLevel(key); for (const w of l.words) if (!canSpell(l.letters, w)) problems.push(`daily ${key}: ${w}`); createCrossword(l.words); }
console.log('levels validated: 5000 (+400 daily) in', Date.now()-t0, 'ms');
console.log('handcrafted:', HANDCRAFTED_LEVELS.length, '| words per level min/max:', minWords, maxWords, '| unique words:', usedWords.size);
console.log('timer distribution:', JSON.stringify(timers));
console.log('problems:', problems.length); problems.slice(0, 20).forEach(p => console.log('  ', p));
const sample = (a,b) => { for (let i=a;i<=b;i++){ const l=getLevel(i); console.log(`  L${i} [${getDifficulty(l).label} ${getDifficulty(l).seconds}s] ${l.words.join(' / ')}`);} };
console.log('samples:'); sample(101,106); sample(251,256); sample(1200,1203); sample(4998,5000);
process.exit(problems.length ? 1 : 0);
