// Deterministic screenshot branches (?shot= + seed).
// Each branch sets a fixed, readable game state — no randomness, no
// Date.now(), no "BEST 0" anywhere (R3.14: best seeded to 10480).
import { STAGES, stageStartMeters } from './stages.js';
import { FARMERS, FEATS, PERKS } from './config.js';
import { createFarmer } from './farmer.js';
import { createHazards } from './hazards.js';
import { startRun } from './world.js';

function seedFeats(w, n) {
  // Show a mid-campaign feat count on the title (never 0/12 in a shot).
  const ids = FEATS.slice(0, n).map((f) => f.id);
  w.featsEarned = new Set(ids);
  w.featsThisRun = FEATS.slice(0, n);
}

function seedPerks(w, n) {
  w.perks = new Set(PERKS.slice(0, n).map((p) => p.id));
}

export function applyShot(w, search) {
  const q = new URLSearchParams(search || '');
  const shot = q.get('shot') || 'start';
  w.best = Math.max(w.best, 10480);

  if (shot === 'start') {
    w.screen = 'title';
    seedFeats(w, 7);
    w.escapes = 3;
    return 'start';
  }

  if (shot === 'play') {
    // Cover: kitchen (stage 3, the hardest), dense HUD, near-miss beat.
    startRun(w, 'season');
    const into = 200;
    w.distancePx = (stageStartMeters(3) + into) * 40;
    w.distanceMeters = stageStartMeters(3) + into;
    w.stageIndex = 2;
    w.stage = STAGES[2];
    w.hazards = createHazards(w.rng, STAGES[2]);
    w.score = 51480;
    w.corn = 61;
    w.combo = 5;
    w.lives = 3;
    seedPerks(w, 3);
    seedFeats(w, 7);
    w.countdown = true;
    w.countdownShown = true;
    // Banner shows the stage; the countdown line lives in its own panel
    // (drawHUD) — showing the same sentence twice looked like a glitch.
    w.banner = 'STAGE 3 — KITCHEN';
    w.bannerTimer = 99;
    w.perkBanner = 'PERK EARNED: Second Wind \u2022 20 corn \u2022 SISA 41 corn';
    w.perkBannerTimer = 99;
    w.batchLine = '1 dash \u00b7 3 corn';
    w.nearMiss = true;
    w.turkey.x = 300; w.turkey.y = 462;
    w.turkey.stamina = 72;
    w.turkey.invulnTimer = 600; // freeze the catch so the cover composition stays put
    w.farmers = [
      createFarmer(FARMERS[0], 210, 40, 420),
      createFarmer(FARMERS[1], 640, 380, 820),
    ];
    w.farmers[0].state = 'SEARCH'; w.farmers[0].suspicion = 65; w.farmers[0].dir = 1;
    w.farmers[1].state = 'PATROL'; w.farmers[1].suspicion = 22; w.farmers[1].dir = -1;
    return 'play';
  }

  if (shot === 'farm') {
    // Farmyard stage 1: route drawn, named area + legend visible.
    startRun(w, 'season');
    const into = 120;
    w.distancePx = into * 40;
    w.distanceMeters = into;
    w.stageIndex = 0;
    w.stage = STAGES[0];
    w.hazards = createHazards(w.rng, STAGES[0]);
    w.score = 12480;
    w.corn = 22; // enough for the next perk (Featherweight 15) with 7 left
    w.combo = 2;
    w.lives = 3;
    seedPerks(w, 1);
    seedFeats(w, 2);
    w.turkey.x = 170; w.turkey.y = 462;
    w.turkey.stamina = 88;
    w.turkey.invulnTimer = 600; // freeze the catch so the farmyard composition stays put
    w.farmers = [createFarmer(FARMERS[0], 620, 40, 420)];
    w.farmers[0].state = 'PATROL'; w.farmers[0].suspicion = 12; w.farmers[0].dir = -1;
    return 'farm';
  }

  if (shot === 'end') {
    // End screen: ESCAPED, 10 stats, feats earned, restart button.
    startRun(w, 'season');
    w.distanceMeters = 2400;
    w.score = 51480;
    w.corn = 61;
    w.timeSec = 82;
    w.counters = { hides: 4, knivesDodged: 12, closeCalls: 6, decoysUsed: 3, ovensPassed: 5, decoyFools: 3, jumps: 41 };
    seedPerks(w, 6);
    seedFeats(w, 8);
    w.escapes = 4;
    w.best = 51480;
    w.ending = 'ESCAPED';
    w.screen = 'escaped';
    w.endStats = {
      score: 51480, distance: 2400, time: 82,
      hides: 4, knives: 12, closeCalls: 6, decoys: 3,
      best: 51480, perks: 6, feats: 8, escapes: 4,
    };
    return 'end';
  }

  w.screen = 'title';
  return 'start';
}
