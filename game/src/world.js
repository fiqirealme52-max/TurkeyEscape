// Game state: screens, score, perks, feats, economy, endings, endless.
// Season = 6 stages, 2400m. Free Range = endless loop of stages 3-6.
import { PLAYER, SCORE, PERKS, FEATS, FARMERS, VIEW } from './config.js';
import { STAGES, TOTAL_METERS, stageAt, stageStartMeters } from './stages.js';
import { mulberry32, hashSeed } from './random.js';
import { createTurkey, updateTurkey } from './turkey.js';
import { createFarmer, updateFarmer } from './farmer.js';
import { createHazards, updateHazards, nearHay, nextWaypoint } from './hazards.js';

export function loadBest() {
  try {
    return {
      best: parseInt(localStorage.getItem('gobbleDashBest') || '0', 10) || 0,
      endlessBest: parseInt(localStorage.getItem('gobbleDashEndlessBest') || '0', 10) || 0,
      featsEarned: JSON.parse(localStorage.getItem('gobbleDashFeats') || '[]'),
      escapes: parseInt(localStorage.getItem('gobbleDashEscapes') || '0', 10) || 0,
    };
  } catch { return { best: 0, endlessBest: 0, featsEarned: [], escapes: 0 }; }
}

export function saveBest(w) {
  try {
    localStorage.setItem('gobbleDashBest', String(Math.max(w.best, w.score)));
    localStorage.setItem('gobbleDashEndlessBest', String(Math.max(w.endlessBest, w.mode === 'endless' ? w.score : w.endlessBest)));
    localStorage.setItem('gobbleDashFeats', JSON.stringify([...w.featsEarned]));
    localStorage.setItem('gobbleDashEscapes', String(w.escapes));
  } catch { /* storage unavailable — game still runs */ }
}

export function createWorld(seed = 1, mode = 'season') {
  const rng = mulberry32(typeof seed === 'number' ? seed : hashSeed(String(seed)));
  const saved = loadBest();
  const w = {
    seed, rng, mode, // 'season' | 'endless'
    screen: 'title', // title | play | caught | escaped | paused
    turkey: createTurkey(),
    farmers: [],
    hazards: null,
    stage: STAGES[0],
    stageIndex: 0,
    distancePx: 0, distanceMeters: 0,
    score: 0, corn: 0, combo: 1, comboTimer: 0,
    lives: PLAYER.lives,
    perks: new Set(),
    perkBanner: null, perkBannerTimer: 0,
    featsEarned: new Set(saved.featsEarned),
    featsThisRun: [],
    featToast: null, featToastTimer: 0,
    counters: { hides: 0, knivesDodged: 0, closeCalls: 0, decoysUsed: 0, ovensPassed: 0, decoyFools: 0, jumps: 0 },
    best: saved.best, endlessBest: saved.endlessBest, escapes: saved.escapes,
    everSpotted: false, stageSeen: false,
    countdown: false, countdownShown: false,
    endlessLoop: 0,
    timeSec: 0,
    banner: null, bannerTimer: 0,
    lastDashCorn: 0, dashCornCount: 0, batchLine: '',
    decoy: null,
    runStartDistance: 0,
    endStats: null, ending: null,
    muted: false,
    onEvent: null, // (name, detail) — audio hook, set by main.js
  };
  w.hazards = createHazards(rng, STAGES[0]);
  w.farmers = [createFarmer(FARMERS[0], 60, 40, 420)];
  return w;
}

export function startRun(w, mode = 'season') {
  w.mode = mode;
  w.screen = 'play';
  w.turkey = createTurkey();
  w.distancePx = 0; w.distanceMeters = 0;
  w.score = 0; w.corn = 0; w.combo = 1; w.comboTimer = 0;
  w.lives = PLAYER.lives;
  w.perks = new Set();
  w.featsThisRun = [];
  w.counters = { hides: 0, knivesDodged: 0, closeCalls: 0, decoysUsed: 0, ovensPassed: 0, decoyFools: 0, jumps: 0 };
  w.everSpotted = false; w.stageSeen = false;
  w.countdown = false; w.countdownShown = false;
  w.endlessLoop = 0; w.timeSec = 0;
  w.decoy = null; w.banner = null; w.perkBanner = null;
  w.stageIndex = 0; w.stage = STAGES[0];
  w.hazards = createHazards(w.rng, STAGES[0]);
  w.farmers = [createFarmer(FARMERS[0], 60, 40, 420)];
  if (mode === 'endless') w.banner = 'FREE RANGE — ENDLESS';
  w.bannerTimer = 2.5;
}

function emit(w, name, detail) { if (w.onEvent) w.onEvent(name, detail); }

export function unlockFeat(w, id) {
  if (w.featsEarned.has(id)) return;
  const feat = FEATS.find((f) => f.id === id);
  if (!feat) return;
  w.featsEarned.add(id);
  w.featsThisRun.push(feat);
  w.score += SCORE.featBonus;
  w.featToast = 'FEAT: ' + feat.name + ' +' + SCORE.featBonus;
  w.featToastTimer = 2.5;
  emit(w, 'feat', feat);
}

