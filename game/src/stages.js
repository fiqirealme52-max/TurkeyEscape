// Six stages, 400m each, 2400m total — matching the deepest rival (oblag).
// Zones 5-6 reuse farm/kitchen palettes and decor variants, no new art.
import { VIEW } from './config.js';

export const STAGES = [
  {
    id: 1, name: 'FARMYARD', area: 'Kandang', meters: 400,
    sky: '#f7c873', ground: '#8a5a2b', grass: '#7fae4c',
    decor: ['tree', 'hay', 'barn', 'fence'],
    hazards: { oven: 0, knifeRate: 0.5 },
    blurb: 'The farmyard — Silas patrols the fence line.',
  },
  {
    id: 2, name: 'BARN', area: 'Gudang', meters: 400,
    sky: '#e8a85c', ground: '#6e4520', grass: '#a8873c',
    decor: ['hay', 'barn', 'crate', 'fence'],
    hazards: { oven: 0, knifeRate: 0.7 },
    blurb: 'The barn — dark corners, and Opal joins the hunt.',
  },
  {
    id: 3, name: 'KITCHEN', area: 'Dapur', meters: 400,
    sky: '#d98a4a', ground: '#5d3a1e', grass: '#b5763a',
    decor: ['oven', 'table', 'pot', 'knife-rack'],
    hazards: { oven: 2, knifeRate: 1.5 },
    blurb: 'The kitchen — ovens at 450F, knives falling.',
    countdown: true,
  },
  {
    id: 4, name: 'FOREST', area: 'Hutan', meters: 400,
    sky: '#9dbb6a', ground: '#4a5d23', grass: '#5d7a33',
    decor: ['tree', 'tree', 'bush', 'stump'],
    hazards: { oven: 0, knifeRate: 0.8 },
    blurb: 'Freedom Woods — no ovens, but the farmers run 1.75x.',
    farmerMult: 1.75,
  },
  {
    id: 5, name: 'CORNFIELD', area: 'Ladang Jagung', meters: 400,
    sky: '#f2c14e', ground: '#7a5426', grass: '#c9a227',
    decor: ['cornstalk', 'cornstalk', 'hay', 'scarecrow'],
    hazards: { oven: 0, knifeRate: 0.9 },
    blurb: 'The cornfield — corn everywhere, nowhere to hide.',
  },
  {
    id: 6, name: 'PUMPKIN PATCH', area: 'Kebun Labu', meters: 400,
    sky: '#e07b39', ground: '#6b4423', grass: '#c97e2e',
    decor: ['pumpkin', 'pumpkin', 'fence', 'tree'],
    hazards: { oven: 1, knifeRate: 1.0 },
    blurb: 'The pumpkin patch — the Golden Gobbler waits at the gate.',
    golden: true,
  },
];

export const TOTAL_METERS = STAGES.reduce((s, st) => s + st.meters, 0); // 2400
export const PX_PER_METER = 40;

// Stage 6 holds the Golden Gobbler (500 corn, T5) at its gate.
export function stageAt(distanceMeters) {
  let acc = 0;
  for (const st of STAGES) {
    if (distanceMeters < acc + st.meters) return { stage: st, into: distanceMeters - acc };
    acc += st.meters;
  }
  return { stage: STAGES[STAGES.length - 1], into: STAGES[STAGES.length - 1].meters };
}

export function stageStartMeters(stageId) {
  let acc = 0;
  for (const st of STAGES) {
    if (st.id === stageId) return acc;
    acc += st.meters;
  }
  return 0;
}

export function groundY() { return VIEW.ground; }
