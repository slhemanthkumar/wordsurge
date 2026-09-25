// Static game content: themes, achievements, handcrafted levels, and the procedural level generator.
import { COMMON_WORDS } from './dictionary.js';
import { createCrossword } from './layout.js';

export const THEMES = [
  { id: 'beach', name: 'Surge Bay', short: 'Surge', level: 1, icon: 'wave', colors: ['#0f3f4b', '#1d6a78', '#ffd9a8'], accent: '#ff8a5c' },
  { id: 'forest', name: 'Whispering Forest', short: 'Forest', level: 25, icon: 'leaf', colors: ['#143d35', '#2b7a5f', '#b9e6c8'], accent: '#f4bd62' },
  { id: 'snow', name: 'Quiet Tundra', short: 'Snow', level: 50, icon: 'snow', colors: ['#274866', '#84bdd0', '#eaf8ff'], accent: '#89d9ed' },
  { id: 'sunset', name: 'Amber Dusk', short: 'Sunset', level: 75, icon: 'sunset', colors: ['#4d2d57', '#d46a63', '#ffd18d'], accent: '#ffd06a' },
  { id: 'mountains', name: 'Misty Peaks', short: 'Mountains', level: 100, icon: 'mountain', colors: ['#253e4a', '#688b83', '#d8dfbd'], accent: '#d6b76e' },
  { id: 'aurora', name: 'Aurora Vale', short: 'Aurora', level: 125, icon: 'sparkles', colors: ['#17284e', '#3c7397', '#73e3bd'], accent: '#90efd1' },
  { id: 'space', name: 'Velvet Cosmos', short: 'Space', level: 150, icon: 'sparkles', colors: ['#11132f', '#45347d', '#ca83da'], accent: '#f2b8ff' },
  { id: 'temple', name: 'Sunken Temple', short: 'Temple', level: 175, icon: 'temple', colors: ['#253c37', '#997a45', '#e4c984'], accent: '#f0c765' },
  { id: 'garden', name: 'Koi Garden', short: 'Garden', level: 200, icon: 'flower', colors: ['#293c35', '#b16f78', '#f2c7bd'], accent: '#f7aab0' },
  { id: 'kingdom', name: 'Moonlit Kingdom', short: 'Kingdom', level: 225, icon: 'crown', colors: ['#243052', '#635b91', '#dfc2f0'], accent: '#f0c46d' },
  { id: 'city', name: 'Rainlight City', short: 'Night City', level: 250, icon: 'city', colors: ['#111d35', '#1e6083', '#f04d9b'], accent: '#48d5f2' },
  { id: 'ocean', name: 'Deep Blue', short: 'Ocean', level: 275, icon: 'wave', colors: ['#072e4b', '#087c96', '#75d5cc'], accent: '#81e2d4' }
];

export const ACHIEVEMENTS = [
  { id: 'first_word', title: 'First Word', description: 'Find your first word', icon: 'sparkles', target: 1, metric: 'wordsFound', coins: 20 },
  { id: 'level_10', title: 'Trailblazer', description: 'Complete 10 levels', icon: 'flag', target: 10, metric: 'levelsCompleted', coins: 50 },
  { id: 'level_50', title: 'Word Wanderer', description: 'Complete 50 levels', icon: 'map', target: 50, metric: 'levelsCompleted', coins: 150 },
  { id: 'level_100', title: 'Century Grove', description: 'Complete 100 levels', icon: 'tree', target: 100, metric: 'levelsCompleted', coins: 300 },
  { id: 'level_500', title: 'Verse Voyager', description: 'Complete 500 levels', icon: 'compass', target: 500, metric: 'levelsCompleted', coins: 1000 },
  { id: 'perfect_25', title: 'Perfect Path', description: 'Finish 25 levels without hints', icon: 'star', target: 25, metric: 'perfectLevels', coins: 200 },
  { id: 'streak_7', title: 'Seven Sunrises', description: 'Reach a 7-day login streak', icon: 'flame', target: 7, metric: 'bestStreak', coins: 100 },
  { id: 'streak_30', title: 'Monthly Rhythm', description: 'Reach a 30-day login streak', icon: 'calendar', target: 30, metric: 'bestStreak', coins: 500 },
  { id: 'coins_10k', title: 'Treasure Keeper', description: 'Collect 10,000 lifetime coins', icon: 'coin', target: 10000, metric: 'lifetimeCoins', coins: 500 },
  { id: 'combo_5', title: 'Surge Streak', description: 'Reach a 5-word combo', icon: 'wave', target: 5, metric: 'bestCombo', coins: 120 },
  { id: 'bonus_500', title: 'Bonus Collector', description: 'Earn 500 bonus coins', icon: 'gift', target: 500, metric: 'bonusCoins', coins: 180 },
  { id: 'all_themes', title: 'World Collector', description: 'Unlock every theme', icon: 'palette', target: 12, metric: 'themesUnlocked', coins: 750 },
  { id: 'word_master', title: 'Master Word Solver', description: 'Find 2,500 words', icon: 'crown', target: 2500, metric: 'wordsFound', coins: 1200 }
];

