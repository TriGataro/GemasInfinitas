/* ============================================================
   storage.js · Guardado en localStorage
   Si el navegador no permite guardar, se le pregunta al jugador
   qué hacer (seguir sin guardar o reintentar).
   ============================================================ */

const Store = (() => {
  const memory = {};      // respaldo temporal si no hay localStorage
  let usable = null;      // null = aún no probado
  let askedUser = false;

  /** Comprueba que localStorage funciona. */
  function probe() {
    try {
      const k = GAME_CONFIG.STORAGE_PREFIX + '__probe';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (err) {
      return false;
    }
  }

  /** Se ejecuta una sola vez: prueba el almacenamiento y pregunta si falla. */
  function ensure() {
    if (usable !== null) return;
    usable = probe();
    if (!usable && !askedUser) {
      askedUser = true;
      const keep = window.confirm(
        'No se puede guardar tu progreso en este navegador (localStorage bloqueado).\n\n' +
        'Aceptar: seguir jugando sin guardar.\n' +
        'Cancelar: intentar de nuevo (habilita el almacenamiento del sitio y recarga).'
      );
      if (!keep) {
        usable = probe(); // reintento inmediato
      }
    }
  }

  return {
    get(key, fallback) {
      ensure();
      const full = GAME_CONFIG.STORAGE_PREFIX + key;
      try {
        if (usable) {
          const raw = window.localStorage.getItem(full);
          return raw === null ? fallback : JSON.parse(raw);
        }
      } catch (err) { /* datos corruptos: usa el valor por defecto */ }
      return key in memory ? memory[key] : fallback;
    },
    set(key, value) {
      ensure();
      const full = GAME_CONFIG.STORAGE_PREFIX + key;
      memory[key] = value;
      if (!usable) return;
      try {
        window.localStorage.setItem(full, JSON.stringify(value));
      } catch (err) { /* cuota llena: se mantiene en memoria */ }
    }
  };
})();