export function awardPerk(w) {
  const next = PERKS[w.perks.size];
  if (!next) return;
  w.perks.add(next.id);
  // T3: show the perk's corn cost and the corn left after "buying" it.
  const left = Math.max(0, w.corn - next.cost);
  w.perkBanner = 'PERK EARNED: ' + next.name + ' \u2022 ' + next.cost + ' corn \u2022 SISA ' + left + ' corn';
  w.perkBannerTimer = 3;
  if (next.id === 'second-wind') w.lives += 1;
  if (next.id === 'lucky-wishbone') w.turkey.decoyCharges += 1;
  if (w.perks.size >= 3) unlockFeat(w, 'perk-collector');
  emit(w, 'perk', next);
}

// --- world callbacks used by turkey / farmer / hazards -------------------
export function makeCallbacks(w) {
  w.onLand = () => { /* landing resets jumpsLeft in turkey.js; nothing to count here */ };
  w.onSpotted = (f) => {
    w.everSpotted = true; w.stageSeen = true;
    emit(w, 'spotted', f);
  };
  w.onCaught = (f) => {
    if (w.turkey.invulnTimer > 0) return;
    w.lives -= 1;
    emit(w, 'caught', f);
    w.banner = 'CAUGHT BY ' + f.name + '!  ' + w.lives + ' LIVES LEFT';
    w.bannerTimer = 2;
    // Second Wind already added a life at award time; a catch costs one.
    w.turkey.x = 160; w.turkey.y = VIEW.ground; w.turkey.vy = 0;
    w.turkey.invulnTimer = 2;
    for (const fm of w.farmers) { fm.state = 'SEARCH'; fm.searchTimer = 2; fm.x = 60; }
    if (w.lives <= 0) endRun(w, 'caught');
  };
  w.onDecoyFooled = (f) => {
    w.counters.decoyFools += 1;
    w.banner = f.name + ' FOOLED BY THE DECOY!';
    w.bannerTimer = 1.6;
    if (w.counters.decoyFools >= 3) unlockFeat(w, 'decoy-master');
  };
  w.onKnifeDodged = () => {
    w.counters.knivesDodged += 1;
    if (w.counters.knivesDodged >= 10) unlockFeat(w, 'knife-dancer');
  };
  w.onKnifeHit = () => {
    if (w.turkey.invulnTimer > 0) return;
    w.lives -= 1;
    w.turkey.invulnTimer = 1.5;
    emit(w, 'hurt', null);
    if (w.lives <= 0) endRun(w, 'caught');
  };
  w.onOvenBurn = () => {
    if (w.turkey.invulnTimer > 0) return;
    w.turkey.invulnTimer = 1.2;
    w.turkey.x = Math.max(40, w.turkey.x - 60);
    w.lives -= 1;
    emit(w, 'hurt', null);
    if (w.lives <= 0) endRun(w, 'caught');
  };
  w.onCorn = (c) => {
    if (c.golden) {
      w.corn += SCORE.goldenGobbler;
      w.score += SCORE.goldenGobbler * 10;
      w.banner = 'GOLDEN GOBBLER! +500 CORN';
      w.bannerTimer = 2.5;
      emit(w, 'golden', c);
      return;
    }
    w.corn += 1;
    w.comboTimer = 3;
    w.combo = w.combo >= 5 ? 5 : w.combo + (w.corn % 5 === 0 ? 1 : 0);
    const mult = w.combo >= 5 ? 5 : w.combo >= 3 ? 3 : w.combo >= 2 ? 2 : 1;
    w.score += SCORE.corn * mult;
    w.turkey.stamina = Math.min(PLAYER.staminaMax, w.turkey.stamina + PLAYER.staminaPerCorn);
    w.dashCornCount += 1;
    if (w.corn >= 30) unlockFeat(w, 'corn-hoarder');
  };
  w.spawnDecoy = (x, y) => {
    w.decoy = { x, y, ttl: 3 };
    w.counters.decoysUsed += 1;
    for (const f of w.farmers) f.decoyTarget = w.decoy;
    emit(w, 'decoy', w.decoy);
  };
}

export function endRun(w, how) {
  if (how === 'escaped') {
    w.ending = !w.everSpotted ? 'PARDONED' : 'ESCAPED';
    if (w.ending === 'PARDONED') w.score += SCORE.pardonBonus;
    if (w.countdown) w.score += SCORE.countdownBonus;
    if (w.timeSec < 90 && w.timeSec > 0) unlockFeat(w, 'speedy');
    unlockFeat(w, 'free-bird');
    w.escapes += 1;
    w.screen = 'escaped';
  } else {
    w.ending = 'CAUGHT';
    w.screen = 'caught';
  }
  w.endStats = {
    score: w.score, distance: Math.floor(w.distanceMeters), time: Math.round(w.timeSec),
    hides: w.counters.hides, knives: w.counters.knivesDodged,
    closeCalls: w.counters.closeCalls, decoys: w.counters.decoysUsed,
    best: Math.max(w.best, w.score), perks: w.perks.size,
    feats: w.featsThisRun.length, escapes: w.escapes,
  };
  if (w.score > w.best) w.best = w.score;
  saveBest(w);
  emit(w, 'end', w.ending);
}

