/* ============================================================
   controls.js · Teclado (flechas y W A S D) y mando/joystick
   ============================================================ */

const Controls = (() => {
  let game = null;

  // Dirección [filas, columnas] por tecla
  const KEY_DIRS = {
    ArrowUp: [-1, 0], KeyW: [-1, 0],
    ArrowDown: [1, 0], KeyS: [1, 0],
    ArrowLeft: [0, -1], KeyA: [0, -1],
    ArrowRight: [0, 1], KeyD: [0, 1]
  };

  function scene() {
    return game ? game.scene.getScene('Game') : null;
  }

  /* ---------- Teclado ---------- */
  function onKeyDown(e) {
    // Atajos globales
    if (e.code === 'KeyP') {
      e.preventDefault();
      if (!e.repeat) UI.togglePause();
      return;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      if (!e.repeat) (UI.state === 'play' ? UI.menu() : UI.resume());
      return;
    }
    if (e.code === 'KeyR' && !e.repeat) {
      UI.restart();
      return;
    }

    // Controles del tablero (solo jugando)
    if (UI.state !== 'play') return;
    const sc = scene();
    if (!sc) return;

    if (KEY_DIRS[e.code]) {
      e.preventDefault();
      if (document.activeElement) document.activeElement.blur();
      sc.moveCursor(KEY_DIRS[e.code][0], KEY_DIRS[e.code][1]);
    } else if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      if (document.activeElement) document.activeElement.blur();
      sc.activate();
    }
  }

  /* ---------- Mando ---------- */
  const pad = {
    prev: {},          // estado anterior de botones
    nextDirAt: 0,      // antes de repetir dirección
    DEADZONE: 0.55,
    REPEAT_MS: 190
  };

  /** Devuelve true solo en el instante en que se pulsa un botón. */
  function pressed(gp, index) {
    const now = !!(gp.buttons[index] && gp.buttons[index].pressed);
    const was = !!pad.prev[index];
    pad.prev[index] = now;
    return now && !was;
  }

  function pollGamepad(time) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) { if (p && p.connected) { gp = p; break; } }

    if (gp) {
      const a = pressed(gp, 0);     // A / X: seleccionar
      const b = pressed(gp, 1);     // B / O: cancelar
      const start = pressed(gp, 9); // Start: pausa
      const back = pressed(gp, 8);  // Back: menú
      // Se leen todos para mantener el estado de flancos
      [12, 13, 14, 15].forEach((i) => pressed(gp, i));

      if (start) UI.togglePause();
      else if (back) (UI.state === 'play' ? UI.menu() : UI.resume());
      else if (UI.state !== 'play') {
        if (a) UI.resume();
      } else {
        const sc = scene();
        if (sc) {
          if (a) sc.activate();
          if (b) sc.cancelSelection();

          // Cruceta o palanca izquierda
          let dr = 0, dc = 0;
          if (gp.buttons[12] && gp.buttons[12].pressed) dr = -1;
          else if (gp.buttons[13] && gp.buttons[13].pressed) dr = 1;
          else if (gp.buttons[14] && gp.buttons[14].pressed) dc = -1;
          else if (gp.buttons[15] && gp.buttons[15].pressed) dc = 1;
          else {
            const x = gp.axes[0] || 0;
            const y = gp.axes[1] || 0;
            if (Math.abs(x) > pad.DEADZONE || Math.abs(y) > pad.DEADZONE) {
              if (Math.abs(x) > Math.abs(y)) dc = Math.sign(x); else dr = Math.sign(y);
            }
          }
          if ((dr || dc) && time >= pad.nextDirAt) {
            sc.moveCursor(dr, dc);
            pad.nextDirAt = time + pad.REPEAT_MS;
          } else if (!dr && !dc) {
            pad.nextDirAt = 0;
          }
        }
      }
    }
    window.requestAnimationFrame(pollGamepad);
  }

  function init(phaserGame) {
    game = phaserGame;
    window.addEventListener('keydown', onKeyDown);

    window.addEventListener('gamepadconnected', (e) => {
      UI.toast('🎮 Mando conectado: ' + (e.gamepad.id || '').split('(')[0].trim());
    });
    window.addEventListener('gamepaddisconnected', () => {
      UI.toast('🎮 Mando desconectado');
    });
    window.requestAnimationFrame(pollGamepad);
  }

  return { init };
})();
