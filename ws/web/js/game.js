// Puzzle rules engine: tracks found words, hints, shuffles, and completion for one level.
import { seededShuffle } from './data.js';
import { createCrossword } from './layout.js';

export class GameEngine {
  constructor(level, existingWords = []) {
    this.level = level;
    this.answers = level.words.map((word) => word.toUpperCase());
    this.layout = createCrossword(this.answers);
    this.found = new Set(existingWords.filter((word) => this.answers.includes(word)));
    this.revealedCells = new Set();
    this.shuffleCount = 0;
    this.hintsUsed = 0;
    this.wheelLetters = this.makeWheel();
  }

  makeWheel() {
    if (this.level.id === 1 && this.shuffleCount === 0) return [...this.level.letters];
    return seededShuffle([...this.level.letters], `${this.level.id}-${this.shuffleCount}`);
  }

  shuffle() {
    this.shuffleCount += 1;
    const previous = this.wheelLetters.join('');
    this.wheelLetters = this.makeWheel();
    if (this.wheelLetters.join('') === previous && this.wheelLetters.length > 2) {
      this.wheelLetters.push(this.wheelLetters.shift());
    }
    return this.wheelLetters;
  }

  submit(word) {
    const normalized = word.toUpperCase();
    if (this.found.has(normalized)) return { status: 'already', word: normalized };
    if (!this.answers.includes(normalized)) return { status: 'wrong', word: normalized };
    this.found.add(normalized);
    return {
      status: 'correct',
      word: normalized,
      complete: this.isComplete(),
      placement: this.layout.placements.find((item) => item.word === normalized)
    };
  }

  revealLetter() {
    const candidates = [...this.layout.cells.values()].filter((cell) => {
      const shownByWord = cell.words.some((word) => this.found.has(word));
      return !shownByWord && !this.revealedCells.has(cell.key);
    });
    if (!candidates.length) return null;
    const cell = candidates[Math.floor((Number.parseInt(String(this.level.id).replace(/\D/g, ''), 10) + this.revealedCells.size * 7) % candidates.length)];
    this.revealedCells.add(cell.key);
    this.hintsUsed += 1;
    return cell;
  }

  revealWord() {
    const word = this.answers.find((answer) => !this.found.has(answer));
    if (!word) return null;
    this.found.add(word);
    this.hintsUsed += 1;
    return {
      word,
      placement: this.layout.placements.find((item) => item.word === word),
      complete: this.isComplete()
    };
  }

  getSmartHint() {
    const word = this.answers.find((answer) => !this.found.has(answer));
    if (!word) return null;
    this.hintsUsed += 1;
    const first = word[0];
    const index = this.wheelLetters.findIndex((letter) => letter === first);
    return { wordLength: word.length, first, index };
  }

  isCellVisible(cell) {
    return this.revealedCells.has(cell.key) || cell.words.some((word) => this.found.has(word));
  }

  isComplete() {
    return this.answers.every((word) => this.found.has(word));
  }

  get progress() {
    return this.found.size / this.answers.length;
  }
}
