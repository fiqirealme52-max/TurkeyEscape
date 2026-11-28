// Giblet the turkey — player physics. Side-view runner: run, double jump,
// dash (stamina), hide in hay, straw decoy, Corn Burst.
import { PLAYER, VIEW } from './config.js';
import { PX_PER_METER } from './stages.js';

export function createTurkey() {
  return {
    x: 160, y: VIEW.ground, vx: 0, vy: 0,
    w: 34, h: 40,
    facing: 1,
    onGround: true,
    jumpsLeft: 2,
    stamina: PLAYER.staminaMax,
    dashTimer: 0, dashCooldown: 0,
    burstTimer: 0, invulnTimer: 0,
    hidden: false, hideTimer: 0,
    decoyCooldown: 0, decoyCharges: 1,
    lives: PLAYER.lives,
    runTime: 0,
  };
}

export function turkeySpeed(t, perks) {
  let s = PLAYER.runSpeed;
  if (perks.has('corn-boots')) s *= 1.10;
  if (t.burstTimer > 0) s *= 1.8;
  return s;
}

export function updateTurkey(t, input, perks, dt, world) {
  const speed = turkeySpeed(t, perks);
  // Horizontal movement: arrows / A D. Turkey always drifts forward slowly
  // so distance accrues; holding right runs at full speed.
  let move = 0;
  if (input.left) move -= 1;
  if (input.right) move += 1;
  if (move === 0) move = 0.35; // slow forward drift — the escape never waits.
  // Holding left still moves forward slowly: Giblet never walks back to dinner.
  t.facing = move >= 0 ? 1 : -1;
  t.vx = move * speed;
  if (t.dashTimer > 0) {
    t.vx = t.facing * PLAYER.dashSpeed;
    t.dashTimer -= dt;
  }
  t.x += t.vx * dt;
  if (t.x < 40) t.x = 40;
  if (t.x > VIEW.w - 60) t.x = VIEW.w - 60;

  // Gravity + jump / double jump.
  t.vy += PLAYER.gravity * dt;
  t.y += t.vy * dt;
  if (t.y >= VIEW.ground) {
    if (!t.onGround && t.vy > 300) world.onLand(t);
    t.y = VIEW.ground; t.vy = 0; t.onGround = true; t.jumpsLeft = 2;
  } else {
    t.onGround = false;
  }

  // Stamina regen + corn bonus handled by world on pickup.
  t.stamina = Math.min(PLAYER.staminaMax, t.stamina + PLAYER.staminaRegen * dt);
  if (t.dashCooldown > 0) t.dashCooldown -= dt;
  if (t.decoyCooldown > 0) t.decoyCooldown -= dt;
  if (t.burstTimer > 0) t.burstTimer -= dt;
  if (t.invulnTimer > 0) t.invulnTimer -= dt;
  if (t.hidden) t.hideTimer -= dt;

  // Distance accrues from forward motion (px -> meters).
  const forward = Math.max(0, t.vx) * dt;
  world.distancePx += forward;
  world.distanceMeters = world.distancePx / PX_PER_METER;
  t.runTime += dt;
  return t;
}

export function tryJump(t, perks) {
  if (t.jumpsLeft <= 0) return false;
  const boost = perks.has('featherweight') ? 1.18 : 1.0;
  t.vy = PLAYER.jumpVel * boost;
  t.onGround = false;
  t.jumpsLeft -= 1;
  t.hidden = false;
  return true;
}

export function tryDash(t) {
  if (t.dashCooldown > 0 || t.stamina < PLAYER.dashCost || t.dashTimer > 0) return false;
  t.stamina -= PLAYER.dashCost;
  t.dashTimer = PLAYER.dashTime;
  t.dashCooldown = 0.45;
  return true;
}

export function tryCornBurst(t, world) {
  if (world.corn < PLAYER.cornBurstCost || t.burstTimer > 0) return false;
  world.corn -= PLAYER.cornBurstCost;
  t.burstTimer = PLAYER.cornBurstTime;
  t.invulnTimer = PLAYER.cornBurstTime;
  return true;
}

export function tryDecoy(t, world) {
  if (t.decoyCooldown > 0 || t.decoyCharges <= 0) return false;
  t.decoyCharges -= 1;
  t.decoyCooldown = PLAYER.decoyCooldown;
  world.spawnDecoy(t.x - 70, t.y);
  return true;
}

export function tryHide(t, nearHay) {
  if (!nearHay || t.hidden) return false;
  t.hidden = true;
  t.hideTimer = 3.0;
  t.vx = 0;
  return true;
}
