/* ============================================================
   audio.js · Efectos de sonido sintetizados con Web Audio
   No requiere archivos de audio ni descargas adicionales.
   ============================================================ */

const Sound = (() => {
  let context = null;
  let master = null;
  let muted = Store.get('muted', false);

  function ensure() {
    if (muted) return null;
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.28;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function tone(frequency, duration, options = {}) {
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + (options.delay || 0);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (options.toFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(options.toFrequency, start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function noise(duration = 0.08, volume = 0.05) {
    const ctx = ensure();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(master);
    source.start();
  }

  return {
    get muted() { return muted; },

    unlock() { ensure(); },

    setMuted(value) {
      muted = !!value;
      Store.set('muted', muted);
      if (muted && master) master.gain.setTargetAtTime(0.0001, context.currentTime, 0.02);
      if (!muted && master) master.gain.setTargetAtTime(0.28, context.currentTime, 0.02);
    },

    toggle() {
      this.setMuted(!muted);
      if (!muted) this.tap();
      return muted;
    },

    tap() { tone(420, 0.055, { type: 'sine', volume: 0.055, toFrequency: 520 }); },
    swap() { tone(260, 0.07, { type: 'triangle', volume: 0.07, toFrequency: 330 }); },
    invalid() {
      tone(150, 0.13, { type: 'sawtooth', volume: 0.07, toFrequency: 110 });
      noise(0.06, 0.025);
    },
    pop(combo) {
      const base = 420 + Math.min(combo, 6) * 55;
      tone(base, 0.12, { type: 'triangle', volume: 0.075, toFrequency: base * 1.25 });
      noise(0.055, 0.018);
    },
    combo(combo) {
      for (let i = 0; i < Math.min(combo, 5); i++) {
        tone(440 + i * 110, 0.16, { delay: i * 0.07, volume: 0.06, toFrequency: 520 + i * 110 });
      }
    },
    level() {
      [440, 554, 659, 880].forEach((f, i) => {
        tone(f, 0.28, { delay: i * 0.11, type: 'triangle', volume: 0.09 });
      });
    },
    reshuffle() {
      tone(180, 0.35, { type: 'triangle', volume: 0.07, toFrequency: 620 });
      tone(620, 0.22, { delay: 0.16, type: 'sine', volume: 0.06, toFrequency: 360 });
    }
  };
})();