const THREE = [
  ['CAT', ['CAT', 'ACT']], ['DOG', ['DOG', 'GOD']], ['SUN', ['SUN']], ['TOP', ['TOP', 'POT']],
  ['CUP', ['CUP']], ['PEN', ['PEN']], ['HAT', ['HAT']], ['RUN', ['RUN']],
  ['BOX', ['BOX']], ['BED', ['BED']], ['CAR', ['CAR', 'ARC']], ['BUS', ['BUS']],
  ['RED', ['RED']], ['MAP', ['MAP']], ['PIG', ['PIG']], ['FAN', ['FAN']],
  ['JAM', ['JAM']], ['FOX', ['FOX']], ['SKY', ['SKY']], ['GEM', ['GEM']]
];

const FOUR = [
  ['STOP', ['STOP', 'POST', 'SPOT', 'POTS', 'TOP']],
  ['TEAM', ['TEAM', 'MEAT', 'TAME', 'MATE', 'TEA']],
  ['EAST', ['EAST', 'SEAT', 'EATS', 'TEAS', 'SEA']],
  ['CARE', ['CARE', 'RACE', 'ACRE', 'CAR', 'ARC']],
  ['NOTE', ['NOTE', 'TONE', 'ONE', 'TON']],
  ['SALT', ['SALT', 'LAST', 'SAT']],
  ['RATE', ['RATE', 'TEAR', 'TARE', 'EAT', 'ART']],
  ['STAR', ['STAR', 'RATS', 'ARTS', 'TAR', 'RAT']],
  ['READ', ['READ', 'DEAR', 'DARE', 'RED']],
  ['DEAL', ['DEAL', 'LEAD', 'LED', 'LAD']],
  ['MALE', ['MALE', 'MEAL', 'LAME']],
  ['PAST', ['PAST', 'SPAT', 'TAPS', 'PAT', 'SAT']],
  ['ITEM', ['ITEM', 'TIME', 'EMIT', 'TIE']],
  ['LIFE', ['LIFE', 'FILE', 'LIE']],
  ['LOVE', ['LOVE']],
  ['WAVE', ['WAVE']],
  ['FIRE', ['FIRE']],
  ['RING', ['RING', 'GRIN']],
  ['SAND', ['SAND', 'AND', 'SAD']],
  ['LION', ['LION', 'LOIN']],
  ['ROAD', ['ROAD', 'OAR']],
  ['BOAT', ['BOAT', 'OAT', 'BAT']],
  ['SHIP', ['SHIP', 'HIPS']],
  ['GAME', ['GAME', 'AGE']],
  ['PLAY', ['PLAY', 'LAP', 'LAY', 'PAL']],
  ['HOME', ['HOME']],
  ['TREE', ['TREE', 'TEE']],
  ['BIRD', ['BIRD', 'RIB']],
  ['FISH', ['FISH']],
  ['MOON', ['MOON']]
];

