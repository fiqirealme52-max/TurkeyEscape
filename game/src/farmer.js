// Farmer AI — 5 states: patrol / spot / chase / search / corner.
// Vision cone 280px. Two farmers in R3: SILAS (pitchfork, stage 1+)
// and OPAL (rolling pin, stage 2-4). Names are original — never Gus,
// Mabel, Jed or Bram (those belong to rival entries).
import { VIEW } from './config.js';

export const STATES = ['PATROL', 'SPOT', 'CHASE', 'SEARCH', 'CORNER'];

// A farmer that is fooled by a decoy chases the decoy, not Giblet —
// that is what makes Decoy Master a real feat instead of a timer.
export function createFarmer(def, x, patrolMin, patrolMax) {
  return {
    id: def.id, name: def.name, tool: def.tool, color: def.color,
    x, y: VIEW.ground, w: 36, h: 52,
    state: 'PATROL', stateTimer: 0,
    dir: 1, patrolMin, patrolMax,
    patrolSpeed: 70, chaseSpeed: 265,
    vision: 280,
    suspicion: 0, // 0-100, shown in the roster (T1)
    searchTimer: 0,
    decoyTarget: null,
    spotFlash: false,
  };
}

export function farmerAlertWord(f) {
  if (f.state === 'CHASE' || f.state === 'CORNER') return 'TERKUNCI';
  if (f.state === 'SEARCH') return 'MENCARI';
  if (f.state === 'SPOT' || f.suspicion > 40) return 'WASPADA';
  return 'TENANG';
}

// Highest alert across farmers, for the T2 meter.
export function overallAlert(farmers) {
  let worst = 'TENANG', pct = 0;
  for (const f of farmers) {
    const w = farmerAlertWord(f);
    const p = f.state === 'CHASE' || f.state === 'CORNER' ? 95
      : f.state === 'SEARCH' ? 65
      : f.state === 'SPOT' ? 45 : Math.max(8, f.suspicion);
    if (p > pct) { pct = p; worst = w; }
  }
  return { word: worst, pct };
}

export function updateFarmer(f, turkey, world, dt) {
  const dx = turkey.x - f.x;
  const dist = Math.abs(dx);
  const seen = !turkey.hidden && turkey.onGround !== false &&
    dist < f.vision && Math.sign(dx) === f.dir && turkey.invulnTimer <= 0;
  const speedMult = (world.countdown ? 1.25 : 1) *
    (world.stage && world.stage.farmerMult ? world.stage.farmerMult : 1) *
    (world.endlessLoop > 0 ? Math.pow(1.1, world.endlessLoop) : 1) *
    (world.perks.has('butter-grease') ? 0.85 : 1);

  f.stateTimer += dt;
  switch (f.state) {
    case 'PATROL': {
      f.x += f.dir * f.patrolSpeed * speedMult * dt;
      if (f.x < f.patrolMin) { f.x = f.patrolMin; f.dir = 1; }
      if (f.x > f.patrolMax) { f.x = f.patrolMax; f.dir = -1; }
      f.suspicion = Math.max(0, f.suspicion - 12 * dt);
      if (seen) { f.state = 'SPOT'; f.stateTimer = 0; f.spotFlash = true; world.onSpotted(f); }
      if (f.decoyTarget) { f.state = 'CHASE'; f.stateTimer = 0; }
      break;
    }
    case 'SPOT': {
      f.suspicion = Math.min(100, f.suspicion + 90 * dt);
      if (f.stateTimer > 0.45) { f.state = 'CHASE'; f.stateTimer = 0; }
      if (!seen && f.stateTimer > 0.2) { f.state = 'SEARCH'; f.stateTimer = 0; }
      break;
    }
    case 'CHASE': {
      const targetX = f.decoyTarget ? f.decoyTarget.x : turkey.x;
      const tdx = targetX - f.x;
      f.dir = Math.sign(tdx) || 1;
      f.x += f.dir * f.chaseSpeed * speedMult * dt;
      f.suspicion = 95;
      if (f.decoyTarget) {
        if (Math.abs(tdx) < 26) {
          world.onDecoyFooled(f);
          f.decoyTarget = null;
          f.state = 'SEARCH'; f.stateTimer = 0; f.searchTimer = 2.5;
        }
        break;
      }
      if (dist < 30 && turkey.invulnTimer <= 0) {
        f.state = 'CORNER'; f.stateTimer = 0;
        world.onCaught(f);
        break;
      }
      if (!seen && dist > f.vision * 1.4) { f.state = 'SEARCH'; f.stateTimer = 0; f.searchTimer = 3; }
      break;
    }
    case 'SEARCH': {
      f.x += f.dir * f.patrolSpeed * 1.4 * speedMult * dt;
      if (f.x < f.patrolMin || f.x > f.patrolMax) f.dir *= -1;
      f.suspicion = Math.max(25, f.suspicion - 8 * dt);
      f.searchTimer -= dt;
      if (seen) { f.state = 'SPOT'; f.stateTimer = 0; world.onSpotted(f); }
      else if (f.searchTimer <= 0) { f.state = 'PATROL'; f.stateTimer = 0; }
      break;
    }
    case 'CORNER': {
      // Farmer has cornered Giblet; the world resolves the catch.
      if (f.stateTimer > 0.8) { f.state = 'SEARCH'; f.stateTimer = 0; f.searchTimer = 2; }
      break;
    }
  }
  return f;
}
