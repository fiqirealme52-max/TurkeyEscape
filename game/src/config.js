'use strict';
/* GOBBLE DASH - Thanksgiving Escape. Central tuning + palette. */

const CFG = {
  W: 960,
  H: 540,
  FLOOR: 470,
  GRAV: 2200,
  LIVES: 3,
  DASH_CD: 2.5,
  TURKEY: { w: 46, h: 42, run: 305, jump: 820, dash: 640 },
  FARMER: { w: 56, h: 84, patrol: 95, chase: 265, search: 150 },
  KNIFE: { warn: 0.55, fall: 640 },
  PIN: { speed: 210 },
  CORN_SCORE: 50,
  STAGE_BONUS: 500,
  PAL: {
    skyFarm: ['#ffd98a', '#ff9e57'],
    skyBarn: ['#8a5a2b', '#5c3a1a'],
    skyKitchen: ['#ffe9b8', '#ffb36b'],
    ground: '#7a4a21',
    groundTop: '#a06a2e',
    wood: '#6b4423',
    hay: '#e8b64c',
    leaf: '#d97b2b',
    cream: '#fff3d6',
    ink: '#2b1a08',
    red: '#d93a2b',
    green: '#3f7a34',
    gold: '#ffc93c'
  }
};

/* Clamp a number between lo and hi. */
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

/* Axis-aligned box overlap test. */
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
