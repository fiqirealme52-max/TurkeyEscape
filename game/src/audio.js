'use strict';
/* Tiny WebAudio synth: no audio files, everything is an oscillator.
   Sound starts only after the first user gesture. */

const Sfx = {
  ctx: null, muted: false, master: null,

  ensure() {
    if (Sfx.ctx) {
      if (Sfx.ctx.state === 'suspended') Sfx.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      Sfx.ctx = new AC();
      Sfx.master = Sfx.ctx.createGain();
      Sfx.master.gain.value = 0.16;
      Sfx.master.connect(Sfx.ctx.destination);
    } catch (e) { Sfx.ctx = null; }
  },

  tone(freq, dur, type, slideTo, when) {
    if (!Sfx.ctx || Sfx.muted) return;
    const t0 = Sfx.ctx.currentTime + (when || 0);
    const o = Sfx.ctx.createOscillator();
    const g = Sfx.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.9, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(Sfx.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },

  /* Gobble-gobble: two quick low clucks. */
  gobble() {
    Sfx.tone(320, 0.09, 'square', 180);
    Sfx.tone(300, 0.09, 'square', 170, 0.11);
    Sfx.tone(340, 0.12, 'square', 190, 0.24);
  },
  flap() { Sfx.tone(500, 0.08, 'triangle', 700); },
  dash() { Sfx.tone(220, 0.18, 'sawtooth', 660); },
  pickup() { Sfx.tone(880, 0.09, 'sine', 1320); Sfx.tone(1320, 0.1, 'sine', 1760, 0.07); },
  sting() {
    Sfx.tone(196, 0.22, 'sawtooth', 185);
    Sfx.tone(147, 0.3, 'sawtooth', 138, 0.12);
  },
  hit() {
    Sfx.tone(140, 0.25, 'sawtooth', 60);
    Sfx.tone(90, 0.3, 'square', 50, 0.05);
  },
  stageClear() {
    [523, 659, 784, 1046].forEach((f, i) => Sfx.tone(f, 0.16, 'triangle', null, i * 0.09));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => Sfx.tone(f, 0.22, 'triangle', null, i * 0.11));
    Sfx.tone(262, 0.5, 'sine', null, 0.55);
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => Sfx.tone(f, 0.25, 'sawtooth', null, i * 0.14));
  },

  toggleMute() { Sfx.muted = !Sfx.muted; return Sfx.muted; }
};
