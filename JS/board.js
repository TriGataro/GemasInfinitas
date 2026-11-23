/* ============================================================
   board.js · Lógica pura del tablero (sin Phaser)
   Matriz de tipos de gema; -1 significa casilla vacía.
   ============================================================ */

class Board {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.types = GAME_CONFIG.BASE_TYPES;
    this.grid = [];
  }

  /** Tipo de gema aleatorio según los tipos activos. */
  randomType() {
    return Math.floor(Math.random() * this.types);
  }

  inBounds(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /** Crea un tablero nuevo sin combinaciones y con al menos un movimiento. */
  reset() {
    do {
      this.grid = [];
      for (let r = 0; r < this.rows; r++) {
        const row = [];
        for (let c = 0; c < this.cols; c++) {
          let t;
          do {
            t = this.randomType();
          } while (
            (c >= 2 && row[c - 1] === t && row[c - 2] === t) ||
            (r >= 2 && this.grid[r - 1][c] === t && this.grid[r - 2][c] === t)
          );
          row.push(t);
        }
        this.grid.push(row);
      }
    } while (!this.findMove());
  }

  /** Intercambia dos casillas. */
  swap(a, b) {
    const t = this.grid[a.r][a.c];
    this.grid[a.r][a.c] = this.grid[b.r][b.c];
    this.grid[b.r][b.c] = t;
  }

  /**
   * Busca líneas de 3 o más.
   * Devuelve { cells: [{r,c}], runs: [longitudes] }.
   */
  findMatches() {
    const g = this.grid;
    const mark = g.map(row => row.map(() => false));
    const runs = [];

    // Horizontales
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const t = g[r][c];
        let e = c + 1;
        while (e < this.cols && g[r][e] === t) e++;
        if (t >= 0 && e - c >= 3) {
          for (let k = c; k < e; k++) mark[r][k] = true;
          runs.push(e - c);
        }
        c = e;
      }
    }
    // Verticales
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const t = g[r][c];
        let e = r + 1;
        while (e < this.rows && g[e][c] === t) e++;
        if (t >= 0 && e - r >= 3) {
          for (let k = r; k < e; k++) mark[k][c] = true;
          runs.push(e - r);
        }
        r = e;
      }
    }

    const cells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (mark[r][c]) cells.push({ r, c });
      }
    }
    return { cells, runs };
  }

  /**
   * Hace caer las gemas y rellena huecos arriba.
   * moves: gemas existentes que bajan { c, from, to }
   * spawns: gemas nuevas { c, r, type, from } (from es negativo: fuera del tablero)
   */
  collapse() {
    const g = this.grid;
    const moves = [];
    const spawns = [];
    for (let c = 0; c < this.cols; c++) {
      let w = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (g[r][c] !== -1) {
          if (r !== w) {
            g[w][c] = g[r][c];
            g[r][c] = -1;
            moves.push({ c, from: r, to: w });
          }
          w--;
        }
      }
      const n = w + 1; // huecos a rellenar
      for (let r = w; r >= 0; r--) {
        const type = this.randomType();
        g[r][c] = type;
        spawns.push({ c, r, type, from: r - n });
      }
    }
    return { moves, spawns };
  }

  /** Devuelve un intercambio válido { a, b } o null si no hay movimientos. */
  findMove() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr;
          const c2 = c + dc;
          if (!this.inBounds(r2, c2)) continue;
          const a = { r, c };
          const b = { r: r2, c: c2 };
          this.swap(a, b);
          const ok = this.findMatches().cells.length > 0;
          this.swap(a, b);
          if (ok) return { a, b };
        }
      }
    }
    return null;
  }

  /** Mezcla las gemas hasta tener un tablero jugable sin combinaciones. */
  shuffle() {
    const flat = this.grid.flat();
    for (let attempt = 0; attempt < 200; attempt++) {
      for (let i = flat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flat[i], flat[j]] = [flat[j], flat[i]];
      }
      this.grid = [];
      for (let r = 0; r < this.rows; r++) {
        this.grid.push(flat.slice(r * this.cols, (r + 1) * this.cols));
      }
      if (this.findMatches().cells.length === 0 && this.findMove()) return;
    }
    this.reset(); // último recurso
  }

  /** Carga un tablero guardado; devuelve false si los datos no son válidos. */
  load(grid) {
    if (!Array.isArray(grid) || grid.length !== this.rows) return false;
    for (const row of grid) {
      if (!Array.isArray(row) || row.length !== this.cols) return false;
      for (const t of row) {
        if (!Number.isInteger(t) || t < 0 || t >= GAME_CONFIG.MAX_TYPES) return false;
      }
    }
    this.grid = grid.map(row => row.slice());
    return this.findMatches().cells.length === 0 && !!this.findMove();
  }
}
