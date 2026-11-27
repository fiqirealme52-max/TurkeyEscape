'use strict';
/* The three stages: farmyard -> barn -> kitchen. Each one names its
   platforms, hide spots, corn, hazards and the escape gate. */

const STAGE_DEFS = [
  {
    name: 'FARMYARD', sub: 'Stage 1 of 3 - slip past the farmer',
    sky: ['#ffd98a', '#ff9e57'], ground: '#a06a2e', groundTop: '#c98d3f',
    farmerSpeed: 1.0, knifeRate: 2.6, pinRate: 0, oven: null,
    gateX: 884, patrol: [420, 780],
    platforms: [{ x: 210, y: 392, w: 120, h: 16 }, { x: 560, y: 352, w: 110, h: 16 }],
    hides: [{ x: 150, y: 402, w: 62, h: 68, kind: 'bush' }],
    corn: [[260, 360], [620, 320], [330, 440], [760, 440], [880, 400]],
    decor: 'farm'
  },
  {
    name: 'BARN', sub: 'Stage 2 of 3 - hide in the hay, he runs now',
    sky: ['#8a5a2b', '#5c3a1a'], ground: '#8a5a2b', groundTop: '#a97a3a',
    farmerSpeed: 1.25, knifeRate: 2.1, pinRate: 4.2, oven: null,
    gateX: 884, patrol: [360, 820],
    platforms: [{ x: 180, y: 386, w: 130, h: 16 }, { x: 470, y: 342, w: 120, h: 16 }, { x: 700, y: 392, w: 110, h: 16 }],
    hides: [{ x: 120, y: 396, w: 74, h: 74, kind: 'hay' }, { x: 640, y: 396, w: 74, h: 74, kind: 'hay' }],
    corn: [[240, 354], [530, 310], [760, 360], [420, 440], [850, 440]],
    decor: 'barn'
  },
  {
    name: 'KITCHEN', sub: 'Stage 3 of 3 - the oven is lit, run for the door!',
    sky: ['#ffe9b8', '#ffb36b'], ground: '#b98a52', groundTop: '#d9a860',
    farmerSpeed: 1.5, knifeRate: 1.7, pinRate: 3.4, oven: { x: 600, w: 104 },
    gateX: 884, patrol: [300, 840],
    platforms: [{ x: 170, y: 388, w: 120, h: 16 }, { x: 420, y: 344, w: 110, h: 16 }],
    hides: [{ x: 90, y: 396, w: 84, h: 74, kind: 'table' }],
    corn: [[230, 356], [480, 312], [330, 440], [780, 440], [860, 380]],
    decor: 'kitchen'
  }
];

