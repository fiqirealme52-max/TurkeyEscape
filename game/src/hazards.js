// Hazards & pickups — ovens (450F), falling carving knives, corn,
// hay bales (hide spots), the Golden Gobbler target (stage 6).
// All placement comes from the seeded RNG, never Math.random().
import { VIEW } from './config.js';
import { PX_PER_METER } from './stages.js';
import { range } from './random.js';

export function createHazards(rng, stage) {
  const ovens = [];
  for (let i = 0; i < stage.hazards.oven; i++) {
    ovens.push({ x: 300 + i * 260 + range(rng, 0, 80), w: 90, temp: 450 });
  }
  const knives = [];
  const hays = [];
  for (let i = 0; i < 3; i++) {
    hays.push({ x: 180 + i * 300 + range(rng, 0, 60), w: 70 });
  }
  const corns = [];
  for (let i = 0; i < 14; i++) {
    corns.push({
      x: 120 + i * 62 + range(rng, 0, 30),
      y: VIEW.ground - 26 - (rng() < 0.3 ? 70 : 0),
      taken: false, golden: false,
    });
  }
  if (stage.golden) {
    corns.push({ x: 880, y: VIEW.ground - 30, taken: false, golden: true });
  }
  return { ovens, knives, hays, corns, knifeTimer: 1.2, knifeRate: stage.hazards.knifeRate };
}

export function updateHazards(hz, rng, world, dt) {
  // Falling knives: spawn above the turkey's lane at the stage rate.
  hz.knifeTimer -= dt;
  if (hz.knifeTimer <= 0) {
    hz.knifeTimer = range(rng, 0.9, 1.6) / Math.max(0.5, hz.knifeRate);
    hz.knives.push({
      x: world.turkey.x + range(rng, -40, 320),
      y: -20, vy: 340 + range(rng, 0, 120), dodged: false,
    });
  }
  for (const k of hz.knives) k.y += k.vy * dt;
  hz.knives = hz.knives.filter((k) => {
    if (k.y > VIEW.ground + 10) {
      if (!k.dodged && Math.abs(k.x - world.turkey.x) > 26) {
        k.dodged = true;
        world.onKnifeDodged(k);
      }
      return false;
    }
    return true;
  });
  // Knife hit: only when it lands on Giblet and he is not invulnerable.
  for (const k of hz.knives) {
    if (Math.abs(k.x - world.turkey.x) < 24 && Math.abs(k.y - world.turkey.y) < 44) {
      if (world.turkey.invulnTimer <= 0 && !world.turkey.hidden) {
        world.onKnifeHit(k);
        k.y = VIEW.ground + 20; // consumed
      }
    }
  }
  // Oven burn: standing in an oven zone hurts and shoves Giblet out.
  for (const o of hz.ovens) {
    if (world.turkey.x > o.x && world.turkey.x < o.x + o.w &&
        world.turkey.y > VIEW.ground - 50 && world.turkey.invulnTimer <= 0) {
      world.onOvenBurn(o);
    }
  }
  // Corn pickup (magnet perk pulls corn in from farther away).
  const magnet = world.perks.has('hay-magnet');
  for (const c of hz.corns) {
    if (c.taken) continue;
    const dx = c.x - world.turkey.x;
    const dy = c.y - world.turkey.y;
    const reach = magnet ? 110 : 34;
    if (Math.abs(dx) < reach && Math.abs(dy) < 60) {
      c.taken = true;
      world.onCorn(c);
    }
  }
}

// A knife counts as dodged only when it lands away from Giblet —
// standing under one and getting hit is not a dodge.
export function nearHay(hz, x) {
  return hz.hays.some((h) => Math.abs(x - h.x) < h.w);
}

export function nextWaypoint(hz, stage, intoMeters) {
  // Route waypoints for the stage: corn pile, hay bale, gate (P1).
  const stops = [
    { n: 1, label: 'CORN PILE', at: 120 },
    { n: 2, label: 'HAY BALE', at: 240 },
    { n: 3, label: 'GATE ' + stage.id, at: 390 },
  ];
  const next = stops.find((s) => s.at > intoMeters) || stops[stops.length - 1];
  const remaining = stops.filter((s) => s.at > intoMeters).length;
  return { next, remaining, stops };
}

export function pxForMeter(m) { return m * PX_PER_METER; }
