// Tiny WebAudio bleeps — no audio assets, everything synthesized.
// Created lazily on the first user gesture (autoplay policy).
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq, dur, type = 'square', vol = 0.05, when = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur);
}

// Every sound is a synthesized beep — the game ships zero audio assets.
export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'jump': beep(520, 0.12, 'square', 0.04); break;
    case 'corn': beep(880, 0.08, 'sine', 0.05); break;
    case 'golden': beep(660, 0.1, 'sine', 0.06); beep(990, 0.16, 'sine', 0.06, 0.1); break;
    case 'dash': beep(300, 0.14, 'sawtooth', 0.04); break;
    case 'burst': beep(440, 0.1, 'sawtooth', 0.05); beep(660, 0.12, 'sawtooth', 0.05, 0.08); break;
    case 'decoy': beep(700, 0.07, 'triangle', 0.05); break;
    case 'hide': beep(240, 0.12, 'triangle', 0.04); break;
    case 'spotted': beep(180, 0.25, 'sawtooth', 0.07); break;
    case 'hurt': beep(140, 0.3, 'sawtooth', 0.08); break;
    case 'caught': beep(110, 0.5, 'sawtooth', 0.08); beep(90, 0.5, 'sawtooth', 0.08, 0.3); break;
    case 'feat': beep(784, 0.1, 'sine', 0.06); beep(1046, 0.14, 'sine', 0.06, 0.09); break;
    case 'perk': beep(523, 0.1, 'sine', 0.06); beep(659, 0.1, 'sine', 0.06, 0.09); beep(784, 0.16, 'sine', 0.06, 0.18); break;
    case 'end': beep(523, 0.15, 'sine', 0.06); beep(659, 0.15, 'sine', 0.06, 0.14); beep(784, 0.3, 'sine', 0.06, 0.28); break;
    default: break;
  }
}