/* Draw the stage background: sky, decor, ground, gate, hide spots. */
const Stages = {
  draw(ctx, stageIdx, time, leaves) {
    const def = STAGE_DEFS[stageIdx];
    const W = CFG.W, H = CFG.H;

    const sky = ctx.createLinearGradient(0, 0, 0, CFG.FLOOR);
    sky.addColorStop(0, def.sky[0]);
    sky.addColorStop(1, def.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, CFG.FLOOR);

    if (def.decor === 'farm') {
      /* Sun, clouds, fence, pumpkins, falling leaves. */
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(830, 74, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const cx of [150, 420, 690]) {
        ctx.beginPath();
        ctx.ellipse(cx, 66, 46, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 26, 74, 34, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 428); ctx.lineTo(W, 428); ctx.stroke();
      ctx.lineWidth = 4;
      for (let x = 20; x < W; x += 90) {
        ctx.beginPath(); ctx.moveTo(x, 404); ctx.lineTo(x, 452); ctx.stroke();
      }
      for (const px of [120, 330, 700]) {
        ctx.fillStyle = '#e8830c';
        ctx.beginPath(); ctx.ellipse(px, 448, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3f7a34';
        ctx.fillRect(px - 2, 428, 4, 8);
      }
      ctx.fillStyle = CFG.PAL.leaf;
      for (const lf of leaves) {
        ctx.save();
        ctx.translate(lf.x, (lf.y + time * lf.v) % 470);
        ctx.rotate(time * lf.r);
        ctx.fillRect(-3, -2, 6, 4);
        ctx.restore();
      }
    } else if (def.decor === 'barn') {
      /* Timber beams, hanging lantern, hay bales, barn door glow. */
      ctx.fillStyle = '#4a2c12';
      ctx.fillRect(0, 0, W, 26);
      ctx.fillRect(0, 150, W, 14);
      for (let x = 60; x < W; x += 180) ctx.fillRect(x, 0, 18, CFG.FLOOR);
      ctx.fillStyle = '#ffb36b';
      ctx.beginPath(); ctx.ellipse(480, 120, 60, 46, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a220c';
      ctx.beginPath(); ctx.ellipse(480, 120, 46, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(480, 26); ctx.lineTo(480, 82); ctx.stroke();
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.arc(480, 96, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8b64c';
      for (const bx of [60, 860]) {
        ctx.beginPath(); ctx.ellipse(bx, 448, 34, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a34d12'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(bx, 448, 22, 12, 0, 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      /* Kitchen: tiled wall, window, hanging pans, checkered floor line. */
      ctx.fillStyle = '#f7ead0';
      ctx.fillRect(0, 0, W, 240);
      ctx.strokeStyle = 'rgba(180,140,90,0.5)'; ctx.lineWidth = 2;
      for (let y = 30; y < 240; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 240); ctx.stroke(); }
      ctx.fillStyle = '#bfe3f2';
      ctx.fillRect(90, 56, 150, 110);
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 6;
      ctx.strokeRect(90, 56, 150, 110);
      ctx.beginPath(); ctx.moveTo(165, 56); ctx.lineTo(165, 166); ctx.moveTo(90, 111); ctx.lineTo(240, 111); ctx.stroke();
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.arc(130, 90, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a8f96';
      for (const px of [420, 520]) {
        ctx.beginPath(); ctx.arc(px, 120, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5c6066';
        ctx.beginPath(); ctx.arc(px, 120, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a8f96';
      }
      ctx.fillStyle = '#d9a860';
      ctx.fillRect(0, 240, W, 12);
    }

    /* Platforms. */
    for (const p of def.platforms) {
      ctx.fillStyle = CFG.PAL.wood;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 5); ctx.fill();
      ctx.fillStyle = '#8a5f33';
      ctx.fillRect(p.x, p.y, p.w, 5);
    }

    /* Hide spots. */
    for (const s of def.hides) {
      if (s.kind === 'hay') {
        ctx.fillStyle = CFG.PAL.hay;
        ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a34d12'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2 - 10, s.h / 2 - 12, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (s.kind === 'table') {
        ctx.fillStyle = '#7a4a21';
        ctx.fillRect(s.x, s.y, s.w, 10);
        ctx.fillRect(s.x + 6, s.y + 10, 8, s.h - 10);
        ctx.fillRect(s.x + s.w - 14, s.y + 10, 8, s.h - 10);
        ctx.fillStyle = '#fff3d6';
        ctx.fillRect(s.x + 4, s.y, s.w - 8, 8);
      } else {
        ctx.fillStyle = '#3f7a34';
        ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2e5c26';
        ctx.beginPath(); ctx.ellipse(s.x + s.w / 2 - 10, s.y + s.h / 2, s.w / 4, s.h / 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(43,26,8,0.85)';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE  [S]', s.x + s.w / 2, s.y + s.h + 14);
    }

    /* Escape gate / door on the right. */
    const gx = def.gateX;
    ctx.fillStyle = stageIdx === 2 ? '#3f7a34' : '#6b4423';
    ctx.beginPath(); ctx.roundRect(gx, CFG.FLOOR - 128, 56, 128, 8); ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath(); ctx.arc(gx + 28, CFG.FLOOR - 96, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(stageIdx === 2 ? 'FREE!' : 'GATE', gx + 28, CFG.FLOOR - 60);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.moveTo(gx + 28, CFG.FLOOR - 46);
    ctx.lineTo(gx + 40, CFG.FLOOR - 30);
    ctx.lineTo(gx + 16, CFG.FLOOR - 30);
    ctx.closePath();
    ctx.fill();

    /* Ground. */
    ctx.fillStyle = def.ground;
    ctx.fillRect(0, CFG.FLOOR, W, H - CFG.FLOOR);
    ctx.fillStyle = def.groundTop;
    ctx.fillRect(0, CFG.FLOOR, W, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 30; x < W; x += 110) ctx.fillRect(x, CFG.FLOOR + 26, 46, 5);
  }
};