const FIVE = [
  ['STONE', ['STONE', 'NOTES', 'TONES', 'ONSET', 'TONE']],
  ['HEART', ['HEART', 'EARTH', 'HATER', 'HEAR', 'HEAT']],
  ['LEAST', ['LEAST', 'STALE', 'STEAL', 'SLATE', 'TALES']],
  ['TRAIN', ['TRAIN', 'RAIN', 'RANT', 'ANTI']],
  ['BRAIN', ['BRAIN', 'RAIN', 'BARN', 'BRAN']],
  ['WATER', ['WATER', 'WEAR', 'WARE', 'RATE', 'TEAR']],
  ['PLANT', ['PLANT', 'PLAN', 'PANT', 'ANT']],
  ['CLOUD', ['CLOUD', 'LOUD', 'CLOD', 'COLD']],
  ['LIGHT', ['LIGHT']],
  ['NIGHT', ['NIGHT', 'HINT', 'THIN']],
  ['SMILE', ['SMILE', 'LIME', 'SLIM', 'MILE']],
  ['DREAM', ['DREAM', 'DARE', 'DEAR', 'READ']],
  ['MUSIC', ['MUSIC']],
  ['BEACH', ['BEACH', 'EACH']],
  ['RIVER', ['RIVER']],
  ['GREEN', ['GREEN', 'GENE']],
  ['HOUSE', ['HOUSE', 'HOSE', 'SHOE', 'USE']],
  ['WORLD', ['WORLD', 'WORD']],
  ['SWEET', ['SWEET', 'WEST', 'SEW']],
  ['TABLE', ['TABLE', 'ABLE', 'LATE', 'TALE', 'BELT']],
  ['CHAIR', ['CHAIR', 'HAIR']],
  ['GRAPE', ['GRAPE', 'RAGE', 'GEAR', 'PAGE']],
  ['BREAD', ['BREAD', 'BARE', 'BEAR', 'READ', 'DEAR']],
  ['CREAM', ['CREAM', 'RACE', 'CARE']],
  ['FRUIT', ['FRUIT']],
  ['TIGER', ['TIGER', 'TIER', 'TIRE']],
  ['HORSE', ['HORSE', 'HERO', 'ROSE', 'SHORE']],
  ['SHEEP', ['SHEEP', 'SEEP', 'PEES']],
  ['MOUSE', ['MOUSE', 'SOME', 'MUSE', 'USE']],
  ['CROWN', ['CROWN', 'CORN', 'WORN']],
  ['QUEEN', ['QUEEN']],
  ['BRAVE', ['BRAVE', 'BEAR', 'BARE']],
  ['SHINE', ['SHINE', 'HENS', 'SHIN']],
  ['GLASS', ['GLASS', 'LASS']],
  ['BRICK', ['BRICK']],
  ['CLOCK', ['CLOCK', 'LOCK']],
  ['STORY', ['STORY', 'TOYS', 'SORT']],
  ['SMART', ['SMART', 'MARS', 'STAR', 'ARTS']],
  ['HAPPY', ['HAPPY', 'HAY', 'PAY']],
  ['PEACE', ['PEACE', 'CAPE', 'PACE']],
  ['NORTH', ['NORTH', 'HORN', 'THORN']],
  ['SOUTH', ['SOUTH', 'SHOT']],
  ['OCEAN', ['OCEAN', 'CANE', 'ONCE']],
  ['SPACE', ['SPACE', 'CASE', 'CAPE']],
  ['MAGIC', ['MAGIC']],
  ['WORDS', ['WORDS', 'WORD', 'SWORD']],
  ['PARTY', ['PARTY', 'TRAY', 'PRAY', 'PART']],
  ['DANCE', ['DANCE', 'CANE', 'ACED']],
  ['FLAME', ['FLAME', 'MALE', 'MEAL']],
  ['BLOOM', ['BLOOM', 'BOOM', 'LOOM']]
];

const FEATURED_ORDER = ['CAT', 'DOG', 'SUN', 'TOP', 'STOP', 'CUP', 'TEAM', 'STONE', 'EAST', 'HEART'];
const ALL_CURATED = [...THREE, ...FOUR, ...FIVE];
const featured = FEATURED_ORDER.map((seed) => ALL_CURATED.find(([letters]) => letters === seed));
const usedSeeds = new Set(FEATURED_ORDER);
const difficultyPools = {
  easy: THREE.filter(([letters]) => !usedSeeds.has(letters)),
  medium: FOUR.filter(([letters]) => !usedSeeds.has(letters)),
  hard: FIVE.filter(([letters]) => !usedSeeds.has(letters))
};
const mixedOrder = [...featured];
const wavePattern = ['hard', 'medium', 'hard', 'easy', 'hard', 'medium'];
let waveIndex = 0;
while (mixedOrder.length < ALL_CURATED.length) {
  const preferred = wavePattern[waveIndex % wavePattern.length];
  const fallback = ['hard', 'medium', 'easy'].find((key) => difficultyPools[key].length);
  const pool = difficultyPools[preferred].length ? difficultyPools[preferred] : difficultyPools[fallback];
  mixedOrder.push(pool.shift());
  waveIndex += 1;
}
// Every fifth level is deliberately substantial so its coin bonus feels earned.
for (let index = 4; index < mixedOrder.length; index += 5) {
  const [, words] = mixedOrder[index];
  if (mixedOrder[index][0].length >= 4 && words.length >= 3) continue;
  let swapIndex = mixedOrder.findIndex(([letters, answers], candidate) => candidate > index && (candidate + 1) % 5 !== 0 && letters.length >= 5 && answers.length >= 3);
  if (swapIndex < 0) swapIndex = mixedOrder.findIndex(([letters, answers], candidate) => (candidate + 1) % 5 !== 0 && letters.length >= 5 && answers.length >= 3);
  if (swapIndex >= 0) [mixedOrder[index], mixedOrder[swapIndex]] = [mixedOrder[swapIndex], mixedOrder[index]];
}

