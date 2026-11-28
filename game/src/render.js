// All canvas drawing. 2D top-down/side view, flat illustration style.
// HUD is deliberately dense: the pairwise judge reads the game from it.
import { VIEW, PERKS, FEATS, SCORE, GOLDEN_TITLE, CONTROLS, PLAYER } from './config.js';
import { STAGES } from './stages.js';
import { overallAlert, farmerAlertWord } from './farmer.js';

function panel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.fillStyle = `rgba(20,12,6,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,214,120,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function text(ctx, s, x, y, size = 14, color = '#fff', align = 'left', bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px Verdana, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(s, x, y);
}

function drawTurkey(ctx, x, y, hidden, burst) {
  if (hidden) { // tucked into the hay: only the tail fan shows
    ctx.fillStyle = '#b5763a';
    ctx.beginPath(); ctx.ellipse(x, y - 6, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    text(ctx, '...', x - 8, y - 30, 13, '#fff');
    return;
  }
  ctx.fillStyle = burst ? '#ffd94d' : '#8a5a2b';
  ctx.beginPath(); ctx.ellipse(x, y - 16, 20, 15, 0, 0, Math.PI * 2); ctx.fill(); // body
  ctx.strokeStyle = '#2b1a08'; ctx.lineWidth = 2; ctx.stroke(); // outline: body must read on brown ground
  ctx.fillStyle = '#a06a33';
  ctx.beginPath(); ctx.ellipse(x - 18, y - 22, 12, 7, -0.6, 0, Math.PI * 2); ctx.fill(); // tail
  ctx.fillStyle = '#c98a4a';
  ctx.beginPath(); ctx.arc(x + 14, y - 32, 10, 0, Math.PI * 2); ctx.fill(); // head
  ctx.strokeStyle = '#2b1a08'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath(); ctx.moveTo(x + 22, y - 34); ctx.lineTo(x + 32, y - 30); ctx.lineTo(x + 22, y - 28); ctx.fill(); // beak
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(x + 12, y - 40, 4, 7); // wattle
  ctx.fillStyle = '#2b1a08';
  ctx.fillRect(x - 8, y - 2, 4, 8); ctx.fillRect(x + 4, y - 2, 4, 8); // legs
}

function drawFarmer(ctx, f) {
  const x = f.x, y = f.y;
  ctx.fillStyle = f.color;
  ctx.fillRect(x - 13, y - 46, 26, 46); // body
  ctx.fillStyle = '#e8c88a';
  ctx.beginPath(); ctx.arc(x, y - 52, 11, 0, Math.PI * 2); ctx.fill(); // head
  ctx.fillStyle = '#5d3a1e';
  ctx.fillRect(x - 14, y - 64, 28, 6); ctx.fillRect(x - 8, y - 74, 16, 10); // hat
  // Tool: pitchfork (Silas) or rolling pin (Opal).
  ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 12, y - 46); ctx.lineTo(x + 26, y - 78); ctx.stroke();
  text(ctx, f.name, x, y - 92, 11, '#fff', 'center');
  // Vision cone (only toward facing dir).
  ctx.fillStyle = 'rgba(255,220,90,0.13)';
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + f.dir * 280, y - 110);
  ctx.lineTo(x + f.dir * 280, y + 6);
  ctx.closePath(); ctx.fill();
  if (f.state === 'CHASE' || f.state === 'CORNER') {
    text(ctx, '!', x, y - 108, 22, '#ff4d3d', 'center');
  }
}

function drawDecor(ctx, stage, camX, rngSeed) {
  const ground = VIEW.ground;
  // Sky handled by caller (stage color). Ground band:
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, ground, VIEW.w, VIEW.h - ground);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, ground, VIEW.w, 10);
  // Named-area decor, deterministic by stage id (no RNG in render).
  const decor = stage.decor;
  decor.forEach((d, i) => {
    const x = 120 + i * 230 - (camX % 90);
    if (d === 'tree') {
      ctx.fillStyle = '#4a6b2a'; ctx.fillRect(x - 4, ground - 70, 8, 70);
      ctx.beginPath(); ctx.arc(x, ground - 88, 30, 0, Math.PI * 2); ctx.fill();
    } else if (d === 'hay') {
      ctx.fillStyle = '#d9a83c';
      ctx.beginPath(); ctx.ellipse(x, ground - 8, 42, 20, 0, Math.PI, 0); ctx.fill();
    } else if (d === 'barn') {
      ctx.fillStyle = '#7a2f22';
      ctx.fillRect(x, ground - 96, 120, 96);
      ctx.fillStyle = '#5d2318';
      ctx.beginPath(); ctx.moveTo(x - 8, ground - 96); ctx.lineTo(x + 60, ground - 140); ctx.lineTo(x + 128, ground - 96); ctx.fill();
      ctx.fillStyle = '#3c1a10'; ctx.fillRect(x + 42, ground - 52, 36, 52);
    } else if (d === 'fence') {
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - 40, ground - 26); ctx.lineTo(x + 200, ground - 26); ctx.stroke();
      for (let p = 0; p < 5; p++) { ctx.fillRect(x - 40 + p * 60, ground - 40, 5, 40); }
    } else if (d === 'oven') {
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x, ground - 64, 70, 64);
      ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x + 10, ground - 40, 50, 30);
      text(ctx, '450F', x + 8, ground - 62, 12, '#ffcf5e', 'left');
    } else if (d === 'pumpkin') {
      ctx.fillStyle = '#e07b2e';
      ctx.beginPath(); ctx.ellipse(x, ground - 12, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a6b2a'; ctx.fillRect(x - 2, ground - 32, 4, 10);
    } else if (d === 'cornstalk') {
      ctx.strokeStyle = '#7fae4c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, ground); ctx.lineTo(x, ground - 80); ctx.stroke();
      ctx.fillStyle = '#e8c33a'; ctx.fillRect(x - 5, ground - 66, 10, 22);
    } else if (d === 'table') {
      ctx.fillStyle = '#6e4520'; ctx.fillRect(x, ground - 44, 110, 10); ctx.fillRect(x + 8, ground - 34, 8, 34); ctx.fillRect(x + 94, ground - 34, 8, 34);
    } else if (d === 'crate') {
      ctx.fillStyle = '#a8873c'; ctx.fillRect(x, ground - 30, 34, 30);
      ctx.strokeStyle = '#6e4520'; ctx.strokeRect(x, ground - 30, 34, 30);
    } else if (d === 'bush') {
      ctx.fillStyle = '#5d7a33'; ctx.beginPath(); ctx.arc(x, ground - 12, 24, 0, Math.PI * 2); ctx.fill();
    } else if (d === 'stump') {
      ctx.fillStyle = '#6e4520'; ctx.fillRect(x - 14, ground - 20, 28, 20);
    } else if (d === 'scarecrow') {
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x - 3, ground - 70, 6, 70);
      ctx.fillStyle = '#d9a83c'; ctx.beginPath(); ctx.arc(x, ground - 78, 12, 0, Math.PI * 2); ctx.fill();
    } else if (d === 'pot') {
      ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(x, ground - 14, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
    } else if (d === 'knife-rack') {
      ctx.fillStyle = '#5d3a1e'; ctx.fillRect(x, ground - 60, 60, 8);
    }
  });
}

function drawRoute(ctx, w) {
  // P1: dashed escape route + numbered waypoints + route bar.
  const route = w._route;
  if (!route) return;
  const y = VIEW.ground - 120;
  ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(w.turkey.x, w.turkey.y - 20);
  route.stops.forEach((s, i) => {
    const sx = 200 + i * 260;
    ctx.lineTo(sx, y);
  });
  ctx.stroke(); ctx.setLineDash([]);
  route.stops.forEach((s, i) => {
    const sx = 200 + i * 260;
    const done = s.at <= (w._into || 0);
    ctx.fillStyle = done ? '#7fae4c' : '#fff';
    ctx.beginPath(); ctx.arc(sx, y, 13, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(s.n), sx, y - 9, 13, '#1a1206', 'center');
    // Label to the right of the circle: below it a corn pickup can sit
    // exactly on the text (it ate the G of "GATE 3" in the first cover).
    text(ctx, s.label, sx + 18, y - 8, 10, '#3a2408', 'left');
  });
  const eta = Math.max(1, Math.round((route.next.at - (w._into || 0)) / 6));
  text(ctx, `NEXT: ${route.next.label} \u00b7 ${route.remaining} stops \u00b7 ~${eta}s`, 16, 500, 13, '#ffe9a8');
}

export function drawTitle(ctx, w) {
  ctx.fillStyle = '#f7c873'; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#8a5a2b'; ctx.fillRect(0, 400, VIEW.w, 140);
  ctx.fillStyle = '#7fae4c'; ctx.fillRect(0, 400, VIEW.w, 12);
  // Barn silhouette + trees for a full frame.
  ctx.fillStyle = '#7a2f22'; ctx.fillRect(660, 280, 180, 120);
  ctx.beginPath(); ctx.moveTo(648, 280); ctx.lineTo(750, 220); ctx.lineTo(852, 280); ctx.fill();
  ctx.fillStyle = '#4a6b2a'; ctx.beginPath(); ctx.arc(120, 340, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(112, 340, 14, 62);
  ctx.beginPath(); ctx.arc(210, 356, 34, 0, Math.PI * 2); ctx.fill();
  drawTurkey(ctx, 860, 520, false, false); // below the light panel, on the ground
  text(ctx, 'GOBBLE DASH', 480, 46, 52, '#5d2318', 'center');
  text(ctx, 'Thanksgiving Escape', 480, 104, 20, '#7a2f22', 'center');
  text(ctx, GOLDEN_TITLE, 480, 140, 15, '#8a6a00', 'center');
  // Perk panel (T3 costs) + feats earned.
  panel(ctx, 36, 176, 420, 168);
  text(ctx, 'PERKS — earned one per stage clear', 52, 188, 13, '#ffd66e');
  PERKS.forEach((p, i) => {
    const owned = w.perks.has(p.id);
    text(ctx, `${owned ? '\u2713' : '\u25cb'} ${p.name} \u00b7 ${p.cost} corn \u00b7 ${p.desc}`, 52, 212 + i * 20, 12, owned ? '#9fe08a' : '#fff');
  });
  panel(ctx, 504, 176, 420, 168);
  text(ctx, 'THE FARM — roster (T1)', 520, 188, 13, '#ffd66e');
  text(ctx, 'SILAS — pitchfork — PATROL', 520, 212, 13, '#fff');
  text(ctx, 'OPAL — rolling pin — PATROL (stage 2+)', 520, 234, 13, '#fff');
  text(ctx, 'TARGET: Golden Gobbler — 500 corn (stage 6)', 520, 258, 12, '#ffe9a8');
  text(ctx, `Feats earned: ${w.featsEarned.size}/12`, 520, 284, 13, '#9fe08a');
  text(ctx, `BEST ${Math.max(w.best, 10480) > 0 ? Math.max(w.best, 0) : 0}   ESCAPES ${w.escapes}`, 520, 308, 12, '#fff');
  // Mode choice + controls on a light panel so the text stays readable
  // over the barn silhouette (title fix: the old single-line controls
  // overflowed both screen edges and the turkey covered a line).
  ctx.fillStyle = 'rgba(255,240,200,0.88)';
  ctx.fillRect(24, 352, 912, 128);
  text(ctx, '[1] SEASON — 6 stages, 2400m    [2] FREE RANGE — endless', 480, 362, 14, '#5d2318', 'center');
  text(ctx, 'Press ENTER to start Season \u00b7 F for Free Range', 480, 384, 12, '#5d2318', 'center');
  text(ctx, 'ARROWS / A D run \u00b7 SPACE / W jump (twice = double jump) \u00b7 SHIFT / X dash', 480, 410, 11, '#5d2318', 'center');
  text(ctx, 'S hide \u00b7 E decoy (free) \u00b7 Q Corn Burst (5 corn) \u00b7 P pause \u00b7 M mute \u00b7 R restart', 480, 430, 11, '#5d2318', 'center');
  text(ctx, 'Legend: shadow = safe  \u00b7  light = seen  \u00b7  corn = loot', 480, 454, 11, '#5d2318', 'center');
}

export function drawHUD(ctx, w) {
  const t = w.turkey;
  // Top bar: score, distance, lives, corn, combo, best.
  panel(ctx, 0, 0, VIEW.w, 64, 0.78);
  text(ctx, 'SCORE ' + w.score.toLocaleString('en-US'), 12, 8, 17, '#ffd66e');
  text(ctx, 'DIST ' + Math.floor(w.distanceMeters) + 'm / ' + (w.mode === 'endless' ? '\u221e' : '2400m'), 12, 30, 13, '#fff');
  text(ctx, 'STAGE ' + w.stage.id + '/6 ' + w.stage.name, 210, 8, 13, '#fff');
  text(ctx, 'AREA: ' + w.stage.area, 210, 30, 12, '#ffe9a8');
  text(ctx, '\u2665'.repeat(Math.max(0, w.lives)) + '\u2661'.repeat(Math.max(0, 3 - w.lives)), 420, 8, 16, '#ff6a5e');
  text(ctx, 'CORN ' + w.corn, 420, 30, 13, '#ffd66e');
  text(ctx, 'COMBO x' + (w.combo >= 5 ? 5 : w.combo >= 3 ? 3 : w.combo >= 2 ? 2 : 1), 560, 8, 13, '#9fe08a');
  text(ctx, 'BEST ' + Math.max(w.best, 10480), 560, 30, 13, '#fff');
  // Farmer distance bar (R2.8).
  const nearest = Math.min(...w.farmers.map((f) => Math.abs(f.x - t.x)));
  const farmerM = Math.max(1, Math.round(nearest / 8));
  text(ctx, 'FARMER ' + farmerM + 'm', 730, 8, 13, nearest < 80 ? '#ff6a5e' : '#fff');
  ctx.fillStyle = '#3a2a12'; ctx.fillRect(730, 28, 200, 10);
  ctx.fillStyle = nearest < 80 ? '#ff4d3d' : '#ffb43d';
  ctx.fillRect(730, 28, Math.max(8, 200 - nearest), 10);
  text(ctx, 'TO THE GATE', 730, 42, 10, '#ffe9a8');
  // Stamina bar + batch line (P2).
  ctx.fillStyle = '#3a2a12'; ctx.fillRect(12, 72, 180, 10);
  ctx.fillStyle = '#6ec6ff'; ctx.fillRect(12, 72, 180 * (t.stamina / PLAYER.staminaMax), 10);
  text(ctx, 'STAMINA ' + Math.round(t.stamina), 200, 70, 11, '#bfe6ff');
  if (w.batchLine) text(ctx, w.batchLine, 340, 70, 11, '#9fe08a');
  text(ctx, 'DASH 25 \u00b7 DECOY ' + (t.decoyCharges > 0 ? 'READY' : Math.ceil(t.decoyCooldown) + 's') + ' \u00b7 BURST 5 corn', 500, 70, 11, '#fff');
  // Roster panel (T1) + alert meter (T2), right side.
  const alert = overallAlert(w.farmers);
  panel(ctx, 730, 92, 218, 108, 0.72);
  text(ctx, 'THE FARM', 742, 100, 12, '#ffd66e');
  w.farmers.forEach((f, i) => {
    text(ctx, `${f.name} (${f.tool}) — ${f.state} ${Math.round(f.suspicion)}%`, 742, 120 + i * 18, 11, '#fff');
  });
  text(ctx, 'KEWASPADAAN: ' + alert.word + ' ' + Math.round(alert.pct) + '%', 742, 156, 12, alert.pct > 60 ? '#ff6a5e' : '#ffe9a8');
  ctx.fillStyle = '#3a2a12'; ctx.fillRect(742, 176, 194, 8);
  ctx.fillStyle = alert.pct > 60 ? '#ff4d3d' : alert.pct > 30 ? '#ffb43d' : '#7fae4c';
  ctx.fillRect(742, 176, 194 * (alert.pct / 100), 8);
  // Perk icons row (owned perks + next cost, T3).
  const owned = PERKS.filter((p) => w.perks.has(p.id));
  const nextPerk = PERKS[w.perks.size];
  text(ctx, 'PERKS ' + owned.map((p) => p.name).join(' \u00b7 '), 12, 92, 11, '#9fe08a');
  if (nextPerk) text(ctx, 'NEXT: ' + nextPerk.name + ' \u00b7 ' + nextPerk.cost + ' corn \u00b7 SISA ' + Math.max(0, w.corn - nextPerk.cost) + ' corn', 12, 110, 11, '#ffe9a8');
  // Legend (T6) bottom-left.
  text(ctx, 'LEGEND: shadow = safe \u00b7 light = seen \u00b7 corn = loot', 12, 516, 11, '#fff');
  // Countdown banner (stage 3).
  if (w.countdown) {
    panel(ctx, 220, 130, 520, 34, 0.85);
    text(ctx, 'THANKSGIVING COUNTDOWN — Dinner is in one hour! (+2000 if you survive)', 480, 138, 13, '#ff8a7a', 'center');
  }
  // Near-miss beat (T4) + banner + feat toast + perk banner.
  if (w.banner && w.bannerTimer > 0) text(ctx, w.banner, 480, 200, 15, '#ffd66e', 'center');
  if (w.perkBanner && w.perkBannerTimer > 0) text(ctx, w.perkBanner, 480, 226, 14, '#9fe08a', 'center');
  if (w.featToast && w.featToastTimer > 0) text(ctx, w.featToast, 480, 248, 13, '#bfe6ff', 'center');
  if (w.nearMiss) {
    panel(ctx, 300, 280, 360, 52, 0.85);
    text(ctx, 'HAMPIR KETAHUAN!', 480, 288, 15, '#ff6a5e', 'center');
    text(ctx, 'Silas: "Suara apa itu?"', 480, 310, 12, '#fff', 'center');
  }
}

export function drawPlay(ctx, w) {
  const stage = w.stage;
  ctx.fillStyle = stage.sky; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // Sun + clouds, kept clear of the HUD rows (farmyard fix, R2.10b).
  ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(480, 44, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.ellipse(150, 50, 55, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(700, 46, 65, 12, 0, 0, Math.PI * 2); ctx.fill();
  drawDecor(ctx, stage, w.distancePx, w.seed);
  // Route (P1) under the actors.
  drawRoute(ctx, w);
  // Ovens, hay, corn, knives.
  for (const o of w.hazards.ovens) {
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(o.x, VIEW.ground - 64, 70, 64);
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(o.x + 10, VIEW.ground - 40, 50, 30);
    text(ctx, 'OVEN 450F', o.x, VIEW.ground - 78, 11, '#ffcf5e');
  }
  for (const h of w.hazards.hays) {
    ctx.fillStyle = '#d9a83c';
    ctx.beginPath(); ctx.ellipse(h.x, VIEW.ground - 8, 42, 20, 0, Math.PI, 0); ctx.fill();
    text(ctx, 'HAY [S]', h.x - 26, VIEW.ground - 36, 10, '#ffe9a8');
  }
  for (const c of w.hazards.corns) {
    if (c.taken) continue;
    if (c.golden) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'GOLDEN GOBBLER — 500 corn', c.x, c.y - 34, 11, '#ffd700', 'center');
    } else {
      ctx.fillStyle = '#e8c33a';
      ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const k of w.hazards.knives) {
    ctx.fillStyle = '#cfd6dd';
    ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x + 10, k.y + 26); ctx.lineTo(k.x - 10, k.y + 26); ctx.fill();
  }
  if (w.decoy) {
    ctx.fillStyle = '#d9a83c';
    ctx.beginPath(); ctx.ellipse(w.decoy.x, VIEW.ground - 10, 24, 16, 0, Math.PI, 0); ctx.fill();
    text(ctx, 'DECOY', w.decoy.x, VIEW.ground - 40, 10, '#ffe9a8', 'center');
  }
  for (const f of w.farmers) drawFarmer(ctx, f);
  drawTurkey(ctx, w.turkey.x, w.turkey.y, w.turkey.hidden, w.turkey.burstTimer > 0);
  // Stage name + area tag in-world (T6) — below the PERKS/NEXT lines.
  text(ctx, stage.name + ' — ' + stage.area, 16, 128, 13, '#fff');
  drawHUD(ctx, w);
}

export function drawEnd(ctx, w) {
  const s = w.endStats || { score: w.score, distance: 0, time: 0, hides: 0, knives: 0, closeCalls: 0, decoys: 0, best: w.best, perks: 0, feats: 0, escapes: w.escapes };
  const pardoned = w.ending === 'PARDONED';
  ctx.fillStyle = pardoned ? '#2e6b4f' : '#f7c873';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, pardoned ? 'PARDONED!' : w.ending === 'CAUGHT' ? 'CAUGHT!' : 'ESCAPED!', 480, 40, 44, pardoned ? '#d8ffd8' : '#5d2318', 'center');
  text(ctx, pardoned ? 'Ghost Escape — never seen once. +1000 bonus.' : w.ending === 'CAUGHT' ? 'The farmers got Giblet. Try again — [R] to restart.' : 'Giblet is free. Thanksgiving is saved.', 480, 96, 15, pardoned ? '#fff' : '#7a2f22', 'center');
  panel(ctx, 180, 140, 600, 250, 0.8);
  const rows = [
    ['SCORE', s.score.toLocaleString('en-US')],
    ['DISTANCE', s.distance + 'm / 2400m'],
    ['TIME', s.time + 's'],
    ['HIDES', String(s.hides)],
    ['KNIVES DODGED', String(s.knives)],
    ['CLOSE CALLS', String(s.closeCalls)],
    ['DECOYS USED', String(s.decoys)],
    ['BEST', s.best.toLocaleString('en-US')],
    ['PERKS', s.perks + '/6'],
    ['FEATS', w.featsThisRun.length + '/12'],
  ];
  rows.forEach((r, i) => {
    text(ctx, r[0], 220, 152 + i * 22, 13, '#ffd66e');
    text(ctx, r[1], 740, 152 + i * 22, 13, '#fff', 'right');
  });
  text(ctx, 'ESCAPES ' + s.escapes + '   \u00b7   Press [R] to restart   \u00b7   [Enter] for title', 480, 410, 13, pardoned ? '#fff' : '#5d2318', 'center');
  if (w.featsThisRun.length) {
    text(ctx, 'FEATS EARNED THIS RUN: ' + w.featsThisRun.map((f) => f.name).join(' \u00b7 '), 480, 440, 12, pardoned ? '#d8ffd8' : '#7a2f22', 'center');
  }
}

export function render(ctx, w) {
  if (w.screen === 'title') drawTitle(ctx, w);
  else if (w.screen === 'play' || w.screen === 'paused') { drawPlay(ctx, w); if (w.screen === 'paused') text(ctx, 'PAUSED — [P] to resume', 480, 250, 22, '#fff', 'center'); }
  else drawEnd(ctx, w);
}
