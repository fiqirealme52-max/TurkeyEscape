'use strict';
/* Keyboard + mouse input. Edge-triggered presses are cleared each frame. */

const Input = {
  down: {},
  pressed: {},
  clicked: false,
  clickX: 0,
  clickY: 0,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if (!Input.down[k]) Input.pressed[k] = true;
      Input.down[k] = true;
    });
    window.addEventListener('keyup', (e) => { Input.down[e.key.toLowerCase()] = false; });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      Input.clickX = (e.clientX - r.left) * (CFG.W / r.width);
      Input.clickY = (e.clientY - r.top) * (CFG.H / r.height);
      Input.clicked = true;
    });
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      Input.clickX = (t.clientX - r.left) * (CFG.W / r.width);
      Input.clickY = (t.clientY - r.top) * (CFG.H / r.height);
      Input.clicked = true;
    }, { passive: false });
  },

  /* True while the key is held. */
  held(k) { return !!Input.down[k]; },

  /* True only on the frame the key went down. */
  hit(k) { return !!Input.pressed[k]; },

  /* True on the frame the canvas was clicked/tapped. */
  tap() { return Input.clicked; },

  /* Clear edge triggers; call once per frame after update. */
  postUpdate() {
    Input.pressed = {};
    Input.clicked = false;
  }
};
