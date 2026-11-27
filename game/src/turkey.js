'use strict';
/* The player turkey: run, jump, dash, hide. Drawn big and readable. */

const Turkey = {
  x: 80, y: CFG.FLOOR - CFG.TURKEY.h, vx: 0, vy: 0,
  w: CFG.TURKEY.w, h: CFG.TURKEY.h,
  face: 1, onGround: true, hidden: false, hideSpot: null,
  dashCd: 0, dashT: 0, invuln: 0, walkT: 0, coyote: 0,

  reset(x) {
    Turkey.x = x; Turkey.y = CFG.FLOOR - Turkey.h;
    Turkey.vx = 0; Turkey.vy = 0; Turkey.face = 1;
    Turkey.hidden = false; Turkey.hideSpot = null;
    Turkey.dashCd = 0; Turkey.dashT = 0; Turkey.invuln = 0; Turkey.walkT = 0;
  },

  /* Move + collide with floor and platforms. platforms: [{x,y,w,h}]. */
  update(dt, platforms) {
    if (Turkey.invuln > 0) Turkey.invuln -= dt;
    if (Turkey.dashCd > 0) Turkey.dashCd -= dt;
    if (Turkey.dashT > 0) Turkey.dashT -= dt;

    if (Turkey.hidden) {
      if (Input.held('arrowleft') || Input.held('a') || Input.held('arrowright') || Input.held('d')
        || Input.hit(' ') || Input.hit('arrowup') || Input.hit('w')) {
        Turkey.hidden = false; Turkey.hideSpot = null;
      } else {
        Turkey.vx = 0; Turkey.vy = 0;
        return;
      }
    }

    const left = Input.held('arrowleft') || Input.held('a');
    const right = Input.held('arrowright') || Input.held('d');
    const want = (right ? 1 : 0) - (left ? 1 : 0);
    const speed = Turkey.dashT > 0 ? CFG.TURKEY.dash : CFG.TURKEY.run;
    Turkey.vx = want * speed;
    if (want !== 0) Turkey.face = want;

    if (Turkey.onGround) Turkey.coyote = 0.12; else Turkey.coyote -= dt;
    if ((Input.hit(' ') || Input.hit('arrowup') || Input.hit('w')) && Turkey.coyote > 0) {
      Turkey.vy = -CFG.TURKEY.jump;
      Turkey.onGround = false; Turkey.coyote = 0;
      Sfx.flap();
    }
    if ((Input.hit('shift') || Input.hit('x')) && Turkey.dashCd <= 0) {
      Turkey.dashT = 0.22; Turkey.dashCd = CFG.DASH_CD;
      Turkey.vx = Turkey.face * CFG.TURKEY.dash;
      Sfx.dash();
    }

    Turkey.vy += CFG.GRAV * dt;
    Turkey.x += Turkey.vx * dt;
    Turkey.y += Turkey.vy * dt;
    Turkey.x = clamp(Turkey.x, 8, CFG.W - Turkey.w - 8);

    Turkey.onGround = false;
    if (Turkey.y + Turkey.h >= CFG.FLOOR) {
      Turkey.y = CFG.FLOOR - Turkey.h; Turkey.vy = 0; Turkey.onGround = true;
    }
    for (const p of platforms) {
      if (Turkey.vy >= 0 && Turkey.x + Turkey.w > p.x + 4 && Turkey.x < p.x + p.w - 4
        && Turkey.y + Turkey.h >= p.y && Turkey.y + Turkey.h - Turkey.vy * dt <= p.y + 6) {
        Turkey.y = p.y - Turkey.h; Turkey.vy = 0; Turkey.onGround = true;
      }
    }
    if (Turkey.onGround && Math.abs(Turkey.vx) > 10) Turkey.walkT += dt;
  },

  /* Try to hide at a nearby hide spot; returns true when hidden. */
  tryHide(spots) {
    for (const s of spots) {
      if (Turkey.x + Turkey.w > s.x && Turkey.x < s.x + s.w
        && Turkey.y + Turkey.h >= s.y - 10 && Turkey.y + Turkey.h <= CFG.FLOOR + 2) {
        Turkey.hidden = true; Turkey.hideSpot = s;
        Turkey.x = s.x + s.w / 2 - Turkey.w / 2;
        return true;
      }
    }
    return false;
  },

  /* Draw the turkey. flash: draw ghosted while invulnerable. */
  draw(ctx) {
    const t = Turkey;
    ctx.save();
    if (t.invuln > 0 && Math.floor(t.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    if (t.hidden) ctx.globalAlpha = 0.45;
    const cx = t.x + t.w / 2;
    const feetY = t.y + t.h;
    const bob = t.onGround && Math.abs(t.vx) > 10 ? Math.sin(t.walkT * 16) * 2 : 0;
    const by = t.y + 4 + bob * 0.3;

    /* Tail fan. */
    const fanCols = ['#c85a17', '#e8830c', '#a34d12', '#f2a541', '#c85a17'];
    for (let i = 0; i < 5; i++) {
      const a = (-0.9 + i * 0.45) * t.face;
      ctx.save();
      ctx.translate(cx - t.face * 14, by + 18);
      ctx.rotate(a * 0.7);
      ctx.fillStyle = fanCols[i];
      ctx.beginPath();
      ctx.ellipse(-t.face * 16, -8, 15, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a3c0d';
      ctx.beginPath();
      ctx.ellipse(-t.face * 24, -10, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    /* Body. */
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(cx, by + 20, 21, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a06a35';
    ctx.beginPath();
    ctx.ellipse(cx, by + 16, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Wing. */
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.ellipse(cx - t.face * 4, by + 20, 12, 8, -0.3 * t.face, 0, Math.PI * 2);
    ctx.fill();
    /* Head + beak + wattle. */
    const hx = cx + t.face * 16;
    ctx.fillStyle = '#c65a3a';
    ctx.beginPath();
    ctx.arc(hx, by + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.moveTo(hx + t.face * 7, by);
    ctx.lineTo(hx + t.face * 17, by + 3);
    ctx.lineTo(hx + t.face * 7, by + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d93a2b';
    ctx.beginPath();
    ctx.ellipse(hx + t.face * 4, by + 10, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c0f05';
    ctx.beginPath();
    ctx.arc(hx + t.face * 3, by - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    /* Legs. */
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 3;
    const step = t.onGround && Math.abs(t.vx) > 10 ? Math.sin(t.walkT * 16) * 5 : 0;
    ctx.beginPath();
    ctx.moveTo(cx - 7, by + 34); ctx.lineTo(cx - 7 + step, feetY);
    ctx.moveTo(cx + 7, by + 34); ctx.lineTo(cx + 7 - step, feetY);
    ctx.stroke();
    ctx.restore();
  }
};
