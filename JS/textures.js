/* ============================================================
   textures.js · Dibuja las gemas con canvas 2D
   Cada gema: forma + color únicos, degradado y brillo.
   ============================================================ */

/** "#rrggbb" -> número 0xrrggbb */
function hexToInt(hex) {
  return parseInt(String(hex).trim().replace('#', ''), 16);
}

/** Aclara (amt>0) u oscurece (amt<0) un color "#rrggbb". */
function shadeColor(hex, amt) {
  const n = hexToInt(hex);
  const mix = (v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/** Traza el contorno de una forma centrada en (0,0). */
function traceShape(ctx, shape) {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      break;
    case 'square': {
      const s = 46, rad = 16;
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
    case 'triangle':
      ctx.moveTo(0, -48);
      ctx.lineTo(52, 40);
      ctx.lineTo(-52, 40);
      break;
    case 'diamond':
      ctx.moveTo(0, -56);
      ctx.lineTo(50, 0);
      ctx.lineTo(0, 56);
      ctx.lineTo(-50, 0);
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const x = Math.cos(a) * 52, y = Math.sin(a) * 52;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? 56 : 27;
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      break;
  }
  ctx.closePath();
}

/** Dibuja una gema completa en un contexto 2D de 128x128. */
function drawGem(ctx, style, options = {}) {
  const mobile = options.mobile === true;
  const highlightOpacity = mobile ? 0.42 : 0.68;
  const pointOpacity = mobile ? 0.72 : 0.92;
  const borderWidth = mobile ? 6 : 8;
  const facetStrength = mobile ? 0.72 : 1;
  ctx.clearRect(0, 0, 128, 128);
  ctx.save();
  ctx.translate(64, 64);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Sombra suave bajo la gema para darle volumen real.
  ctx.save();
  ctx.translate(3, 12);
  ctx.scale(1, 0.32);
  const shadow = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
  shadow.addColorStop(0, 'rgba(0,0,0,0.48)');
  shadow.addColorStop(0.65, 'rgba(0,0,0,0.22)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Resplandor exterior controlado por el color de cada gema.
  traceShape(ctx, style.shape);
  ctx.save();
  ctx.translate(0, 4);
  ctx.fillStyle = mobile ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.38)';
  ctx.fill();
  ctx.restore();

  // Cuerpo con luz radial y profundidad central.
  traceShape(ctx, style.shape);
  const grad = ctx.createRadialGradient(-24, -28, 2, 8, 12, 70);
  grad.addColorStop(0, mobile ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.09, shadeColor(style.color, 0.72));
  grad.addColorStop(0.38, shadeColor(style.color, 0.18));
  grad.addColorStop(0.76, style.color);
  grad.addColorStop(1, shadeColor(style.color, -0.48));
  ctx.fillStyle = grad;
  ctx.fill();

  // Facetas translúcidas que imitan cortes de cristal.
  ctx.save();
  ctx.clip();
  const facets = [
    { pts: [[-52, -42], [0, -58], [-10, -8]], fill: `rgba(255,255,255,${0.30 * facetStrength})` },
    { pts: [[0, -58], [52, -38], [10, -8]], fill: `rgba(255,255,255,${0.10 * facetStrength})` },
    { pts: [[52, -38], [54, 38], [10, 8]], fill: `rgba(0,0,0,${0.10 * facetStrength})` },
    { pts: [[54, 38], [0, 58], [10, 8]], fill: `rgba(255,255,255,${0.07 * facetStrength})` },
    { pts: [[0, 58], [-54, 38], [-10, 8]], fill: `rgba(0,0,0,${0.16 * facetStrength})` },
    { pts: [[-54, 38], [-52, -42], [-10, -8]], fill: `rgba(255,255,255,${0.12 * facetStrength})` },
    { pts: [[-10, -8], [10, -8], [10, 8], [-10, 8]], fill: `rgba(255,255,255,${0.18 * facetStrength})` }
  ];
  facets.forEach((facet) => {
    ctx.beginPath();
    facet.pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]));
    ctx.closePath();
    ctx.fillStyle = facet.fill;
    ctx.fill();
  });
  ctx.restore();

  // Borde oscuro y resaltado interior.
  traceShape(ctx, style.shape);
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = shadeColor(style.color, mobile ? -0.48 : -0.58);
  ctx.stroke();

  traceShape(ctx, style.shape);
  ctx.lineWidth = mobile ? 2 : 3;
  ctx.strokeStyle = mobile ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.48)';
  ctx.stroke();

  // Destello grande y punta de luz pequeña.
  ctx.fillStyle = `rgba(255,255,255,${highlightOpacity})`;
  ctx.beginPath();
  ctx.ellipse(-18, -26, 19, 8, -0.58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${pointOpacity})`;
  ctx.beginPath();
  ctx.arc(-27, -34, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Crea las texturas 'gem0'...'gemN' y 'spark' en el gestor de texturas de Phaser. */
function createGemTextures(scene) {
  const gemSize = GAME_CONFIG.GEM_TEXTURE_SIZE;
  const gemScale = gemSize / 128;
  const sparkSize = GAME_CONFIG.SPARK_TEXTURE_SIZE;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  GEM_STYLES.forEach((style, i) => {
    const key = 'gem' + i;
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, gemSize, gemSize);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(gemScale, gemScale);
    drawGem(ctx, style, { mobile });
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });

  // Chispa para partículas
  if (!scene.textures.exists('spark')) {
    const tex = scene.textures.createCanvas('spark', sparkSize, sparkSize);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const g = ctx.createRadialGradient(
      sparkSize / 2, sparkSize / 2, 0,
      sparkSize / 2, sparkSize / 2, sparkSize / 2
    );
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sparkSize, sparkSize);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
