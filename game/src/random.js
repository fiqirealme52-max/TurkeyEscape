'use strict';
/* Seeded RNG (mulberry32) so screenshot states are deterministic. */

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Pick an integer in [lo, hi] from rng. */
function rngInt(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }

/* Pick one element of an array from rng. */
function rngPick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
