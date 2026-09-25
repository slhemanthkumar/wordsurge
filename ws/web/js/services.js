// Device services: synthesized audio, haptics, and a local analytics stub.
import { store } from './state.js';

class AudioManager {
  constructor() {
    this.context = null;
    this.musicNodes = [];
    this.musicTimer = null;
  }

  ensureContext() {
    if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  tone(frequency, duration = 0.1, type = 'sine', volume = 0.04, delay = 0) {
    if (!store.state.settings.sound) return;
    try {
      const context = this.ensureContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
      gain.gain.setValueAtTime(0, context.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + duration + 0.02);
    } catch (error) {
      console.debug('Audio unavailable', error);
    }
  }

  play(name) {
    const patterns = {
      tap: [[380, 0.05, 'sine', 0.025, 0]],
      select: [[520, 0.055, 'sine', 0.028, 0]],
      correct: [[523, 0.13, 'sine', 0.05, 0], [659, 0.16, 'sine', 0.05, 0.09], [784, 0.2, 'sine', 0.045, 0.18]],
      wrong: [[220, 0.12, 'triangle', 0.035, 0], [185, 0.16, 'triangle', 0.03, 0.08]],
      coin: [[880, 0.08, 'sine', 0.04, 0], [1175, 0.12, 'sine', 0.035, 0.07]],
      reward: [[392, 0.15, 'sine', 0.04, 0], [523, 0.18, 'sine', 0.04, 0.12], [659, 0.24, 'sine', 0.045, 0.24]],
      hint: [[440, 0.12, 'sine', 0.035, 0], [554, 0.15, 'sine', 0.03, 0.1]],
      complete: [[523, 0.18, 'sine', 0.05, 0], [659, 0.18, 'sine', 0.05, 0.12], [784, 0.18, 'sine', 0.05, 0.24], [1047, 0.32, 'sine', 0.055, 0.36]]
    };
    (patterns[name] || patterns.tap).forEach(([f, d, t, v, delay]) => this.tone(f, d, t, v, delay));
  }

  startMusic() {
    if (!store.state.settings.music || this.musicTimer) return;
    try {
      this.ensureContext();
      const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
      let index = 0;
      const playNote = () => {
        if (!store.state.settings.music) return this.stopMusic();
        const context = this.ensureContext();
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.value = notes[index % notes.length];
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.012, context.currentTime + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.6);
        osc.connect(filter).connect(gain).connect(context.destination);
        osc.start();
        osc.stop(context.currentTime + 2.7);
        index += 1;
      };
      playNote();
      this.musicTimer = window.setInterval(playNote, 2200);
    } catch (error) {
      console.debug('Music unavailable', error);
    }
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

// Local-only event log. No network transmission and no third-party SDK in this release.
// A future release can attach a provider via analytics.setProvider({ track(event, properties) {} }).
class AnalyticsAdapter {
  constructor() {
    this.provider = null;
    this.recent = [];
  }

  setProvider(provider) {
    this.provider = provider;
    this.recent.forEach(({ event, properties }) => provider?.track?.(event, properties));
    this.recent = [];
  }

  track(event, properties = {}) {
    if (this.provider?.track) {
      this.provider.track(event, properties);
      return;
    }
    this.recent.push({ event, properties, at: Date.now() });
    if (this.recent.length > 50) this.recent.shift();
  }
}

export function haptic(pattern = 12) {
  if (store.state.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
}

export const audio = new AudioManager();
export const analytics = new AnalyticsAdapter();
