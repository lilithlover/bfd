/* =============================================
   RUNE TRIBE - Retro Audio System
   Web Audio API synthesized sounds + chiptune music
   ============================================= */

const AudioSystem = (() => {
  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicPlaying = false;
  let musicOscillators = [];
  let musicInterval = null;
  let muted = false;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.08;
    musicGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.15;
    sfxGain.connect(ctx.destination);
  }

  function ensureContext() {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();
  }

  // --- SFX ---
  function playTone(freq, duration, type = 'square', volume = 0.15) {
    ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function sfxSelect() {
    playTone(660, 0.08, 'square', 0.12);
    setTimeout(() => playTone(880, 0.08, 'square', 0.12), 50);
  }

  function sfxNavigate() {
    playTone(440, 0.06, 'square', 0.1);
  }

  function sfxBack() {
    playTone(330, 0.08, 'square', 0.1);
    setTimeout(() => playTone(220, 0.08, 'square', 0.1), 50);
  }

  function sfxError() {
    playTone(150, 0.15, 'sawtooth', 0.12);
    setTimeout(() => playTone(100, 0.2, 'sawtooth', 0.12), 100);
  }

  function sfxChat() {
    playTone(1200, 0.05, 'sine', 0.08);
    setTimeout(() => playTone(1500, 0.05, 'sine', 0.08), 60);
  }

  function sfxMention() {
    playTone(800, 0.06, 'square', 0.1);
    setTimeout(() => playTone(1000, 0.06, 'square', 0.1), 70);
    setTimeout(() => playTone(1200, 0.06, 'square', 0.1), 140);
  }

  function sfxStart() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.12, 'square', 0.1), i * 80);
    });
  }

  function sfxHover() {
    playTone(520, 0.03, 'square', 0.05);
  }

  // --- MUSIC: Dark chiptune loop ---
  // Minor key arpeggio pattern (horror arcade feel)
  const MUSIC_NOTES = [
    // Bar 1 - Am
    [220, 261, 330, 261],
    // Bar 2 - Dm
    [293, 349, 440, 349],
    // Bar 3 - Em
    [164, 196, 247, 196],
    // Bar 4 - Am (octave)
    [220, 330, 440, 330],
    // Bar 5 - F
    [174, 220, 261, 220],
    // Bar 6 - E
    [164, 207, 247, 207],
    // Bar 7 - Am low
    [110, 131, 165, 131],
    // Bar 8 - E resolve
    [164, 207, 330, 207],
  ];

  let musicStep = 0;
  let musicBar = 0;

  function startMusic() {
    if (musicPlaying || muted) return;
    ensureContext();
    musicPlaying = true;
    musicStep = 0;
    musicBar = 0;

    musicInterval = setInterval(() => {
      if (muted) return;
      const bar = MUSIC_NOTES[musicBar];
      const freq = bar[musicStep];

      // Lead
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);

      // Bass (one octave down, triangle wave)
      if (musicStep === 0) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'triangle';
        bass.frequency.setValueAtTime(freq / 2, ctx.currentTime);
        bassGain.gain.setValueAtTime(0.04, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        bass.connect(bassGain);
        bassGain.connect(musicGain);
        bass.start(ctx.currentTime);
        bass.stop(ctx.currentTime + 0.55);
      }

      musicStep++;
      if (musicStep >= bar.length) {
        musicStep = 0;
        musicBar = (musicBar + 1) % MUSIC_NOTES.length;
      }
    }, 180);
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (muted) {
      stopMusic();
    } else {
      startMusic();
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    init,
    sfxSelect,
    sfxNavigate,
    sfxBack,
    sfxError,
    sfxChat,
    sfxMention,
    sfxStart,
    sfxHover,
    startMusic,
    stopMusic,
    toggleMute,
    isMuted,
  };
})();
