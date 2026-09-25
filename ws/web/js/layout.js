// Deterministic crossword layout: places answer words on a grid with valid crossings.
const keyOf = (row, col) => `${row},${col}`;

function boundsFor(cells) {
  const values = [...cells.values()];
  return {
    minRow: Math.min(...values.map((cell) => cell.row)),
    maxRow: Math.max(...values.map((cell) => cell.row)),
    minCol: Math.min(...values.map((cell) => cell.col)),
    maxCol: Math.max(...values.map((cell) => cell.col))
  };
}

function canPlace(word, row, col, direction, grid) {
  const dr = direction === 'v' ? 1 : 0;
  const dc = direction === 'h' ? 1 : 0;
  const before = grid.get(keyOf(row - dr, col - dc));
  const after = grid.get(keyOf(row + dr * word.length, col + dc * word.length));
  if (before || after) return null;

  let crossings = 0;
  for (let i = 0; i < word.length; i += 1) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = grid.get(keyOf(r, c));
    if (existing && existing.char !== word[i]) return null;
    if (existing) {
      crossings += 1;
    } else if (direction === 'h') {
      if (grid.get(keyOf(r - 1, c)) || grid.get(keyOf(r + 1, c))) return null;
    } else if (grid.get(keyOf(r, c - 1)) || grid.get(keyOf(r, c + 1))) return null;
  }
  return { crossings };
}

function addPlacement(word, row, col, direction, grid, placements) {
  const dr = direction === 'v' ? 1 : 0;
  const dc = direction === 'h' ? 1 : 0;
  const cells = [];
  for (let i = 0; i < word.length; i += 1) {
    const r = row + dr * i;
    const c = col + dc * i;
    const key = keyOf(r, c);
    let cell = grid.get(key);
    if (!cell) {
      cell = { key, row: r, col: c, char: word[i], words: [] };
      grid.set(key, cell);
    }
    cell.words.push(word);
    cells.push(key);
  }
  placements.push({ word, row, col, direction, cells });
}

export function createCrossword(words) {
  const ordered = [...words].sort((a, b) => b.length - a.length || a.localeCompare(b));
  const grid = new Map();
  const placements = [];
  addPlacement(ordered[0], 0, 0, 'h', grid, placements);

  ordered.slice(1).forEach((word, wordIndex) => {
    const candidates = [];
    grid.forEach((existing) => {
      [...word].forEach((char, index) => {
        if (char !== existing.char) return;
        ['v', 'h'].forEach((direction) => {
          const row = existing.row - (direction === 'v' ? index : 0);
          const col = existing.col - (direction === 'h' ? index : 0);
          const valid = canPlace(word, row, col, direction, grid);
          if (!valid || valid.crossings === 0) return;
          const currentBounds = boundsFor(grid);
          const minRow = Math.min(currentBounds.minRow, row);
          const maxRow = Math.max(currentBounds.maxRow, row + (direction === 'v' ? word.length - 1 : 0));
          const minCol = Math.min(currentBounds.minCol, col);
          const maxCol = Math.max(currentBounds.maxCol, col + (direction === 'h' ? word.length - 1 : 0));
          const area = (maxRow - minRow + 1) * (maxCol - minCol + 1);
          candidates.push({ row, col, direction, score: valid.crossings * 100 - area });
        });
      });
    });

    if (candidates.length) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      addPlacement(word, best.row, best.col, best.direction, grid, placements);
      return;
    }

    // Rare fallback for words that cannot cross cleanly: place a compact second island.
    const b = boundsFor(grid);
    let placed = false;
    for (let row = b.minRow; row <= b.maxRow + 3 && !placed; row += 1) {
      const col = b.maxCol + 2 + (wordIndex % 2);
      const valid = canPlace(word, row, col, 'v', grid);
      if (valid) {
        addPlacement(word, row, col, 'v', grid, placements);
        placed = true;
      }
    }
    if (!placed) addPlacement(word, b.maxRow + 2, b.minCol, 'h', grid, placements);
  });

  const bounds = boundsFor(grid);
  const normalized = new Map();
  grid.forEach((cell) => {
    const row = cell.row - bounds.minRow;
    const col = cell.col - bounds.minCol;
    normalized.set(keyOf(row, col), { ...cell, key: keyOf(row, col), row, col });
  });
  const normalizedPlacements = placements.map((placement) => ({
    ...placement,
    row: placement.row - bounds.minRow,
    col: placement.col - bounds.minCol,
    cells: placement.cells.map((key) => {
      const [row, col] = key.split(',').map(Number);
      return keyOf(row - bounds.minRow, col - bounds.minCol);
    })
  }));

  return {
    cells: normalized,
    placements: normalizedPlacements,
    rows: bounds.maxRow - bounds.minRow + 1,
    cols: bounds.maxCol - bounds.minCol + 1
  };
}
