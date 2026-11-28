// GOBBLE DASH — Thanksgiving Escape (R3). Boot + game loop + wiring.
// ?shot=start|play|farm|end&seed=N renders a deterministic screenshot branch.
// ?selftest=1 runs a scripted playtest and writes results into #selftest.
import { VIEW } from './config.js';
import { createWorld, startRun, updateWorld, tryHideAction, endRun } from './world.js';
import { tryJump, tryDash, tryCornBurst, tryDecoy } from './turkey.js';
import { render } from './render.js';
import { createInput, attachInput, readHeld } from './input.js';
import { playSound, setMuted } from './audio.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '1', 10) || 1;
const world = createWorld(seed, 'season');
window.__game = world;

const canvas = document.getElementById('game');
canvas.width = VIEW.w;
canvas.height = VIEW.h;
const ctx = canvas.getContext('2d');

const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message || e.error)));

world.onEvent = (name) => {
  const map = { spotted: 'spotted', caught: 'caught', hurt: 'hurt', feat: 'feat', perk: 'perk', end: 'end', golden: 'golden', decoy: 'decoy', hide: 'hide' };
  if (map[name]) playSound(map[name]);
};

const input = createInput();
attachInput(input);
input.onPress = (action) => {
  const w = world;
  if (action === 'mute') { setMuted(!w.muted); w.muted = !w.muted; return; }
  if (w.screen === 'title') {
    if (action === 'start' || action === 'season') { playSound('perk'); startRun(w, 'season'); }
    else if (action === 'freerange') { playSound('perk'); startRun(w, 'endless'); }
    return;
  }
  if (action === 'pause') {
    if (w.screen === 'play') w.screen = 'paused';
    else if (w.screen === 'paused') w.screen = 'play';
    return;
  }
  if (action === 'restart') {
    if (w.screen === 'caught' || w.screen === 'escaped' || w.screen === 'paused') startRun(w, w.mode);
    return;
  }
  if (action === 'start' && (w.screen === 'caught' || w.screen === 'escaped')) { startRun(w, w.mode); return; }
  if (w.screen !== 'play') return;
  if (action === 'jump') {
    if (tryJump(w.turkey, w.perks)) {
      playSound('jump');
      w.counters.jumps += 1;
      if (w.counters.jumps === 1) {
        // First Flight feat (unlocked via the world module directly).
        import('./world.js').then((m) => m.unlockFeat(w, 'first-flight'));
      }
    }
  }
  if (action === 'dash') {
    w.dashCornCount = 0;
    if (tryDash(w.turkey)) playSound('dash');
  }
  if (action === 'burst') { if (tryCornBurst(w.turkey, w)) playSound('burst'); }
  if (action === 'decoy') { if (tryDecoy(w.turkey, w)) playSound('decoy'); }
  if (action === 'hide') { if (tryHideAction(w)) playSound('hide'); }
};

canvas.addEventListener('click', () => {
  if (world.screen === 'title') startRun(world, 'season');
});

// Deterministic screenshot branch (if any); otherwise title screen.
const shot = applyShot(world, window.location.search);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (world.screen === 'play') {
    updateWorld(world, readHeld(input), dt);
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- Scripted self-test (?selftest=1): playtest without a human. ---------
if (params.get('selftest') === '1') {
  const out = [];
  function check(name, ok, detail) { out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : '')); }
  try {
    startRun(world, 'season');
    check('start-run', world.screen === 'play');
    const held = { left: false, right: true };
    for (let i = 0; i < 600; i++) updateWorld(world, held, 1 / 60);
    check('runs-forward', world.distanceMeters > 5, world.distanceMeters.toFixed(1) + 'm');
    const j1 = tryJump(world.turkey, world.perks);
    check('jump', j1 === true);
    const j2 = tryJump(world.turkey, world.perks);
    check('double-jump', j2 === true);
    for (let i = 0; i < 120; i++) updateWorld(world, held, 1 / 60);
    check('lands', world.turkey.onGround === true);
    const d = tryDash(world.turkey);
    check('dash-uses-stamina', d === true && world.turkey.stamina < 100, 'stamina ' + Math.round(world.turkey.stamina));
    world.corn = 10;
    const b = tryCornBurst(world.turkey, world);
    check('corn-burst-costs-5', b === true && world.corn === 5, 'corn ' + world.corn);
    const dc = tryDecoy(world.turkey, world);
    check('decoy-free', dc === true && world.decoy !== null);
    world.turkey.x = world.hazards.hays[0].x;
    const h = tryHideAction(world);
    check('hide-in-hay', h === true && world.turkey.hidden === true);
    world.turkey.hidden = false;
    // Stage 2: Opal joins.
    world.distancePx = 400 * 40; world.distanceMeters = 400;
    updateWorld(world, held, 1 / 60);
    check('stage-2-opal-joins', world.farmers.some((f) => f.id === 'opal'), world.farmers.map((f) => f.name).join(','));
    check('perk-awarded-stage-clear', world.perks.size >= 1, [...world.perks].join(','));
    // Stage 3: countdown.
    world.distancePx = 800 * 40; world.distanceMeters = 800;
    updateWorld(world, held, 1 / 60);
    check('countdown-stage-3', world.countdown === true);
    // Escape at 2400m.
    world.distancePx = 2400 * 40; world.distanceMeters = 2400;
    updateWorld(world, held, 1 / 60);
    check('escape-at-2400m', world.screen === 'escaped' && world.endStats !== null, world.ending);
    check('end-stats-10', world.endStats && Object.keys(world.endStats).length >= 10, Object.keys(world.endStats || {}).length + ' stats');
    // Caught path + restart.
    startRun(world, 'season');
    world.lives = 1;
    world.farmers[0].state = 'CHASE';
    world.farmers[0].x = world.turkey.x - 10;
    updateWorld(world, held, 1 / 60);
    check('caught-when-farmer-reaches', world.screen === 'caught' || world.lives < 1, 'screen ' + world.screen);
    startRun(world, 'season');
    check('restart-works', world.screen === 'play' && world.score === 0);
    // Endless mode loops.
    startRun(world, 'endless');
    world.distancePx = 2400 * 40; world.distanceMeters = 2400;
    updateWorld(world, held, 1 / 60);
    check('endless-loops', world.screen === 'play' && world.endlessLoop === 1, 'loop ' + world.endlessLoop);
  } catch (e) {
    out.push('FAIL exception — ' + (e && e.message));
  }
  check('no-console-errors', errors.length === 0, errors.join('; ') || '0 errors');
  const pre = document.getElementById('selftest');
  if (pre) pre.textContent = 'SELFTEST seed=' + seed + ' shot=' + shot + '\n' + out.join('\n');
  document.title = out.every((l) => l.startsWith('PASS')) ? 'SELFTEST ALL PASS' : 'SELFTEST FAILURES';
}
