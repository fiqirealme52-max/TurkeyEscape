'use strict';
/* Farmer AI: patrol -> spot -> chase -> search -> corner.
   He sees the turkey in a vision cone, remembers the last seen spot,
   and in the kitchen he cuts the turkey off near the escape door. */

const Farmer = {
  x: 560, y: CFG.FLOOR - CFG.FARMER.h, vx: 0,
  w: CFG.FARMER.w, h: CFG.FARMER.h,
  dir: -1, state: 'patrol', stateT: 0, patrolMin: 420, patrolMax: 780,
  lastSeenX: 0, lastSeenY: 0, loseT: 0, walkT: 0, spotFlash: 0,

  reset(x, min, max, speedMul) {
    Farmer.x = x; Farmer.y = CFG.FLOOR - Farmer.h;
    Farmer.dir = -1; Farmer.state = 'patrol'; Farmer.stateT = 0;
    Farmer.patrolMin = min; Farmer.patrolMax = max;
    Farmer.loseT = 0; Farmer.spotFlash = 0; Farmer.walkT = 0;
    Farmer.speedMul = speedMul || 1;
  },

  /* Can the farmer see the turkey right now? Cone: facing dir, 270 range. */
  canSee() {
    if (Turkey.hidden) return false;
    const dx = (Turkey.x + Turkey.w / 2) - (Farmer.x + Farmer.w / 2);
    const dy = (Turkey.y + Turkey.h / 2) - (Farmer.y + Farmer.h / 2);
    if (Math.sign(dx) !== Farmer.dir && Math.abs(dx) > 30) return false;
    return Math.abs(dx) < 280 && Math.abs(dy) < 95;
  },

  update(dt, stageIdx) {
    if (Farmer.spotFlash > 0) Farmer.spotFlash -= dt;
    Farmer.stateT += dt;
    const speed = (s) => s * Farmer.speedMul;
    const seen = Farmer.canSee();
    if (seen) {
      Farmer.lastSeenX = Turkey.x;
      Farmer.lastSeenY = Turkey.y;
      Farmer.loseT = 0;
    }
    /* A fresh decoy pulls him off patrol and onto the straw turkey. */
    if (Game.decoyTarget() !== null && Farmer.state !== 'chase') {
      Farmer.state = 'chase'; Farmer.stateT = 0;
    }

    if (Farmer.state === 'patrol') {
      Farmer.vx = Farmer.dir * speed(CFG.FARMER.patrol);
      Farmer.x += Farmer.vx * dt;
      if (Farmer.x < Farmer.patrolMin) { Farmer.x = Farmer.patrolMin; Farmer.dir = 1; }
      if (Farmer.x > Farmer.patrolMax) { Farmer.x = Farmer.patrolMax; Farmer.dir = -1; }
      if (seen) {
        Farmer.state = 'chase'; Farmer.stateT = 0; Farmer.spotFlash = 1.1;
        Sfx.sting();
      }
    } else if (Farmer.state === 'chase') {
      /* A decoy pulls him off the turkey entirely. */
      const decoyX = Game.decoyTarget();
      /* Cornering: in the kitchen, run to cut the turkey off at the door. */
      let targetX = decoyX !== null ? decoyX : Turkey.x;
      if (stageIdx === 2 && Turkey.x > 560) targetX = Math.min(Turkey.x + 95, 856);
      const d = (targetX + Turkey.w / 2) - (Farmer.x + Farmer.w / 2);
      Farmer.dir = d >= 0 ? 1 : -1;
      Farmer.vx = Math.sign(d) * speed(CFG.FARMER.chase);
      Farmer.x += Farmer.vx * dt;
      Farmer.x = clamp(Farmer.x, 8, CFG.W - Farmer.w - 8);
      if (!seen) {
        Farmer.loseT += dt;
        if (Farmer.loseT > 2.2) { Farmer.state = 'search'; Farmer.stateT = 0; }
      }
    } else if (Farmer.state === 'search') {
      const d = (Farmer.lastSeenX + Turkey.w / 2) - (Farmer.x + Farmer.w / 2);
      if (Math.abs(d) > 12) {
        Farmer.dir = d >= 0 ? 1 : -1;
        Farmer.vx = Farmer.dir * speed(CFG.FARMER.search);
        Farmer.x += Farmer.vx * dt;
      } else {
        Farmer.vx = 0;
        Farmer.dir = Farmer.stateT % 1.6 < 0.8 ? 1 : -1; /* look around */
        if (Farmer.stateT > 2.6) { Farmer.state = 'patrol'; Farmer.stateT = 0; }
      }
      if (seen) { Farmer.state = 'chase'; Farmer.stateT = 0; Farmer.spotFlash = 1.1; Sfx.sting(); }
    }
    if (Math.abs(Farmer.vx) > 10) Farmer.walkT += dt;
  },

  /* Vision cone, drawn under the farmer. */
  drawCone(ctx) {
    const fx = Farmer.x + Farmer.w / 2;
    const fy = Farmer.y + 34;
    const range = 280;
    ctx.save();
    ctx.fillStyle = Farmer.state === 'chase' ? 'rgba(217,58,43,0.16)' : 'rgba(255,201,60,0.13)';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    const tipX = fx + Farmer.dir * range;
    ctx.lineTo(tipX, fy - 62);
    ctx.lineTo(tipX, fy + 62);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  /* Draw the farmer with straw hat, red shirt, blue overalls, pitchfork. */
  draw(ctx) {
    const f = Farmer;
    ctx.save();
    const cx = f.x + f.w / 2;
    const step = Math.abs(f.vx) > 10 ? Math.sin(f.walkT * 10) * 6 : 0;
    const bob = Math.abs(f.vx) > 10 ? Math.abs(Math.sin(f.walkT * 10)) * 2 : 0;
    const top = f.y - bob;

    /* Legs (overalls). */
    ctx.strokeStyle = '#2b4d8f';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 10, top + 56); ctx.lineTo(cx - 12 + step, CFG.FLOOR);
    ctx.moveTo(cx + 10, top + 56); ctx.lineTo(cx + 12 - step, CFG.FLOOR);
    ctx.stroke();
    /* Torso: red shirt + overall straps. */
    ctx.fillStyle = '#c23b2e';
    ctx.beginPath();
    ctx.roundRect(cx - 21, top + 22, 42, 38, 6);
    ctx.fill();
    ctx.fillStyle = '#2b4d8f';
    ctx.fillRect(cx - 15, top + 22, 7, 34);
    ctx.fillRect(cx + 8, top + 22, 7, 34);
    ctx.fillRect(cx - 15, top + 48, 30, 8);
    /* Arms: one holds the pitchfork. */
    ctx.strokeStyle = '#c23b2e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx + f.dir * 18, top + 30);
    ctx.lineTo(cx + f.dir * 30, top + 48);
    ctx.stroke();
    /* Pitchfork. */
    const px = cx + f.dir * 34;
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px, top + 78); ctx.lineTo(px, top - 6);
    ctx.stroke();
    ctx.strokeStyle = '#cfd6dd';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(px + i * 6, top - 6); ctx.lineTo(px + i * 6, top - 18);
      ctx.stroke();
    }
    /* Head + beard + straw hat. */
    ctx.fillStyle = '#f0c297';
    ctx.beginPath();
    ctx.arc(cx, top + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath();
    ctx.arc(cx, top + 19, 9, 0.1, Math.PI - 0.1);
    ctx.fill();
    ctx.fillStyle = '#1c0f05';
    ctx.beginPath();
    ctx.arc(cx + f.dir * 4, top + 10, 2, 0, Math.PI * 2);
    ctx.fill();
    /* Straw hat: wide brim + dome. */
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.ellipse(cx, top + 2, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, top - 4, 13, 8, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a34d12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, top + 2, 24, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    /* Spotted "!" bubble. */
    if (f.spotFlash > 0 || f.state === 'chase') {
      ctx.fillStyle = '#d93a2b';
      ctx.beginPath();
      ctx.arc(cx + f.dir * 26, top - 26, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', cx + f.dir * 26, top - 25);
    }
    ctx.restore();
  }
};
