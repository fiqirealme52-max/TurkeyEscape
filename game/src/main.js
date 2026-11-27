'use strict';
/* Bootstrap: canvas, pause, the game loop. The game runs entirely
   offline from its own files - no network requests at all. */

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let paused = false;
  let last = performance.now();
  let time = 0;

  Input.init(canvas);
  Game.loadBest();
  Game.leaves = [];
  const seedRng = makeRng(20261127);
  for (let i = 0; i < 14; i++) {
    Game.leaves.push({ x: seedRng() * CFG.W, y: seedRng() * 470, v: 12 + seedRng() * 22, r: (seedRng() - 0.5) * 2 });
  }

  const query = new URLSearchParams(window.location.search);
  const shotTaken = Shots.apply(query);
  if (!shotTaken) {
    const mute = document.getElementById('mute');
    if (mute) mute.addEventListener('click', () => {
      Sfx.ensure();
      mute.textContent = Sfx.toggleMute() ? 'SOUND: OFF' : 'SOUND: ON';
    });
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'p' && Game.screen === 'play') paused = !paused;
    if (k === 'm') Sfx.toggleMute();
  });
  canvas.addEventListener('mousedown', () => Sfx.ensure());

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!paused && !Game.frozen) {
      time += dt;
      Game.update(dt);
    } else if (Game.frozen) {
      time = Game.time;
    }
    Render.draw(ctx, time);
    if (paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(43,26,8,0.7)';
      ctx.fillRect(0, 0, CFG.W, CFG.H);
      ctx.fillStyle = '#fff3d6';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED - press P to gobble on', CFG.W / 2, CFG.H / 2);
      ctx.restore();
    }
    Input.postUpdate();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
