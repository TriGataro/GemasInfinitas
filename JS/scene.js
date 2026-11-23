/* ============================================================
   scene.js · Escena principal de Phaser
   Dibuja el tablero, maneja entradas (táctil, ratón, teclado,
   mando) y anima intercambios, explosiones y caídas.
   El juego es infinito: no hay tiempo, ni límite de puntos.
   ============================================================ */

class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  /* ---------------------------------------------------------
     Ciclo de vida
     --------------------------------------------------------- */
  create() {
    createGemTextures(this);
    this.gemColors = GEM_STYLES.map(s => hexToInt(s.color));

    this.board = new Board(GAME_CONFIG.ROWS, GAME_CONFIG.COLS);
    this.sprites = [];
    this.ambientGfx = this.add.graphics().setDepth(-1);
    this.boardGfx = this.add.graphics().setDepth(0);
    this.overlayGfx = this.add.graphics().setDepth(60);

    this.score = 0;
    this.moves = 0;
    this.level = 1;
    this.best = Store.get('best', 0);
    this.busy = false;          // hay animaciones en curso
    this.isPaused = false;
    this.selected = null;       // casilla seleccionada
    this.cursor = { r: 0, c: 0 };
    this.cursorVisible = false; // el cursor solo se ve con teclado/mando
    this.drag = null;
    this.gen = 0;               // cambia al reiniciar para cancelar animaciones viejas
    this.lastActionAt = this.time.now;
    this.hintTweens = null;
    this.hintSprites = null;
    this.selTween = null;

    this.layout();
    this.scale.on('resize', this.layout, this);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Partida guardada o nueva
    const saved = Store.get('game', null);
    if (!this.loadGame(saved)) this.newGame();

    this.game.events.emit('scene-ready', this);
  }

  update(time) {
    // Parpadeo suave del cursor/selección
    this.overlayGfx.alpha = 0.7 + 0.3 * Math.sin(time / 170);
    this.drawAmbient(time);

    // Pista tras un rato sin jugar
    if (!this.busy && !this.isPaused && !this.hintSprites &&
        time - this.lastActionAt > GAME_CONFIG.HINT_DELAY_MS) {
      this.showHint();
    }
  }

  /* ---------------------------------------------------------
     Geometría y dibujo del tablero
     --------------------------------------------------------- */
  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const pad = 8;
    const size = Math.min((w - pad * 2) / GAME_CONFIG.COLS, (h - pad * 2) / GAME_CONFIG.ROWS);
    this.cell = Math.max(20, Math.floor(size));
    this.ox = Math.floor((w - this.cell * GAME_CONFIG.COLS) / 2);
    this.oy = Math.floor((h - this.cell * GAME_CONFIG.ROWS) / 2);
    this.gemScale = (this.cell * 0.88) / 128;

    this.drawBoard();

    for (let r = 0; r < this.sprites.length; r++) {
      for (let c = 0; c < this.sprites[r].length; c++) {
        const sp = this.sprites[r][c];
        if (!sp) continue;
        const p = this.cellPos(r, c);
        sp.setPosition(p.x, p.y);
        sp.setScale(this.gemScale);
      }
    }
    this.drawSelection();
  }

  /** Centro de una casilla en píxeles. */
  cellPos(r, c) {
    return {
      x: this.ox + c * this.cell + this.cell / 2,
      y: this.oy + r * this.cell + this.cell / 2
    };
  }

  /** Lee un color (#rrggbb) de las variables CSS del tema activo. */
  themeColor(name) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return hexToInt(v || '#ffffff');
  }

  /** Dibuja el panel y las casillas con los colores del tema. */
  drawBoard() {
    const g = this.boardGfx;
    g.clear();
    const { cell, ox, oy } = this;
    const W = cell * GAME_CONFIG.COLS;
    const H = cell * GAME_CONFIG.ROWS;
    const pad = Math.max(4, cell * 0.08);

    // Resplandor y panel
    g.fillStyle(this.themeColor('--accent'), 0.18);
    g.fillRoundedRect(ox - pad - 4, oy - pad - 4, W + pad * 2 + 8, H + pad * 2 + 8, cell * 0.3);
    g.fillStyle(this.themeColor('--board'), 0.95);
    g.fillRoundedRect(ox - pad, oy - pad, W + pad * 2, H + pad * 2, cell * 0.26);
    g.lineStyle(2, this.themeColor('--accent2'), 0.55);
    g.strokeRoundedRect(ox - pad, oy - pad, W + pad * 2, H + pad * 2, cell * 0.26);

    // Casillas en damero
    const a = this.themeColor('--cell-a');
    const b = this.themeColor('--cell-b');
    for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.COLS; c++) {
        g.fillStyle((r + c) % 2 === 0 ? a : b, 1);
        g.fillRoundedRect(ox + c * cell + 2, oy + r * cell + 2, cell - 4, cell - 4, cell * 0.16);
      }
    }
  }

  /** Partículas suaves de fondo que dan profundidad sin distraer. */
  drawAmbient(time) {
    if (!this.ambientGfx || !this.scale) return;
    const g = this.ambientGfx;
    g.clear();
    const w = this.scale.width;
    const h = this.scale.height;
    const colorA = this.themeColor('--accent');
    const colorB = this.themeColor('--accent2');
    for (let i = 0; i < 18; i++) {
      const seed = i * 83.17;
      const x = ((seed * 1.7 + time * (0.012 + (i % 4) * 0.004)) % (w + 40)) - 20;
      const y = (h * ((seed * 0.37) % 1) + Math.sin(time / 900 + i) * 18 + h) % h;
      g.fillStyle(i % 2 === 0 ? colorA : colorB, 0.055 + (i % 3) * 0.015);
      g.fillCircle(x, y, 1.5 + (i % 4));
    }
  }

  /** Redibuja el tablero al cambiar de tema. */
  refreshTheme() {
    this.drawBoard();
    this.drawSelection();
  }

  /** Marco de selección (blanco) y del cursor de teclado/mando. */
  drawSelection() {
    const g = this.overlayGfx;
    g.clear();
    const inset = 3;
    if (this.selected) {
      const p = this.cellPos(this.selected.r, this.selected.c);
      g.lineStyle(Math.max(3, this.cell * 0.06), 0xffffff, 1);
      g.strokeRoundedRect(p.x - this.cell / 2 + inset, p.y - this.cell / 2 + inset,
        this.cell - inset * 2, this.cell - inset * 2, this.cell * 0.18);
    }
    if (this.cursorVisible) {
      const p = this.cellPos(this.cursor.r, this.cursor.c);
      g.lineStyle(Math.max(3, this.cell * 0.05), this.themeColor('--accent2'), 1);
      g.strokeRoundedRect(p.x - this.cell / 2 + inset + 2, p.y - this.cell / 2 + inset + 2,
        this.cell - inset * 2 - 4, this.cell - inset * 2 - 4, this.cell * 0.15);
    }
  }

  /* ---------------------------------------------------------
     Partidas: nueva / cargar / guardar
     --------------------------------------------------------- */
  newGame() {
    this.resetRuntime();
    this.score = 0;
    this.moves = 0;
    this.level = 1;
    this.board.types = GAME_CONFIG.BASE_TYPES;
    this.board.reset();
    Store.set('game', null);
    this.emitStats();
    this.introBuild();
  }

  /** Carga una partida guardada. Devuelve false si los datos no sirven. */
  loadGame(data) {
    if (!data || typeof data.score !== 'number') return false;
    this.board.types = Math.min(GAME_CONFIG.MAX_TYPES, Math.max(GAME_CONFIG.BASE_TYPES, data.types | 0));
    if (!this.board.load(data.grid)) return false;
    this.resetRuntime();
    this.score = data.score;
    this.moves = data.moves | 0;
    this.level = this.levelFor(this.score);
    this.emitStats();
    this.introBuild();
    return true;
  }

  saveGame() {
    Store.set('game', {
      grid: this.board.grid,
      score: this.score,
      moves: this.moves,
      types: this.board.types
    });
  }

  /** Cancela animaciones y limpia sprites antes de empezar de nuevo. */
  resetRuntime() {
    this.gen++;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.destroySprites();
    this.selTween = null;
    this.hintTweens = null;
    this.hintSprites = null;
    this.selected = null;
    this.drag = null;
    this.busy = false;
    this.lastActionAt = this.time.now;
    this.drawSelection();
  }

  /** Crea los sprites del tablero actual con animación de entrada. */
  async introBuild() {
    const gen = this.gen;
    this.busy = true;
    await this.buildSprites(true);
    if (gen !== this.gen) return;
    this.busy = false;
    this.lastActionAt = this.time.now;
  }

  /* ---------------------------------------------------------
     Sprites
     --------------------------------------------------------- */
  destroySprites() {
    for (const row of this.sprites) {
      for (const sp of row) if (sp) sp.destroy();
    }
    this.sprites = [];
  }

  createSprite(type, r, c, y) {
    const p = this.cellPos(r, c);
    const sp = this.add.image(p.x, y !== undefined ? y : p.y, 'gem' + type);
    sp.setScale(this.gemScale).setDepth(10);
    sp.gemType = type;
    return sp;
  }

  /** (Re)crea todos los sprites desde la matriz. */
  buildSprites(animated) {
    this.destroySprites();
    const waits = [];
    for (let r = 0; r < this.board.rows; r++) {
      this.sprites[r] = [];
      for (let c = 0; c < this.board.cols; c++) {
        const sp = this.createSprite(this.board.grid[r][c], r, c);
        this.sprites[r][c] = sp;
        if (animated) {
          sp.setScale(0);
          waits.push(new Promise(res => this.tweens.add({
            targets: sp, scale: this.gemScale, duration: 320,
            delay: (r + c) * 28, ease: 'Back.easeOut', onComplete: () => res()
          })));
        }
      }
    }
    return Promise.all(waits);
  }

  moveTo(sp, r, c, ms, ease) {
    const p = this.cellPos(r, c);
    return new Promise(res => this.tweens.add({
      targets: sp, x: p.x, y: p.y, duration: ms,
      ease: ease || 'Sine.easeInOut', onComplete: () => res()
    }));
  }

  wait(ms) {
    return new Promise(res => this.time.delayedCall(ms, res));
  }

  /* ---------------------------------------------------------
     Entrada: puntero (táctil y ratón)
     --------------------------------------------------------- */
  canAct() {
    return !this.busy && !this.isPaused;
  }

  cellAt(x, y) {
    const c = Math.floor((x - this.ox) / this.cell);
    const r = Math.floor((y - this.oy) / this.cell);
    return this.board.inBounds(r, c) ? { r, c } : null;
  }

  onPointerDown(p) {
    if (!this.canAct()) return;
    const cell = this.cellAt(p.x, p.y);
    if (!cell) return;
    this.cursorVisible = false;
    this.drag = { cell, x: p.x, y: p.y, done: false };
  }

  onPointerMove(p) {
    const d = this.drag;
    if (!d || d.done || !p.isDown || !this.canAct()) return;
    const dx = p.x - d.x;
    const dy = p.y - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.cell * 0.35) return;
    d.done = true;
    const target = Math.abs(dx) > Math.abs(dy)
      ? { r: d.cell.r, c: d.cell.c + Math.sign(dx) }
      : { r: d.cell.r + Math.sign(dy), c: d.cell.c };
    if (this.board.inBounds(target.r, target.c)) {
      this.trySwap(d.cell, target);
    }
  }

  onPointerUp() {
    const d = this.drag;
    this.drag = null;
    if (!d || d.done || !this.canAct()) return;
    this.tapCell(d.cell);
  }

  /** Lógica de tocar una casilla: seleccionar / deseleccionar / intercambiar. */
  tapCell(cell) {
    this.touch();
    Sound.unlock();
    Sound.tap();
    const sel = this.selected;
    if (!sel) { this.select(cell); return; }
    if (sel.r === cell.r && sel.c === cell.c) { this.deselect(); return; }
    if (Math.abs(sel.r - cell.r) + Math.abs(sel.c - cell.c) === 1) {
      this.trySwap(sel, cell);
      return;
    }
    this.deselect();
    this.select(cell);
  }

  select(cell) {
    this.selected = { r: cell.r, c: cell.c };
    const sp = this.sprites[cell.r][cell.c];
    if (sp) {
      this.selTween = this.tweens.add({
        targets: sp, scale: this.gemScale * 1.13, duration: 260,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    this.drawSelection();
  }

  deselect() {
    if (this.selTween) {
      this.selTween.stop();
      this.selTween = null;
    }
    if (this.selected) {
      const sp = this.sprites[this.selected.r] && this.sprites[this.selected.r][this.selected.c];
      if (sp && sp.active) sp.setScale(this.gemScale);
    }
    this.selected = null;
    this.drawSelection();
  }

  /* ---------------------------------------------------------
     Entrada: teclado y mando (los llama controls.js)
     --------------------------------------------------------- */
  moveCursor(dr, dc) {
    if (!this.canAct()) return;
    this.touch();
    this.cursorVisible = true;
    if (this.selected) {
      // Con una gema seleccionada, la dirección intercambia
      const target = { r: this.selected.r + dr, c: this.selected.c + dc };
      if (this.board.inBounds(target.r, target.c)) {
        this.cursor = { r: target.r, c: target.c };
        this.trySwap(this.selected, target);
      }
      return;
    }
    this.cursor.r = Phaser.Math.Clamp(this.cursor.r + dr, 0, this.board.rows - 1);
    this.cursor.c = Phaser.Math.Clamp(this.cursor.c + dc, 0, this.board.cols - 1);
    this.drawSelection();
  }

  activate() {
    if (!this.canAct()) return;
    this.cursorVisible = true;
    this.tapCell(this.cursor);
  }

  cancelSelection() {
    if (this.selected) this.deselect();
  }

  /* ---------------------------------------------------------
     Pausa
     --------------------------------------------------------- */
  setPaused(flag) {
    this.isPaused = flag;
    this.drag = null;
    if (flag) this.scene.pause(); else this.scene.resume();
    if (!flag) this.lastActionAt = this.time.now;
  }

  /* ---------------------------------------------------------
     Jugadas
     --------------------------------------------------------- */
  touch() {
    this.lastActionAt = this.time.now;
    this.clearHint();
  }

  swapSprites(a, b) {
    const s = this.sprites;
    const t = s[a.r][a.c];
    s[a.r][a.c] = s[b.r][b.c];
    s[b.r][b.c] = t;
    return Promise.all([
      this.moveTo(s[a.r][a.c], a.r, a.c, GAME_CONFIG.SWAP_MS),
      this.moveTo(s[b.r][b.c], b.r, b.c, GAME_CONFIG.SWAP_MS)
    ]);
  }

  async trySwap(a, b) {
    if (!this.canAct()) return;
    const gen = this.gen;
    a = { r: a.r, c: a.c };
    b = { r: b.r, c: b.c };
    this.busy = true;
    this.touch();
    this.deselect();

    Sound.swap();
    await this.swapSprites(a, b);
    if (gen !== this.gen) return;
    this.board.swap(a, b);

    if (this.board.findMatches().cells.length === 0) {
      // Movimiento inválido: vuelve atrás
      this.board.swap(a, b);
      Sound.invalid();
      this.cameras.main.shake(110, 0.0025);
      await this.swapSprites(a, b);
      if (gen !== this.gen) return;
      this.busy = false;
      return;
    }

    this.moves++;
    this.emitStats();
    await this.resolve();
    if (gen !== this.gen) return;
    this.saveGame();
    this.busy = false;
    this.lastActionAt = this.time.now;
  }

  /** Resuelve combinaciones en cadena hasta que el tablero queda estable. */
  async resolve() {
    const gen = this.gen;
    let combo = 0;

    for (;;) {
      const m = this.board.findMatches();
      if (m.cells.length === 0) break;
      combo++;

      // Puntos: 10 por gema, bonus por líneas largas, multiplicado por la cadena
      let pts = m.cells.length * 10;
      for (const len of m.runs) pts += (len - 3) * 25;
      pts *= combo;
      this.addScore(pts);

      // Texto flotante en el centro de la combinación
      const cx = m.cells.reduce((s, q) => s + this.cellPos(q.r, q.c).x, 0) / m.cells.length;
      const cy = m.cells.reduce((s, q) => s + this.cellPos(q.r, q.c).y, 0) / m.cells.length;
      this.floatText(cx, cy, '+' + pts, 0.45);
      if (combo > 1) this.floatText(cx, cy - this.cell * 0.7, '¡Combo x' + combo + '!', 0.5, '#ffe14d');
      if (combo >= 3 || m.cells.length >= 5) this.cameras.main.shake(170, 0.005);
      Sound.pop(combo);
      if (combo > 1) Sound.combo(combo);

      // Explosión
      const pops = [];
      for (const q of m.cells) {
        const sp = this.sprites[q.r][q.c];
        this.sprites[q.r][q.c] = null;
        this.board.grid[q.r][q.c] = -1;
        if (sp) pops.push(this.popSprite(sp));
      }
      await Promise.all(pops);
      if (gen !== this.gen) return;

      // Caída y relleno
      const { moves, spawns } = this.board.collapse();
      const falls = [];
      for (const mv of moves) {
        const sp = this.sprites[mv.from][mv.c];
        this.sprites[mv.from][mv.c] = null;
        this.sprites[mv.to][mv.c] = sp;
        falls.push(this.moveTo(sp, mv.to, mv.c,
          GAME_CONFIG.FALL_MS * (mv.to - mv.from) + 60, 'Quad.easeIn'));
      }
      for (const s of spawns) {
        const startY = this.cellPos(s.from, s.c).y;
        const sp = this.createSprite(s.type, s.r, s.c, startY);
        this.sprites[s.r][s.c] = sp;
        falls.push(this.moveTo(sp, s.r, s.c,
          GAME_CONFIG.FALL_MS * (s.r - s.from) + 60, 'Quad.easeIn'));
      }
      await Promise.all(falls);
      if (gen !== this.gen) return;
    }

    // Subida de nivel (sin tope)
    const newLevel = this.levelFor(this.score);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.board.types = this.typesFor(newLevel);
      this.emitStats();
      this.floatText(this.scale.width / 2, this.scale.height / 2, '¡Nivel ' + newLevel + '!', 0.9, '#7dffb0');
      this.cameras.main.flash(250, 255, 255, 255, true);
      this.cameras.main.shake(260, 0.008);
      Sound.level();
    }

    // Sin movimientos posibles: mezcla
    if (!this.board.findMove()) {
      this.floatText(this.scale.width / 2, this.scale.height / 2, 'Sin movimientos: ¡mezclando!', 0.55, '#ffffff');
      Sound.reshuffle();
      await this.reshuffle();
    }
  }

  async reshuffle() {
    const gen = this.gen;
    const outs = [];
    for (const row of this.sprites) {
      for (const sp of row) {
        if (sp) outs.push(new Promise(res => this.tweens.add({
          targets: sp, scale: 0, angle: 180, duration: 260, ease: 'Back.easeIn', onComplete: () => res()
        })));
      }
    }
    await Promise.all(outs);
    if (gen !== this.gen) return;
    this.board.shuffle();
    await this.buildSprites(true);
  }

  popSprite(sp) {
    this.burst(sp.x, sp.y, this.gemColors[sp.gemType]);
    const dir = Math.random() < 0.5 ? -1 : 1;
    return new Promise(res => this.tweens.add({
      targets: sp,
      scale: this.gemScale * 1.4,
      alpha: 0,
      angle: dir * 45,
      duration: GAME_CONFIG.POP_MS,
      ease: 'Quad.easeOut',
      onComplete: () => { sp.destroy(); res(); }
    }));
  }

  /* ---------------------------------------------------------
     Efectos visuales
     --------------------------------------------------------- */
  burst(x, y, color) {
    const ring = this.add.circle(x, y, Math.max(8, this.cell * 0.18), color, 0)
      .setStrokeStyle(Math.max(2, this.cell * 0.055), color, 0.9)
      .setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      radius: this.cell * 0.72,
      alpha: 0,
      duration: 330,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const dist = this.cell * (0.5 + Math.random() * 0.6);
      const sp = this.add.image(x, y, 'spark')
        .setTint(color).setDepth(30).setBlendMode(Phaser.BlendModes.ADD)
        .setScale((this.cell / 32) * (0.5 + Math.random() * 0.5));
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        alpha: 0,
        scale: 0,
        duration: 380 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => sp.destroy()
      });
    }
  }

  floatText(x, y, str, sizeFactor, color) {
    const t = this.add.text(x, y, str, {
      fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
      fontSize: Math.round(this.cell * sizeFactor) + 'px',
      fontStyle: 'bold',
      color: color || '#ffffff',
      stroke: '#1a0b3a',
      strokeThickness: Math.max(3, Math.round(this.cell * 0.08)),
      align: 'center'
    }).setOrigin(0.5).setDepth(100);
    t.setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: t, y: y - this.cell * 0.9, alpha: 0,
      delay: 450, duration: 650, ease: 'Quad.easeIn',
      onComplete: () => t.destroy()
    });
  }

  /* ---------------------------------------------------------
     Pistas
     --------------------------------------------------------- */
  showHint() {
    const m = this.board.findMove();
    if (!m) return;
    const sa = this.sprites[m.a.r][m.a.c];
    const sb = this.sprites[m.b.r][m.b.c];
    if (!sa || !sb) return;
    this.hintSprites = [sa, sb];
    this.hintTweens = this.hintSprites.map(sp => this.tweens.add({
      targets: sp, scale: this.gemScale * 1.2, duration: 380,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    }));
  }

  clearHint() {
    if (this.hintTweens) this.hintTweens.forEach(t => t.stop());
    if (this.hintSprites) {
      this.hintSprites.forEach(sp => { if (sp && sp.active) sp.setScale(this.gemScale); });
    }
    this.hintTweens = null;
    this.hintSprites = null;
  }

  /* ---------------------------------------------------------
     Puntuación
     --------------------------------------------------------- */
  levelFor(score) {
    return 1 + Math.floor(score / GAME_CONFIG.POINTS_PER_LEVEL);
  }

  typesFor(level) {
    return Math.min(GAME_CONFIG.MAX_TYPES,
      GAME_CONFIG.BASE_TYPES + Math.floor((level - 1) / GAME_CONFIG.LEVELS_PER_NEW_GEM));
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.best) {
      this.best = this.score;
      Store.set('best', this.best);
    }
    this.emitStats();
  }

  emitStats() {
    this.game.events.emit('stats', {
      score: this.score, best: this.best, level: this.level, moves: this.moves
    });
  }
}
