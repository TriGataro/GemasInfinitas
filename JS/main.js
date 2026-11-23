/* ============================================================
   main.js · Arranque: crea el juego de Phaser y conecta la interfaz
   ============================================================ */

(function () {
  // Phaser en modo RESIZE: el canvas ocupa todo el contenedor #game,
  // así se adapta a computador, celular y cambios de orientación.
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    transparent: true,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%'
    },
    scene: [GameScene]
  });

  UI.init(game);
  Controls.init(game);

  // Al girar la pantalla se vuelve a medir el contenedor
  const refresh = () => {
    setTimeout(() => { if (game.scale) game.scale.refresh(); }, 250);
  };
  window.addEventListener('orientationchange', refresh);
  window.addEventListener('resize', refresh);
})();
