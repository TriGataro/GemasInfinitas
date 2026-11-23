/* ============================================================
   textures.js · Generación visual de gemas vectoriales en Canvas 2D
   Optimizadas para máxima nitidez, contraste y belleza en celulares.
   Cada joya posee su propio corte de facetas geométricas (talla de gema),
   brillo especular calibrado a su forma, relieve 3D y bisel de alto contraste.
   ============================================================ */

/** Convierte cadena "#rrggbb" o "#rgb" a entero numérico 0xrrggbb */
function hexToInt(hex) {
  return parseInt(String(hex).trim().replace('#', ''), 16);
}

/** Aclara (amt > 0) u oscurece (amt < 0) un color hexadecimal "#rrggbb" */
function shadeColor(hex, amt) {
  const n = hexToInt(hex);
  const mix = (v) => Math.min(255, Math.max(0, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/** Retorna una cadena "rgba(r,g,b,alpha)" a partir de un color hexadecimal */
function hexToRgba(hex, alpha) {
  const n = hexToInt(hex);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/**
 * Traza el contorno exterior de la gema según su forma geométrica.
 * Centrado en (0, 0), dentro de una caja de aproximadamente 100x100 unidades.
 */
function traceShape(ctx, shape, r) {
  ctx.beginPath();
  switch (shape) {
    case 'circle': {
      // Rubí: corte redondo / cabujón
      const radius = r || 48;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      break;
    }
    case 'square': {
      // Topacio: corte cojín / princesa con esquinas suavemente redondeadas
      const s = r || 45;
      const rad = 10;
      ctx.moveTo(-s + rad, -s);
      ctx.lineTo(s - rad, -s);
      ctx.quadraticCurveTo(s, -s, s, -s + rad);
      ctx.lineTo(s, s - rad);
      ctx.quadraticCurveTo(s, s, s - rad, s);
      ctx.lineTo(-s + rad, s);
      ctx.quadraticCurveTo(-s, s, -s, s - rad);
      ctx.lineTo(-s, -s + rad);
      ctx.quadraticCurveTo(-s, -s, -s + rad, -s);
      break;
    }
    case 'triangle': {
      // Esmeralda / Turquesa: corte billón (trillion cut) con vértices suavizados
      ctx.moveTo(0, -48);
      ctx.quadraticCurveTo(3, -50, 6, -45);
      ctx.lineTo(47, 34);
      ctx.quadraticCurveTo(50, 39, 44, 40);
      ctx.lineTo(-44, 40);
      ctx.quadraticCurveTo(-50, 39, -47, 34);
      ctx.lineTo(-6, -45);
      ctx.quadraticCurveTo(-3, -50, 0, -48);
      break;
    }
    case 'diamond': {
      // Zafiro: corte rombo / brillante estilizado
      ctx.moveTo(0, -53);
      ctx.lineTo(47, 0);
      ctx.lineTo(0, 53);
      ctx.lineTo(-47, 0);
      break;
    }
    case 'hexagon': {
      // Amatista: corte hexagonal regular
      const rad = r || 48;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      break;
    }
    case 'star': {
      // Peridoto: corte estrella de 5 puntas facetada en relieve 3D
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? 51 : 23;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      break;
    }
  }
  ctx.closePath();
}

/** Dibuja un destello estelar micro de 4 puntas en la posición indicada */
function drawSparkle(ctx, x, y, size, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha || 0.9) + ')';
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.closePath();
  ctx.fill();

  // Núcleo brillante circular
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ============================================================
   Tallas individuales de cada gema (facetado geométrico)
   ============================================================ */

/** 1. RUBÍ (Círculo · Corte Cabujón y Corona de 8 Facetas) */
function drawCircleGem(ctx, color) {
  // Corona exterior con 8 facetas trapezoidales
  const R = 48;
  const r = 29;
  const lightAngle = -Math.PI * 0.75; // Luz desde arriba a la izquierda (-135°)

  for (let i = 0; i < 8; i++) {
    const a1 = (i * Math.PI) / 4 - Math.PI / 8;
    const a2 = a1 + Math.PI / 4;
    const midAngle = (a1 + a2) / 2;
    const dot = Math.cos(midAngle - lightAngle);

    ctx.beginPath();
    ctx.arc(0, 0, R, a1, a2);
    ctx.arc(0, 0, r, a2, a1, true);
    ctx.closePath();

    if (dot > 0.05) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.08 + dot * 0.32).toFixed(2) + ')';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, ' + (0.05 - dot * 0.32).toFixed(2) + ')';
    }
    ctx.fill();

    // Línea de arista divisoria entre facetas
    ctx.beginPath();
    ctx.moveTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
    ctx.lineWidth = 1;
    ctx.strokeStyle = dot > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
    ctx.stroke();
  }

  // Meseta central (mesa/domo con volumen radial luminoso)
  const dome = ctx.createRadialGradient(-7, -8, 2, 0, 0, r);
  dome.addColorStop(0, shadeColor(color, 0.75));
  dome.addColorStop(0.35, shadeColor(color, 0.28));
  dome.addColorStop(0.85, color);
  dome.addColorStop(1, shadeColor(color, -0.32));
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Borde biselado que delimita la mesa central
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.stroke();

  // Reflejo cáustico interno inferior derecho (profundidad de gema real)
  const caustic = ctx.createRadialGradient(8, 12, 1, 8, 12, 20);
  caustic.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  caustic.addColorStop(0.6, hexToRgba(color, 0.25));
  caustic.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = caustic;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
  ctx.fill();

  // Brillo especular curvado superior izquierdo
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.ellipse(-13, -15, 14, 5.5, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Destello estelar
  drawSparkle(ctx, -15, -17, 7, 0.95);
}

/** 2. TOPACIO / ÁMBAR (Cuadrado · Corte Princesa / Cojín) */
function drawSquareGem(ctx, color) {
  const s = 45;
  const ts = 25; // Tamaño de la mesa central

  // 4 facetas trapezoidales de bisel exterior
  // Faceta superior (iluminación cenital brillante)
  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(s, -s);
  ctx.lineTo(ts, -ts);
  ctx.lineTo(-ts, -ts);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
  ctx.fill();

  // Faceta izquierda (iluminación lateral brillante)
  ctx.beginPath();
  ctx.moveTo(-s, s);
  ctx.lineTo(-s, -s);
  ctx.lineTo(-ts, -ts);
  ctx.lineTo(-ts, ts);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fill();

  // Faceta derecha (semisombra)
  ctx.beginPath();
  ctx.moveTo(s, -s);
  ctx.lineTo(s, s);
  ctx.lineTo(ts, ts);
  ctx.lineTo(ts, -ts);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
  ctx.fill();

  // Faceta inferior (sombra profunda)
  ctx.beginPath();
  ctx.moveTo(-s, s);
  ctx.lineTo(s, s);
  ctx.lineTo(ts, ts);
  ctx.lineTo(-ts, ts);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fill();

  // Líneas diagonales de arista hacia los 4 vértices
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(-ts, -ts);
  ctx.moveTo(s, -s);
  ctx.lineTo(ts, -ts);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.moveTo(s, s);
  ctx.lineTo(ts, ts);
  ctx.moveTo(-s, s);
  ctx.lineTo(-ts, ts);
  ctx.stroke();

  // Mesa central cuadrada en relieve con degradado diagonal
  const table = ctx.createLinearGradient(-ts, -ts, ts, ts);
  table.addColorStop(0, shadeColor(color, 0.65));
  table.addColorStop(0.4, color);
  table.addColorStop(1, shadeColor(color, -0.32));
  ctx.fillStyle = table;
  ctx.beginPath();
  const tr = 4;
  ctx.moveTo(-ts + tr, -ts);
  ctx.lineTo(ts - tr, -ts);
  ctx.quadraticCurveTo(ts, -ts, ts, -ts + tr);
  ctx.lineTo(ts, ts - tr);
  ctx.quadraticCurveTo(ts, ts, ts - tr, ts);
  ctx.lineTo(-ts + tr, ts);
  ctx.quadraticCurveTo(-ts, ts, -ts, ts - tr);
  ctx.lineTo(-ts, -ts + tr);
  ctx.quadraticCurveTo(-ts, -ts, -ts + tr, -ts);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();

  // Reflejo cáustico interno inferior
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(ts - 4, ts - 18);
  ctx.lineTo(ts - 4, ts - 4);
  ctx.lineTo(ts - 18, ts - 4);
  ctx.closePath();
  ctx.fill();

  // Destello en la esquina superior izquierda
  drawSparkle(ctx, -ts + 2, -ts + 2, 8, 0.95);
}

/** 3. TURQUESA / ESMERALDA (Triángulo · Corte Billón / Trillion) */
function drawTriangleGem(ctx, color) {
  // Vértices exteriores (centrados geométricamente)
  const top = { x: 0, y: -48 };
  const br = { x: 46, y: 36 };
  const bl = { x: -46, y: 36 };

  // Vértices de la mesa central triangular elevada
  const tTop = { x: 0, y: -18 };
  const tBr = { x: 22, y: 21 };
  const tBl = { x: -22, y: 21 };

  // 1. Faceta izquierda (captura la luz principal directamente)
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.lineTo(tBl.x, tBl.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fill();

  // 2. Faceta derecha (semisombra)
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(tBr.x, tBr.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fill();

  // 3. Faceta inferior (sombra de base)
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(tBr.x, tBr.y);
  ctx.lineTo(tBl.x, tBl.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fill();

  // Aristas divisorias
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(tBl.x, tBl.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.moveTo(br.x, br.y);
  ctx.lineTo(tBr.x, tBr.y);
  ctx.stroke();

  // Mesa triangular central luminosa
  const table = ctx.createLinearGradient(0, -18, 0, 21);
  table.addColorStop(0, shadeColor(color, 0.65));
  table.addColorStop(0.5, color);
  table.addColorStop(1, shadeColor(color, -0.3));
  ctx.fillStyle = table;
  ctx.beginPath();
  ctx.moveTo(tTop.x, tTop.y);
  ctx.lineTo(tBr.x, tBr.y);
  ctx.lineTo(tBl.x, tBl.y);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();

  // Cáustica interna en la base
  ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.beginPath();
  ctx.moveTo(-16, 20);
  ctx.lineTo(16, 20);
  ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill();

  // Destello estelar en el vértice superior
  drawSparkle(ctx, -4, -22, 7.5, 0.95);
}

/** 4. ZAFIRO (Rombo · Corte Brillante Biaxial) */
function drawDiamondGem(ctx, color) {
  const top = { x: 0, y: -52 };
  const right = { x: 46, y: 0 };
  const bottom = { x: 0, y: 52 };
  const left = { x: -46, y: 0 };

  const tTop = { x: 0, y: -22 };
  const tRight = { x: 20, y: 0 };
  const tBottom = { x: 0, y: 22 };
  const tLeft = { x: -20, y: 0 };

  // 4 facetas exteriores trapezoidales
  // Superior izquierda (máxima luz)
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(tLeft.x, tLeft.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  // Superior derecha (luz suave)
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(tRight.x, tRight.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fill();

  // Inferior izquierda (semisombra con reflejo azul)
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(tBottom.x, tBottom.y);
  ctx.lineTo(tLeft.x, tLeft.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fill();

  // Inferior derecha (sombra profunda)
  ctx.beginPath();
  ctx.moveTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(tBottom.x, tBottom.y);
  ctx.lineTo(tRight.x, tRight.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fill();

  // Facetas internas de la mesa en 4 cuadrantes
  // Cuadrante superior izquierdo interno
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tLeft.x, tLeft.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fill();

  // Cuadrante superior derecho interno
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tRight.x, tRight.y);
  ctx.lineTo(tTop.x, tTop.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fill();

  // Cuadrante inferior izquierdo interno
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tLeft.x, tLeft.y);
  ctx.lineTo(tBottom.x, tBottom.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fill();

  // Cuadrante inferior derecho interno
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tRight.x, tRight.y);
  ctx.lineTo(tBottom.x, tBottom.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fill();

  // Aristas de corte brillantes
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.stroke();

  // Contorno de la mesa interna
  ctx.beginPath();
  ctx.moveTo(tTop.x, tTop.y);
  ctx.lineTo(tRight.x, tRight.y);
  ctx.lineTo(tBottom.x, tBottom.y);
  ctx.lineTo(tLeft.x, tLeft.y);
  ctx.closePath();
  ctx.stroke();

  // Destello estelar
  drawSparkle(ctx, -7, -23, 7.5, 0.95);
  drawSparkle(ctx, -22, 0, 5.5, 0.75);
}

/** 5. AMATISTA (Hexágono · Corte Esmeralda Hexagonal) */
function drawHexagonGem(ctx, color) {
  const R = 48;
  const r = 26;
  const outer = [];
  const inner = [];

  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    outer.push({ x: Math.cos(a) * R, y: Math.sin(a) * R });
    inner.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  // 6 facetas trapezoidales perimetrales
  // Factor de iluminación según la orientación de cada arista respecto a la luz (-135°)
  const facetFills = [
    'rgba(255, 255, 255, 0.24)', // Arista 0-1 (superior derecha)
    'rgba(0, 0, 0, 0.20)',       // Arista 1-2 (derecha)
    'rgba(0, 0, 0, 0.40)',       // Arista 2-3 (inferior derecha)
    'rgba(0, 0, 0, 0.22)',       // Arista 3-4 (inferior izquierda)
    'rgba(255, 255, 255, 0.18)', // Arista 4-5 (izquierda)
    'rgba(255, 255, 255, 0.46)'  // Arista 5-0 (superior izquierda, luz directa)
  ];

  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6;
    ctx.beginPath();
    ctx.moveTo(outer[i].x, outer[i].y);
    ctx.lineTo(outer[next].x, outer[next].y);
    ctx.lineTo(inner[next].x, inner[next].y);
    ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath();
    ctx.fillStyle = facetFills[i];
    ctx.fill();

    // Línea de arista divisoria
    ctx.beginPath();
    ctx.moveTo(outer[i].x, outer[i].y);
    ctx.lineTo(inner[i].x, inner[i].y);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = i >= 4 || i === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)';
    ctx.stroke();
  }

  // Mesa hexagonal central
  const table = ctx.createLinearGradient(-r, -r, r, r);
  table.addColorStop(0, shadeColor(color, 0.65));
  table.addColorStop(0.4, color);
  table.addColorStop(1, shadeColor(color, -0.32));
  ctx.fillStyle = table;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    if (i === 0) ctx.moveTo(inner[i].x, inner[i].y);
    else ctx.lineTo(inner[i].x, inner[i].y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();

  // Reflejo cáustico interno inferior
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(inner[2].x - 4, inner[2].y - 4);
  ctx.lineTo(inner[3].x, inner[3].y - 4);
  ctx.lineTo(inner[4].x + 4, inner[4].y - 4);
  ctx.closePath();
  ctx.fill();

  // Destello estelar
  drawSparkle(ctx, -13, -16, 7.5, 0.95);
}

/** 6. PERIDOTO (Estrella · Corte 3D Estelar con Aristas en Relieve) */
function drawStarGem(ctx, color) {
  const tips = [];
  const notches = [];

  for (let k = 0; k < 5; k++) {
    const aTip = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    tips.push({ x: Math.cos(aTip) * 51, y: Math.sin(aTip) * 51 });

    const aNotch = -Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / 5;
    notches.push({ x: Math.cos(aNotch) * 23, y: Math.sin(aNotch) * 23 });
  }

  // Iluminación facetada de las 10 facetas triangulares que convergen en el centro (0, 0)
  // Cada brazo se divide en:
  // - Cara izquierda (facing light): recibe luz directa.
  // - Cara derecha (in shadow): sombra de contraste.
  const leftFlankFills = [
    'rgba(255, 255, 255, 0.48)', // Brazo 0 (arriba)
    'rgba(255, 255, 255, 0.25)', // Brazo 1 (derecha arriba)
    'rgba(0, 0, 0, 0.12)',       // Brazo 2 (derecha abajo)
    'rgba(255, 255, 255, 0.18)', // Brazo 3 (izquierda abajo)
    'rgba(255, 255, 255, 0.42)'  // Brazo 4 (izquierda arriba)
  ];

  const rightFlankFills = [
    'rgba(0, 0, 0, 0.20)',       // Brazo 0
    'rgba(0, 0, 0, 0.32)',       // Brazo 1
    'rgba(0, 0, 0, 0.45)',       // Brazo 2
    'rgba(0, 0, 0, 0.28)',       // Brazo 3
    'rgba(0, 0, 0, 0.15)'        // Brazo 4
  ];

  for (let k = 0; k < 5; k++) {
    const prevNotch = notches[(k + 4) % 5];
    const tip = tips[k];
    const nextNotch = notches[k];

    // 1. Faceta izquierda del brazo
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(prevNotch.x, prevNotch.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.closePath();
    ctx.fillStyle = leftFlankFills[k];
    ctx.fill();

    // 2. Faceta derecha del brazo
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(nextNotch.x, nextNotch.y);
    ctx.closePath();
    ctx.fillStyle = rightFlankFills[k];
    ctx.fill();

    // Arista central en relieve de la punta al centro
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = k === 0 || k === 4 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();

    // Arista de valle hacia la hendidura
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(nextNotch.x, nextNotch.y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.stroke();
  }

  // Reflejo cáustico en el brazo inferior
  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  // Destello estelar en el ápice central
  drawSparkle(ctx, 0, 0, 8, 0.95);
  drawSparkle(ctx, tips[0].x * 0.4, tips[0].y * 0.4, 5, 0.8);
}

/* ============================================================
   Composición maestra de una gema
   ============================================================ */

/** Dibuja la gema completa con sombra de contacto, cuerpo cristalino, facetas y bisel */
function drawGem(ctx, style) {
  ctx.clearRect(0, 0, 128, 128);
  ctx.save();
  ctx.translate(64, 64);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Sombra de contacto adaptada a la silueta para profundidad realista en el tablero
  ctx.save();
  ctx.translate(1.5, 4.5);
  ctx.scale(1.02, 0.98);
  traceShape(ctx, style.shape);
  const shadowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 56);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();

  // 2. Fondo base cristalino de alta saturación y luminosidad
  traceShape(ctx, style.shape);
  const baseGrad = ctx.createRadialGradient(-16, -20, 4, 8, 12, 62);
  baseGrad.addColorStop(0, shadeColor(style.color, 0.85));
  baseGrad.addColorStop(0.22, shadeColor(style.color, 0.35));
  baseGrad.addColorStop(0.72, style.color);
  baseGrad.addColorStop(1, shadeColor(style.color, -0.38));
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // 3. Facetado geométrico propio de cada gema (recortado limpiamente a su forma)
  ctx.save();
  ctx.clip();

  switch (style.shape) {
    case 'circle':   drawCircleGem(ctx, style.color); break;
    case 'square':   drawSquareGem(ctx, style.color); break;
    case 'triangle': drawTriangleGem(ctx, style.color); break;
    case 'diamond':  drawDiamondGem(ctx, style.color); break;
    case 'hexagon':  drawHexagonGem(ctx, style.color); break;
    case 'star':     drawStarGem(ctx, style.color); break;
  }

  ctx.restore();

  // 4. Bisel exterior oscuro de alto contraste (garantiza silueta nítida en móviles y cualquier tema)
  traceShape(ctx, style.shape);
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = shadeColor(style.color, -0.52);
  ctx.stroke();

  // 5. Filete de luz interior para filo cristalino impecable
  traceShape(ctx, style.shape);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.stroke();

  ctx.restore();
}

/** Crea las texturas 'gem0'...'gemN' y 'spark' en el gestor de texturas de Phaser. */
function createGemTextures(scene) {
  const gemSize = GAME_CONFIG.GEM_TEXTURE_SIZE;
  const gemScale = gemSize / 128;
  const sparkSize = GAME_CONFIG.SPARK_TEXTURE_SIZE;

  GEM_STYLES.forEach((style, i) => {
    const key = 'gem' + i;
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, gemSize, gemSize);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(gemScale, gemScale);
    drawGem(ctx, style);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });

  // Chispa brillante de 4 puntas para partículas de explosión y combo
  if (!scene.textures.exists('spark')) {
    const tex = scene.textures.createCanvas('spark', sparkSize, sparkSize);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const cx = sparkSize / 2;
    const cy = sparkSize / 2;

    // Resplandor radial de fondo
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
    g.addColorStop(0.65, 'rgba(255, 255, 255, 0.2)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sparkSize, sparkSize);

    // Destello en cruz fina estelar para partículas deslumbrantes
    ctx.save();
    ctx.translate(cx, cy);
    drawSparkle(ctx, 0, 0, cx * 0.75, 0.95);
    ctx.restore();

    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
