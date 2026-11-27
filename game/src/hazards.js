'use strict';
/* Hazards + pickups: falling carving knives, rolling pins, the oven,
   and corn to collect. All positions come from the stage layout. */

const Hazards = {
  knives: [], pins: [], corns: [], oven: null,
  knifeTimer: 0, pinTimer: 0, rng: makeRng(7),

  reset(stageIdx, rng) {
    Hazards.knives = []; Hazards.pins = []; Hazards.corns = [];
    Hazards.knifeTimer = 1.2; Hazards.pinTimer = 3.0;
    Hazards.rng = rng;
    const def = STAGE_DEFS[stageIdx];
    Hazards.oven = def.oven ? { x: def.oven.x, y: CFG.FLOOR - 92, w: def.oven.w, h: 92 } : null;
    for (const c of def.corn) Hazards.corns.push({ x: c[0], y: c[1], taken: false, bob: rng() * 6 });
  },

  /* Spawn + move hazards. Returns 'knife' | 'pin' | 'oven' when one hits the turkey. */
  update(dt, stageIdx) {
    const def = STAGE_DEFS[stageIdx];
    const rng = Hazards.rng;

    Hazards.knifeTimer -= dt;
    if (Hazards.knifeTimer <= 0) {
      Hazards.knifeTimer = def.knifeRate * (0.8 + rng() * 0.5);
      const tx = clamp(Turkey.x + (rng() - 0.5) * 260, 30, CFG.W - 30);
      Hazards.knives.push({ x: tx, y: -30, state: 'warn', t: 0, w: 16, h: 46 });
    }
    for (const k of Hazards.knives) {
      k.t += dt;
      if (k.state === 'warn' && k.t > CFG.KNIFE.warn) { k.state = 'fall'; }
      if (k.state === 'fall') k.y += CFG.KNIFE.fall * dt;
      if (k.state === 'fall' && k.y + k.h >= CFG.FLOOR) { k.state = 'stuck'; k.t = 0; k.y = CFG.FLOOR - k.h; }
      if (k.state === 'stuck' && k.t > 1.1) k.gone = true;
    }
    Hazards.knives = Hazards.knives.filter((k) => !k.gone);

    if (def.pinRate > 0) {
      Hazards.pinTimer -= dt;
      if (Hazards.pinTimer <= 0) {
        Hazards.pinTimer = def.pinRate * (0.85 + rng() * 0.4);
        const fromLeft = rng() < 0.5;
        Hazards.pins.push({
          x: fromLeft ? -40 : CFG.W + 10, y: CFG.FLOOR - 18, w: 34, h: 18,
          vx: (fromLeft ? 1 : -1) * CFG.PIN.speed * (1 + stageIdx * 0.25), rot: 0
        });
      }
    }
    for (const p of Hazards.pins) { p.x += p.vx * dt; p.rot += p.vx * dt * 0.06; }
    Hazards.pins = Hazards.pins.filter((p) => p.x > -60 && p.x < CFG.W + 60);

    /* Corn pickup. */
    for (const c of Hazards.corns) {
      if (!c.taken && overlap(Turkey, { x: c.x - 14, y: c.y - 14, w: 28, h: 28 })) {
        c.taken = true;
        Game.corn += 1; Game.score += CFG.CORN_SCORE;
        Sfx.pickup();
      }
    }

    if (Turkey.invuln > 0) return null;
    for (const k of Hazards.knives) {
      if (k.state === 'fall' && overlap(Turkey, { x: k.x - 5, y: k.y, w: k.w + 10, h: k.h })) return 'knife';
    }
    for (const p of Hazards.pins) {
      if (overlap(Turkey, p)) return 'pin';
    }
    if (Hazards.oven && overlap(Turkey, { x: Hazards.oven.x + 6, y: Hazards.oven.y + 10, w: Hazards.oven.w - 12, h: Hazards.oven.h - 10 })) return 'oven';
    return null;
  },

  draw(ctx, time) {
    /* Oven: glowing box with fire inside + heat shimmer. */
    if (Hazards.oven) {
      const o = Hazards.oven;
      ctx.save();
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 8);
      ctx.fill();
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.roundRect(o.x + 10, o.y + 14, o.w - 20, 52, 6);
      ctx.fill();
      ctx.fillStyle = '#ffd23c';
      const flick = Math.sin(time * 9) * 4;
      ctx.beginPath();
      ctx.moveTo(o.x + 18, o.y + 60);
      ctx.quadraticCurveTo(o.x + o.w / 2 + flick, o.y + 18, o.x + o.w - 18, o.y + 60);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('OVEN 450F', o.x + o.w / 2, o.y + 82);
      ctx.fillStyle = 'rgba(255,122,26,0.25)';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y - 6, o.w / 2 + 14, 14 + Math.sin(time * 6) * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* Knives: warning glint, then the falling blade. */
    for (const k of Hazards.knives) {
      ctx.save();
      if (k.state === 'warn') {
        ctx.fillStyle = 'rgba(217,58,43,0.35)';
        ctx.beginPath();
        ctx.ellipse(k.x, CFG.FLOOR, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d93a2b';
        ctx.font = 'bold 18px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', k.x, CFG.FLOOR - 14 - Math.sin(time * 10) * 3);
      } else {
        ctx.translate(k.x, k.y + k.h / 2);
        ctx.fillStyle = '#dfe6ea';
        ctx.beginPath();
        ctx.moveTo(0, -k.h / 2);
        ctx.lineTo(8, -k.h / 2 + 18);
        ctx.lineTo(8, k.h / 2 - 8);
        ctx.lineTo(0, k.h / 2);
        ctx.lineTo(-8, k.h / 2 - 8);
        ctx.lineTo(-8, -k.h / 2 + 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#7a4a21';
        ctx.fillRect(-5, k.h / 2 - 10, 10, 10);
      }
      ctx.restore();
    }

    /* Rolling pins. */
    for (const p of Hazards.pins) {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#c89a5e';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, -7, p.w, 14, 7);
      ctx.fill();
      ctx.fillStyle = '#8a6a3b';
      ctx.fillRect(-p.w / 2 - 6, -3, 6, 6);
      ctx.fillRect(p.w / 2, -3, 6, 6);
      ctx.restore();
    }

    /* Corn cobs. */
    for (const c of Hazards.corns) {
      if (c.taken) continue;
      const bobY = c.y + Math.sin(time * 3 + c.bob) * 3;
      ctx.save();
      ctx.translate(c.x, bobY);
      ctx.fillStyle = '#f2c230';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 13, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c89a1e';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-6, i * 5);
        ctx.lineTo(6, i * 5 - 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#3f7a34';
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(-7, 20);
      ctx.lineTo(7, 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
};
