/* ============================================================
   ui.js · Interfaz HTML: marcadores, botones, ventanas, temas,
   compartir y bloqueos (selección, copiar/pegar, zoom).
   ============================================================ */

const UI = (() => {
  let game = null;
  let state = 'play'; // 'play' | 'pause' | 'menu'
  let toastTimer = null;
  const last = { score: 0, best: 0, level: 1, moves: 0 };

  const $ = (id) => document.getElementById(id);

  /** Escena principal (puede no existir aún al arrancar). */
  function scene() {
    return game ? game.scene.getScene('Game') : null;
  }

  /* ---------- Avisos ---------- */
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---------- Marcadores ---------- */
  function setStat(id, value, key) {
    const el = $(id);
    el.textContent = value.toLocaleString('es');
    if (last[key] !== value) {
      el.classList.remove('bump');
      void el.offsetWidth; // reinicia la animación
      el.classList.add('bump');
    }
    last[key] = value;
  }

  function onStats(s) {
    setStat('stat-score', s.score, 'score');
    setStat('stat-best', s.best, 'best');
    setStat('stat-level', s.level, 'level');
    setStat('stat-moves', s.moves, 'moves');
  }

  /* ---------- Estados: jugar / pausa / menú ---------- */
  function show(id, visible) {
    $(id).classList.toggle('hidden', !visible);
  }

  function setState(next) {
    state = next;
    show('overlay-pause', next === 'pause');
    show('overlay-menu', next === 'menu');
    $('btn-pause').textContent = next === 'pause' ? '▶' : '⏸';
    const sc = scene();
    if (sc) sc.setPaused(next !== 'play');
  }

  function pause() { setState('pause'); }
  function menu() { setState('menu'); }
  function resume() { setState('play'); }
  function togglePause() { state === 'play' ? pause() : resume(); }

  function restart() {
    setState('play');
    const sc = scene();
    if (sc) sc.newGame();
  }

  function updateMuteButton() {
    const button = $('btn-mute');
    button.textContent = Sound.muted ? '🔇' : '🔊';
    button.setAttribute('aria-label', Sound.muted ? 'Activar sonido' : 'Silenciar');
    button.title = Sound.muted ? 'Activar sonido' : 'Silenciar';
  }

  /* ---------- Compartir (celular y computador) ---------- */
  async function share() {
    const data = {
      title: 'Gemas Infinitas',
      text: '¡Llevo ' + last.score.toLocaleString('es') + ' puntos en Gemas Infinitas! ¿Puedes superarme?',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // el usuario canceló
      }
    }
    try {
      await navigator.clipboard.writeText(data.text + ' ' + data.url);
      toast('Enlace copiado ✔');
    } catch (err) {
      window.prompt('Copia este enlace para compartir:', data.url);
    }
  }

  /* ---------- Temas ---------- */
  function applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg1').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);
    document.querySelectorAll('.theme-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.theme === id);
    });
    const sc = scene();
    if (sc && sc.refreshTheme) sc.refreshTheme();
  }

  function setTheme(id) {
    applyTheme(id);
    Store.set('theme', id);
  }

  function buildThemeButtons() {
    const list = $('theme-list');
    THEMES.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-btn';
      b.dataset.theme = t.id;
      b.textContent = t.name;
      b.addEventListener('click', () => setTheme(t.id));
      list.appendChild(b);
    });
  }

  /* ---------- Bloqueos: seleccionar, copiar, pegar, zoom ---------- */
  function installLocks() {
    const block = (e) => e.preventDefault();
    ['copy', 'cut', 'paste', 'selectstart', 'contextmenu', 'dragstart'].forEach((ev) => {
      document.addEventListener(ev, block);
    });
    // Gestos de pellizco de Safari/iOS
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => {
      document.addEventListener(ev, block);
    });
    // Evita el zoom por doble toque
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd < 320 && !e.target.closest('button, a')) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    // Evita pellizco con dos dedos
    document.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  }

  /* ---------- Inicio ---------- */
  function init(phaserGame) {
    game = phaserGame;
    installLocks();
    buildThemeButtons();
    applyTheme(Store.get('theme', 'neon'));
    updateMuteButton();
    document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
    document.addEventListener('keydown', () => Sound.unlock(), { once: true });

    game.events.on('stats', onStats);
    game.events.on('scene-ready', () => {
      const sc = scene();
      if (sc) sc.refreshTheme();
    });

    $('btn-pause').addEventListener('click', togglePause);
    $('btn-restart').addEventListener('click', restart);
    $('btn-share').addEventListener('click', share);
    $('btn-mute').addEventListener('click', () => {
      Sound.toggle();
      updateMuteButton();
    });
    $('btn-menu').addEventListener('click', () => (state === 'menu' ? resume() : menu()));

    // Botones de las ventanas (pausa y menú)
    document.querySelectorAll('[data-action]').forEach((b) => {
      b.addEventListener('click', () => {
        switch (b.dataset.action) {
          case 'resume': resume(); break;
          case 'restart': restart(); break;
          case 'new': restart(); break;
          case 'menu': menu(); break;
          case 'share': share(); break;
        }
      });
    });
  }

  return {
    init, toast, pause, menu, resume, restart, share, togglePause,
    get state() { return state; },
    scene
  };
})();
