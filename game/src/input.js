// Keyboard input. Held keys in `held`; edge-triggered actions go through
// the `onPress` callback so main.js owns all game effects.
export function createInput() {
  return {
    held: { left: false, right: false, up: false },
    left: false, right: false,
    onPress: null, // (action) => void
  };
}

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash',
  KeyS: 'hide',
  KeyE: 'decoy',
  KeyQ: 'burst',
  KeyP: 'pause',
  KeyM: 'mute',
  KeyR: 'restart',
  Enter: 'start',
  KeyF: 'freerange',
  Digit1: 'season',
  Digit2: 'freerange',
};

export function attachInput(input) {
  function down(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (action === 'left') input.held.left = true;
    if (action === 'right') input.held.right = true;
    if (action === 'jump') input.held.up = true;
    if (input.onPress) input.onPress(action);
  }
  function up(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (action === 'left') input.held.left = false;
    if (action === 'right') input.held.right = false;
    if (action === 'jump') input.held.up = false;
  }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

// Held keys are read every frame; single presses go through onPress so
// jump/dash/decoy never double-fire from a held key.
export function readHeld(input) {
  return { left: input.held.left, right: input.held.right };
}
