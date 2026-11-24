/* ============================================================
   main.js · Arranque: crea el juego de Phaser y conecta la interfaz
   ============================================================ */

(function () {
  const parent = document.getElementById('game');

  /** Tamaño del contenedor en píxeles CSS. */
  const cssSize = () => ({
    w: Math.max(1, Math.round(parent.clientWidth || window.innerWidth)),
    h: Math.max(1, Math.round(parent.clientHeight || window.innerHeight))
  });

  // Nitidez en celulares: el canvas se crea con (tamaño CSS × devicePixelRatio)
  // píxeles reales y se muestra reducido (zoom = 1/dpr) al tamaño CSS del contenedor.
  // Así cada píxel del canvas coincide con un píxel físico de la pantalla.
  // (La opción `resolution` ya no existe en Phaser 3.60+/4, por eso se hace a mano.)
  const dpr = getGameDpr();
  const size = cssSize();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    transparent: true,
    disableContextMenu: true,
    antialias: true,
    roundPixels: false,
    render: {
      antialias: true,
      antialiasGL: true,
      roundPixels: false,
      powerPreference: 'high-performance'
    },
    scale: {
      mode: Phaser.Scale.NONE,
      width: Math.round(size.w * dpr),
      height: Math.round(size.h * dpr),
      zoom: 1 / dpr
    },
    scene: [GameScene]
  });

  UI.init(game);
  Controls.init(game);

  // Ajusta el canvas al contenedor (cambio de ventana, giro de pantalla o de zoom/dpr)
  let lastW = 0, lastH = 0, lastDpr = 0;
  const fit = () => {
    if (!game.scale) return;
    const d = getGameDpr();
    const s = cssSize();
    const w = Math.round(s.w * d);
    const h = Math.round(s.h * d);
    if (w === lastW && h === lastH && d === lastDpr) return;
    lastW = w; lastH = h; lastDpr = d;
    if (typeof game.scale.setZoom === 'function') game.scale.setZoom(1 / d);
    game.scale.resize(w, h);
  };

  if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(parent);
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
})();
