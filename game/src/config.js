// GOBBLE DASH — Thanksgiving Escape (R3). Shared tuning, all in one place.
// Score scale is deliberately 5-digit (R3.4): corn 100, stage bonus 1000.
export const VIEW = { w: 960, h: 540, ground: 462 };

export const SCORE = {
  corn: 100,          // was 50 in R1, rescaled x2
  stageBonus: 1000,   // was 500 in R1, rescaled x2
  closeCall: 50,      // was 25 in R1, rescaled x2
  countdownBonus: 2000,
  pardonBonus: 1000,
  goldenGobbler: 500, // corn value of the Golden Gobbler target (T5)
  featBonus: 100,
};

export const PLAYER = {
  runSpeed: 235,        // px/s base
  jumpVel: -620,
  gravity: 1700,
  dashCost: 25,         // stamina
  dashSpeed: 560,
  dashTime: 0.22,
  staminaMax: 100,
  staminaRegen: 12,     // per second
  staminaPerCorn: 10,
  cornBurstCost: 5,     // corn, [Q]
  cornBurstTime: 1.0,
  decoyCooldown: 8,     // seconds, [E] free
  lives: 3,
};

export const PERKS = [
  { id: 'corn-boots',    name: 'Corn Boots',     cost: 10, desc: '+10% run speed',        apply: 'speed' },
  { id: 'featherweight', name: 'Featherweight',  cost: 15, desc: 'Higher double jump',    apply: 'jump' },
  { id: 'second-wind',   name: 'Second Wind',    cost: 20, desc: '+1 life, once per run', apply: 'life' },
  { id: 'hay-magnet',    name: 'Hay Magnet',     cost: 25, desc: 'Corn flies to you',     apply: 'magnet' },
  { id: 'butter-grease', name: 'Butter Grease',  cost: 30, desc: 'Farmers 15% slower in chase', apply: 'grease' },
  { id: 'lucky-wishbone',name: 'Lucky Wishbone', cost: 35, desc: '+1 spare decoy',        apply: 'decoy' },
];

export const FEATS = [
  { id: 'first-flight',  name: 'First Flight',  desc: 'First jump' },
  { id: 'hay-ghost',     name: 'Hay Ghost',     desc: 'Hide 3x unseen' },
  { id: 'marathon',      name: 'Marathon',      desc: 'Reach 1600m' },
  { id: 'close-call-5',  name: 'Close Call x5', desc: '5 close calls' },
  { id: 'corn-hoarder',  name: 'Corn Hoarder',  desc: '30 corn in one run' },
  { id: 'decoy-master',  name: 'Decoy Master',  desc: 'Farmers fooled by decoy 3x' },
  { id: 'ghost-run',     name: 'Ghost Run',     desc: 'One stage never seen' },
  { id: 'oven-dodger',   name: 'Oven Dodger',   desc: 'Pass 5 ovens' },
  { id: 'knife-dancer',  name: 'Knife Dancer',  desc: 'Dodge 10 knives' },
  { id: 'speedy',        name: 'Speedy',        desc: 'Escape in under 90s' },
  { id: 'perk-collector',name: 'Perk Collector',desc: 'Hold 3 perks' },
  { id: 'free-bird',     name: 'Free Bird',     desc: 'Escape' },
];

export const FARMERS = [
  { id: 'silas', name: 'SILAS', tool: 'pitchfork', color: '#7a4a21', stageMin: 1 },
  { id: 'opal',  name: 'OPAL',  tool: 'rolling pin', color: '#8a2f4d', stageMin: 2 },
];

export const CONTROLS = [
  'ARROWS / A D — run',
  'SPACE / W — jump (twice = double jump)',
  'SHIFT / X — dash (25 stamina)',
  'S — hide in hay',
  'E — straw decoy (free, 8s)',
  'Q — Corn Burst (5 corn)',
  'P — pause   M — mute   R — restart',
];

export const GOLDEN_TITLE = '6 STAGES \u2022 6 PERKS \u2022 12 FEATS \u2022 2 ENDINGS \u2022 ENDLESS \u2022 2 FARMERS';

// R3: the second farmer is OPAL (rolling pin). Farmer names are original by
// rule — never Gus, Mabel, Jed or Bram, which rival entries already use.
