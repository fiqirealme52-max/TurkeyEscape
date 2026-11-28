# GOBBLE DASH — Thanksgiving Escape

R3 revision (28 Nov 2026): 6 stages / 2400m, 6 perks, 12 feats, 2 endings,
endless Free Range, 2 farmers (Silas + Opal), stamina + corn economy,
Thanksgiving Countdown, drawn escape route, near-miss cover beat.

[![GOBBLE DASH — Thanksgiving Escape](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![Rank](https://make.fun/badge/turkey-run-game-01/fiqirealme52-max/TurkeyEscape/rank.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/fiqirealme52-max/TurkeyEscape/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Giblet the turkey has one hour before Thanksgiving dinner — and the farmers
know it. Run 2400m through the farmyard, the barn, the kitchen, the forest,
the cornfield and the pumpkin patch, dodge 450F ovens and falling carving
knives, hide in the hay, and reach the gate before Silas and Opal catch you.

## What is in this game

- **6 stages, 2400m** — Farmyard, Barn, Kitchen, Forest, Cornfield, Pumpkin Patch
- **6 perks** — Corn Boots, Featherweight, Second Wind, Hay Magnet, Butter Grease, Lucky Wishbone (one per stage clear, each with its corn cost shown)
- **12 feats** — First Flight, Hay Ghost, Marathon, Close Call x5, Corn Hoarder, Decoy Master, Ghost Run, Oven Dodger, Knife Dancer, Speedy, Perk Collector, Free Bird
- **2 endings** — ESCAPED, or PARDONED (Ghost Escape: a full run never once spotted, +1000)
- **Endless Free Range** — loop stages 3–6, farmers 10% faster every loop
- **2 farmers** — Silas (pitchfork) and Opal (rolling pin), each with a 5-state AI: patrol, spot, chase, search, corner, plus a named roster panel and an alert meter (TENANG / WASPADA / MENCARI / TERKUNCI)
- **Stamina + corn economy** — dash costs 25 stamina, corn restores 10; Corn Burst [Q] costs 5 corn; decoy [E] is free; the Golden Gobbler target is worth 500 corn
- **Thanksgiving Countdown** — entering the kitchen starts the countdown: farmers 1.25x faster, more knives, +2000 if you survive
- **Drawn escape route + batching** — dashed route with numbered waypoints, a route bar (next gate, stops, ETA), and batch callouts like "1 dash · 3 corn"
- **Double jump, hide, decoy, dash, pause, mute, restart** — all with on-screen controls and sounds made in code (no audio assets)

## Controls

Arrows / A D — run · Space / W — jump (twice = double jump) · Shift / X — dash (25 stamina) · S — hide in hay · E — straw decoy (free, 8s) · Q — Corn Burst (5 corn) · P — pause · M — mute · R — restart · 1 — Season · 2 — Free Range

## How to run

Serve the `game/` folder and open `index.html`, for example:

```
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080/ in a browser. Deterministic screenshots:
`?shot=start&seed=1`, `?shot=play&seed=1`, `?shot=farm&seed=1`, `?shot=end&seed=1`.
A scripted playtest runs at `?selftest=1`.