export function updateWorld(w, input, dt) {
  if (w.screen !== 'play') return;
  makeCallbacks(w);
  w.timeSec += dt;
  if (w.comboTimer > 0) { w.comboTimer -= dt; if (w.comboTimer <= 0) w.combo = 1; }
  if (w.bannerTimer > 0) w.bannerTimer -= dt;
  if (w.perkBannerTimer > 0) w.perkBannerTimer -= dt;
  if (w.featToastTimer > 0) w.featToastTimer -= dt;
  if (w.decoy) { w.decoy.ttl -= dt; if (w.decoy.ttl <= 0) w.decoy = null; }

  const prevStage = w.stageIndex;
  const { stage, into } = stageAt(w.distanceMeters);
  w.stage = stage;
  w.stageIndex = STAGES.indexOf(stage);
  if (w.stageIndex !== prevStage) {
    // Stage cleared: award next perk, reset per-stage sighting, add bonus.
    if (w.stageIndex > prevStage) {
      w.score += SCORE.stageBonus;
      awardPerk(w);
      if (!w.stageSeen) unlockFeat(w, 'ghost-run');
      w.stageSeen = false;
      w.banner = 'STAGE ' + stage.id + ' — ' + stage.name;
      w.bannerTimer = 2;
    }
    w.hazards = createHazards(w.rng, stage);
    // Opal joins from stage 2; she patrols stages 2-4 only.
    if (stage.id >= 2 && stage.id <= 4 && !w.farmers.some((f) => f.id === 'opal')) {
      w.farmers.push(createFarmer(FARMERS[1], 500, 380, 820));
    }
    if (stage.id > 4) w.farmers = w.farmers.filter((f) => f.id === 'silas');
    if (stage.countdown && !w.countdownShown) {
      w.countdown = true; w.countdownShown = true;
      w.banner = 'THANKSGIVING COUNTDOWN — Dinner is in one hour. Everything is faster now! (+2000 if you survive)';
      w.bannerTimer = 3.5;
    }
  }

  // End of the road (season): escape at 2400m.
  if (w.mode === 'season' && w.distanceMeters >= TOTAL_METERS) {
    endRun(w, 'escaped');
    return;
  }
  // Endless: loop stages 3-6, farmers get 10% faster per loop.
  if (w.mode === 'endless' && w.distanceMeters >= TOTAL_METERS) {
    w.endlessLoop += 1;
    w.distancePx = stageStartMeters(3) * 40;
    w.distanceMeters = stageStartMeters(3);
    w.banner = 'FREE RANGE LOOP ' + (w.endlessLoop + 1) + ' — FARMERS 10% FASTER';
    w.bannerTimer = 2.5;
  }

  updateTurkey(w.turkey, input, w.perks, dt, w);
  for (const f of w.farmers) updateFarmer(f, w.turkey, w, dt);
  updateHazards(w.hazards, w.rng, w, dt);

  // Close call: farmer within 60px while dashing past, or knife grazing.
  const nearest = Math.min(...w.farmers.map((f) => Math.abs(f.x - w.turkey.x)));
  if (nearest < 60 && nearest > 28 && w.turkey.dashTimer > 0) {
    w.counters.closeCalls += 1;
    w.score += SCORE.closeCall;
    w.banner = 'CLOSE CALL! +' + SCORE.closeCall;
    w.bannerTimer = 1.2;
    if (w.counters.closeCalls >= 5) unlockFeat(w, 'close-call-5');
  }

  // Batching display (P2): when a dash ends, report what that one dash did.
  if (w.turkey.dashTimer <= 0 && w.dashCornCount > 0 && w.lastDashCorn !== w.dashCornCount) {
    w.lastDashCorn = w.dashCornCount;
    w.batchLine = '1 dash \u00b7 ' + w.dashCornCount + ' corn';
  }

  // Feat checks that depend on distance / time.
  if (w.distanceMeters >= 1600) unlockFeat(w, 'marathon');
  if (w.counters.hides >= 3) unlockFeat(w, 'hay-ghost');

  // Hide action is edge-triggered by main.js calling tryHideAction.
  w._into = into;
  w._route = nextWaypoint(w.hazards, stage, into);
}

export function tryHideAction(w) {
  if (nearHay(w.hazards, w.turkey.x)) {
    w.turkey.hidden = true;
    w.turkey.hideTimer = 3;
    w.counters.hides += 1;
    emit(w, 'hide', null);
    return true;
  }
  return false;
}
