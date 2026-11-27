'use strict';
/* Game state machine: title -> play -> caught / escaped, with score,
   distance, lives, stage flow and the farmer-catch rules. */

const Game = {
  screen: 'title', /* title | play | caught | escaped */
  stage: 0, score: 0, dist: 0, corn: 0, lives: CFG.LIVES,
  time: 0, best: 0, frozen: false,
  banner: '', bannerT: 0, shake: 0, flash: 0,
  stageClearT: 0, endReason: '', seed: 1, rng: makeRng(1),
  leaves: [], over: false,

  loadBest() {
    try { Game.best = parseInt(window.localStorage.getItem('gobble-dash-best') || '0', 10) || 0; }
    catch (e) { Game.best = 0; }
  },
  saveBest() {
    try { window.localStorage.setItem('gobble-dash-best', String(Game.best)); } catch (e) { /* no storage */ }
  },

  newRun(seed) {
    Game.seed = seed || 1;
    Game.rng = makeRng(Game.seed);
    Game.screen = 'play';
    Game.stage = 0; Game.score = 0; Game.dist = 0; Game.corn = 0;
    Game.lives = CFG.LIVES; Game.time = 0; Game.over = false;
    Game.banner = ''; Game.bannerT = 0; Game.shake = 0; Game.flash = 0;
    Game.leaves = [];
    for (let i = 0; i < 14; i++) {
      Game.leaves.push({ x: Game.rng() * CFG.W, y: Game.rng() * 470, v: 12 + Game.rng() * 22, r: (Game.rng() - 0.5) * 2 });
    }
    Game.loadStage(0);
    Sfx.gobble();
  },

  loadStage(i) {
    const def = STAGE_DEFS[i];
    Turkey.reset(80);
    Farmer.reset(560 + i * 40, def.patrol[0], def.patrol[1], def.farmerSpeed);
    Hazards.reset(i, Game.rng);
    Game.stageClearT = 0;
  },

  showBanner(text, secs) { Game.banner = text; Game.bannerT = secs || 1.4; },

  loseLife(cause) {
    if (Turkey.invuln > 0 || Game.screen !== 'play') return;
    Game.lives -= 1;
    Turkey.invuln = 2.0;
    Turkey.vx = -Turkey.face * 260;
    Turkey.vy = -320;
    Turkey.onGround = false;
    Game.shake = 0.45; Game.flash = 0.5;
    Game.showBanner(cause === 'oven' ? 'TOO HOT! THE OVEN BITES!' : cause === 'pin' ? 'BONK! ROLLING PIN!' : 'SLICED! THE KNIFE GOT YOU!', 1.2);
    Sfx.hit();
    if (Game.lives <= 0) {
      Game.screen = 'caught';
      Game.endReason = cause;
      if (Game.score > Game.best) { Game.best = Game.score; Game.saveBest(); }
      Sfx.lose();
    }
  },

  clearStage() {
    Game.score += CFG.STAGE_BONUS;
    Sfx.stageClear();
    if (Game.stage >= 2) {
      Game.screen = 'escaped';
      if (Game.score > Game.best) { Game.best = Game.score; Game.saveBest(); }
      Sfx.win();
      return;
    }
    Game.stage += 1;
    Game.loadStage(Game.stage);
    Game.showBanner('STAGE ' + (Game.stage + 1) + ': ' + STAGE_DEFS[Game.stage].name + '!', 1.8);
  },

  update(dt) {
    if (Game.frozen) return;
    Game.time += dt;
    if (Game.bannerT > 0) Game.bannerT -= dt;
    if (Game.shake > 0) Game.shake -= dt;
    if (Game.flash > 0) Game.flash -= dt;

    if (Game.screen === 'title') {
      if (Input.hit(' ') || Input.hit('enter') || Input.tap()) {
        Sfx.ensure();
        Game.newRun(1 + Math.floor(Math.random() * 100000));
      }
      return;
    }
    if (Game.screen === 'caught' || Game.screen === 'escaped') {
      if (Input.hit(' ') || Input.hit('enter') || Input.tap()) {
        Sfx.ensure();
        Game.newRun(1 + Math.floor(Math.random() * 100000));
      }
      return;
    }

    /* --- play --- */
    const def = STAGE_DEFS[Game.stage];
    if ((Input.hit('s') || Input.hit('arrowdown')) && Turkey.onGround) {
      if (Turkey.tryHide(def.hides)) Sfx.gobble();
    }
    Turkey.update(dt, def.platforms);
    Farmer.update(dt, Game.stage);
    const hit = Hazards.update(dt, Game.stage);
    if (hit) Game.loseLife(hit);
    if (Game.screen !== 'play') return;

    /* Farmer catches the turkey on touch. */
    if (Turkey.invuln <= 0 && overlap(Turkey, { x: Farmer.x + 8, y: Farmer.y + 6, w: Farmer.w - 16, h: Farmer.h - 6 })) {
      Game.lives -= 1;
      Turkey.invuln = 2.0;
      Turkey.vx = -Farmer.dir * 300;
      Turkey.vy = -340;
      Turkey.onGround = false;
      Game.shake = 0.5; Game.flash = 0.5;
      Game.showBanner('CAUGHT BY THE FARMER!', 1.2);
      Sfx.hit();
      Farmer.state = 'patrol'; Farmer.stateT = 0; Farmer.x = clamp(Farmer.x - Farmer.dir * 120, 40, CFG.W - 100);
      if (Game.lives <= 0) {
        Game.screen = 'caught';
        Game.endReason = 'farmer';
        if (Game.score > Game.best) { Game.best = Game.score; Game.saveBest(); }
        Sfx.lose();
        return;
      }
    }

    /* Distance + trickle score while running right. */
    const moved = Math.max(0, Turkey.x - 80);
    Game.dist = Game.stage * 400 + Math.floor(moved / 2);
    Game.score += Math.floor(Math.abs(Turkey.vx) * dt * 0.06);

    /* Reached the gate: next stage (or escape in the kitchen). */
    if (Turkey.x + Turkey.w >= def.gateX && Turkey.y + Turkey.h >= CFG.FLOOR - 130) {
      Game.clearStage();
    }
  },

  /* One-line objective shown under the HUD. */
  objective() {
    if (Game.stage === 2) return 'Reach the green FREE door - dodge the oven, knives and pins!';
    return 'Reach the gate on the right - don\'t let the farmer grab you!';
  }
};