export const HANDCRAFTED_LEVELS = mixedOrder.map(([letters, words], index) => ({
  id: index + 1,
  letters,
  words,
  handcrafted: true
}));

// Fixed, non-extendable timers: quick 30-second sprints for Basic/Standard routes,
// a full 60 seconds for Complex/Expert boards that have more letters and words to find.
export function getDifficulty(level) {
  const wheelSize = level.letters.length;
  const wordCount = level.words.length;
  const score = (wheelSize - 3) * 1.35 + (wordCount - 1) * 0.85;
  if (score <= 1.1) return { id: 'basic', label: 'Basic', score, seconds: 30, coinBonus: 0, xpMultiplier: 1 };
  if (score <= 3.2) return { id: 'standard', label: 'Standard', score, seconds: 30, coinBonus: 8, xpMultiplier: 1.15 };
  if (score <= 5.3) return { id: 'complex', label: 'Complex', score, seconds: 60, coinBonus: 18, xpMultiplier: 1.35 };
  return { id: 'expert', label: 'Expert', score, seconds: 60, coinBonus: 30, xpMultiplier: 1.6 };
}

export function getMilestoneBonus(levelId) {
  const level = Number(levelId);
  if (!Number.isFinite(level) || level < 1) return { coins: 0, label: '' };
  if (level % 10 === 0) return { coins: 120, label: 'Treasure Chest' };
  if (level % 5 === 0) return { coins: 40, label: 'Surge Bonus' };
  return { coins: 0, label: '' };
}

// Curated six-letter puzzles reserved for the Daily Challenge rotation.
const DAILY_BANK = [
    ['LISTEN', ['LISTEN', 'SILENT', 'ENLIST', 'TINSEL', 'INLETS']],
    ['PLANET', ['PLANET', 'PLANE', 'PLATE', 'LEAPT']],
    ['GARDEN', ['GARDEN', 'DANGER', 'RANGE', 'DEAR']],
    ['SPRING', ['SPRING', 'GRINS', 'RINGS', 'PINGS']],
    ['ORANGE', ['ORANGE', 'RANGE', 'ANGER']],
    ['SILVER', ['SILVER', 'LIVER', 'VEILS']],
    ['BRIGHT', ['BRIGHT', 'BIRTH', 'RIGHT']],
    ['CASTLE', ['CASTLE', 'STALE', 'LEAST']],
    ['STREAM', ['STREAM', 'MASTER', 'TAMER']],
    ['POCKET', ['POCKET', 'POET', 'COPE']],
    ['MARKET', ['MARKET', 'MAKER', 'TAKER']],
    ['WINTER', ['WINTER', 'WRITE', 'TWIN']],
    ['SUMMER', ['SUMMER', 'MUSE', 'SUM']],
    ['FRIEND', ['FRIEND', 'FINER', 'FIRED']],
    ['ANIMAL', ['ANIMAL', 'MAIL', 'MAIN']],
    ['PENCIL', ['PENCIL', 'CLIP', 'LINE']],
    ['FLOWER', ['FLOWER', 'LOWER', 'FOWL']],
    ['BOTTLE', ['BOTTLE', 'BLOT', 'BELT']],
    ['CAMERA', ['CAMERA', 'RACE', 'CARE']],
    ['ISLAND', ['ISLAND', 'NAILS', 'SAND']]
];

