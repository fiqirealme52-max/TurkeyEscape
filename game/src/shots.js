'use strict';
/* Deterministic screenshot states: ?shot=start|play|kitchen|end&seed=N.
   Each one freezes the game on a single readable frame so the
   screenshots are stable renders of the real game. */

const Shots = {
  apply(query) {
    const shot = query.get('shot');
    if (!shot) return false;
    const seed = parseInt(query.get('seed') || '1', 10) || 1;

    if (shot === 'start') {
      Game.loadBest();
      Game.screen = 'title';
      Game.time = 3.2;
      Game.frozen = true;
      return true;
    }

    if (shot === 'play') {
      Game.newRun(seed);
      Game.frozen = false;
      /* Farmyard mid-run: turkey sprinting, farmer chasing, knives in the air. */
      Turkey.x = 330; Turkey.y = CFG.FLOOR - Turkey.h - 40; Turkey.vy = -160;
      Turkey.face = 1; Turkey.vx = CFG.TURKEY.run;
      Farmer.x = 190; Farmer.dir = 1; Farmer.state = 'chase'; Farmer.spotFlash = 1;
      Farmer.lastSeenX = Turkey.x;
      Hazards.knives = [
        { x: 420, y: 120, state: 'fall', t: 0.7, w: 16, h: 46 },
        { x: 560, y: 30, state: 'warn', t: 0.2, w: 16, h: 46 },
        { x: 700, y: 200, state: 'fall', t: 0.9, w: 16, h: 46 }
      ];
      Hazards.corns[1].taken = true;
      Game.score = 1450; Game.dist = 320; Game.corn = 6; Game.combo = 3; Game.time = 24.5;
      Game.showBanner('SPOTTED!', 999);
      Game.frozen = true;
      return true;
    }

    if (shot === 'kitchen') {
      Game.newRun(seed);
      Game.stage = 2;
      Game.loadStage(2);
      /* Kitchen cover: oven lit, farmer right behind the turkey, knife falling. */
      Turkey.x = 500; Turkey.y = CFG.FLOOR - Turkey.h; Turkey.face = 1; Turkey.vx = CFG.TURKEY.run;
      Farmer.x = 405; Farmer.dir = 1; Farmer.state = 'chase'; Farmer.spotFlash = 1;
      Farmer.lastSeenX = Turkey.x;
      Hazards.knives = [
        { x: 640, y: 90, state: 'fall', t: 0.6, w: 16, h: 46 },
        { x: 300, y: 10, state: 'warn', t: 0.2, w: 16, h: 46 }
      ];
      Hazards.pins = [{ x: 240, y: CFG.FLOOR - 18, w: 34, h: 18, vx: 260, rot: 0.6 }];
      Hazards.corns[0].taken = true; Hazards.corns[1].taken = true;
      Game.score = 3890; Game.dist = 940; Game.corn = 14; Game.combo = 5; Game.time = 68.0;
      Game.showBanner('SPOTTED!', 999);
      Game.frozen = true;
      return true;
    }

    if (shot === 'end') {
      Game.newRun(seed);
      Game.screen = 'escaped';
      Game.score = 5240; Game.best = 5240; Game.dist = 1200; Game.corn = 18;
      Game.stage = 2; Game.time = 92.4;
      Game.frozen = true;
      return true;
    }
    return false;
  }
};
