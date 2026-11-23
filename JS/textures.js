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

/** Dibuja una gema nueva, limpia y nítida para pantallas móviles. */
function drawGem(ctx, style) {
  ctx.clearRect(0, 0, 128, 128);
  ctx.save();
  ctx.translate(64, 64);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Sombra corta y suave: evita bordes grises difusos al reducirse.
  ctx.save();
  ctx.translate(2, 9);
  ctx.scale(1, 0.24);
  const shadow = ctx.createRadialGradient(0, 0, 4, 0, 0, 54);
  shadow.addColorStop(0, 'rgba(0,0,0,0.32)');
  shadow.addColorStop(0.72, 'rgba(0,0,0,0.12)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Color principal con una luz superior suave y un borde oscuro compacto.
  traceShape(ctx, style.shape);
  const body = ctx.createRadialGradient(-20, -24, 3, 6, 10, 68);
  body.addColorStop(0, shadeColor(style.color, 0.88));
  body.addColorStop(0.22, shadeColor(style.color, 0.38));
  body.addColorStop(0.68, style.color);
  body.addColorStop(1, shadeColor(style.color, -0.28));
  ctx.fillStyle = body;
  ctx.fill();

  // Tres facetas grandes dan volumen sin crear ruido visual.
  ctx.save();
  ctx.clip();

  ctx.beginPath();
  ctx.moveTo(-52, -42);
  ctx.lineTo(0, -58);
  ctx.lineTo(-8, -4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(52, -38);
  ctx.lineTo(8, -4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(52, -38);
  ctx.lineTo(54, 38);
  ctx.lineTo(8, 8);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-54, 38);
  ctx.lineTo(-52, -42);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.restore();

  // Contorno limpio: exterior oscuro fino y brillo interior claro.
  traceShape(ctx, style.shape);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = shadeColor(style.color, -0.42);
  ctx.stroke();

  traceShape(ctx, style.shape);
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.stroke();

  // Un solo brillo pequeño y contenido evita el aspecto quemado.
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-20, -27, 13, 5.5, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.arc(-28, -35, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

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