function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle(items, seed) {
  const random = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MAX_GRID = 12;
const rootCache = new Map();
const candidateCache = new Map();
const wordRank = new Map(COMMON_WORDS.map((word, index) => [word, index]));
// Anagram index: sorted-letter signature -> words sharing those letters (frequency order).
const anagramIndex = new Map();
COMMON_WORDS.forEach((word) => {
  const key = signature(word);
  const group = anagramIndex.get(key);
  if (group) group.push(word);
  else anagramIndex.set(key, [word]);
});

function signature(word) {
  return [...word].sort().join('');
}

// Every dictionary word spellable from the root's letters, shorter than the root.
// Enumerates letter subsets (<= 255 lookups for 8 letters) instead of scanning the lexicon.
function candidatesFor(root) {
  if (candidateCache.has(root)) return candidateCache.get(root);
  const letters = [...root].sort();
  const count = letters.length;
  const seen = new Set();
  const matches = [];
  for (let mask = 1; mask < (1 << count); mask += 1) {
    let key = '';
    for (let bit = 0; bit < count; bit += 1) if (mask & (1 << bit)) key += letters[bit];
    if (key.length < 3 || key.length >= count || seen.has(key)) continue;
    seen.add(key);
    const group = anagramIndex.get(key);
    if (group) matches.push(...group);
  }
  matches.sort((a, b) => wordRank.get(a) - wordRank.get(b));
  // Prefer two substantial crossings, then fill from the most frequent short words.
  const substantial = matches.filter((word) => word.length >= root.length - 2);
  const ordered = [...substantial, ...matches.filter((word) => word.length < root.length - 2)];
  candidateCache.set(root, ordered);
  return ordered;
}

function rootsFor(lengthKey) {
  if (rootCache.has(lengthKey)) return rootCache.get(lengthKey);
  const lengths = lengthKey === '7-8' ? new Set([7, 8]) : new Set([Number(lengthKey)]);
  const excluded = new Set(HANDCRAFTED_LEVELS.map((level) => signature(level.letters)));
  const seen = new Set();
  const roots = COMMON_WORDS.filter((word) => {
    if (!lengths.has(word.length)) return false;
    const key = signature(word);
    if (excluded.has(key) || seen.has(key)) return false;
    // Every generated puzzle needs at least one crossing word besides the root.
    if (!candidatesFor(word).length) return false;
    seen.add(key);
    return true;
  });
  rootCache.set(lengthKey, roots);
  return roots;
}

export function getLevel(levelNumber) {
  const safeLevel = Math.max(1, Number(levelNumber) || 1);
  if (safeLevel <= HANDCRAFTED_LEVELS.length) return { ...HANDCRAFTED_LEVELS[safeLevel - 1] };

  let lengthKey = '5';
  let tierOffset = safeLevel - 101;
  if (safeLevel >= 121 && safeLevel <= 250) {
    lengthKey = '6';
    tierOffset = safeLevel - 121;
  }
  if (safeLevel >= 251) {
    lengthKey = '7-8';
    tierOffset = safeLevel - 251;
  }

  const roots = rootsFor(lengthKey);
  const cycle = Math.floor(tierOffset / roots.length);
  const root = roots[tierOffset % roots.length];
  const candidates = cycle ? seededShuffle(candidatesFor(root), safeLevel * 7919) : candidatesFor(root);
  const desiredCount = Math.min(5, 2 + (safeLevel % 4));
  const words = [root, ...candidates.slice(0, desiredCount - 1)];
  // Keep every generated board phone-friendly: drop the least-preferred word until it fits.
  let layout = createCrossword(words);
  while (words.length > 2 && (layout.cols > MAX_GRID || layout.rows > MAX_GRID)) {
    words.pop();
    layout = createCrossword(words);
  }
  return {
    id: safeLevel,
    letters: root,
    words,
    handcrafted: false,
    generationSeed: safeLevel * 7919,
    dictionaryGenerated: true
  };
}

export function getDailyLevel(dateKey) {
  const all = [...FIVE, ...DAILY_BANK];
  const idx = hashString(dateKey) % all.length;
  const [letters, words] = all[idx];
  return {
    id: `daily-${dateKey}`,
    letters,
    words: seededShuffle(words, dateKey).slice(0, Math.min(5, words.length)),
    handcrafted: false,
    daily: true
  };
}

export const DAILY_REWARDS = [20, 25, 30, 40, 50, 75, 120];
