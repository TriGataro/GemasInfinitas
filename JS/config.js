/* ============================================================
   config.js · Configuración global del juego
   ============================================================ */

const GAME_CONFIG = Object.freeze({
  ROWS: 8,                 // filas del tablero
  COLS: 8,                 // columnas del tablero
  BASE_TYPES: 5,           // tipos de gema al empezar
  MAX_TYPES: 6,            // tipos de gema máximos
  POINTS_PER_LEVEL: 1500,  // puntos para subir de nivel (el nivel no tiene tope)
  LEVELS_PER_NEW_GEM: 3,   // cada cuántos niveles aparece un tipo de gema más
  SWAP_MS: 170,            // duración del intercambio
  FALL_MS: 85,             // duración de caída por casilla
  POP_MS: 230,             // duración de la explosión
  HINT_DELAY_MS: 7000,     // tiempo sin jugar antes de mostrar una pista
  STORAGE_PREFIX: 'trigataro-gemas-'
});

/* Cada gema tiene color y forma distinta (ayuda a daltónicos) */
const GEM_STYLES = [
  { color: '#ff4d6d', shape: 'circle'   },
  { color: '#ffb703', shape: 'square'   },
  { color: '#2ec4b6', shape: 'triangle' },
  { color: '#4895ef', shape: 'diamond'  },
  { color: '#b967ff', shape: 'hexagon'  },
  { color: '#7ae582', shape: 'star'     }
];

/* Temas disponibles (los colores están en style.css) */
const THEMES = [
  { id: 'neon',   name: '🌌 Neón'   },
  { id: 'claro',  name: '☀️ Claro'  },
  { id: 'dulce',  name: '🍬 Dulce'  },
  { id: 'oceano', name: '🌊 Océano' }
];
