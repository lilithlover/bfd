/* =============================================
   RUNE TRIBE - Retro Audio System
   Web Audio API synthesized sounds + chiptune music
   ============================================= */

const AudioSystem = (() => {
  let ctx = null;
  let sfxGain = null;
  let musicPlaying = false;
  let muted = false;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
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

  // --- MUSIC: MP3 playback ---
  let musicAudio = null;

  function startMusic() {
    if (musicPlaying || muted) return;
    musicPlaying = true;

    if (!musicAudio) {
      musicAudio = new Audio('assets/music.mp3');
      musicAudio.loop = true;
      musicAudio.volume = 0.3;
    }
    musicAudio.play().catch(() => {});
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicAudio) {
      musicAudio.pause();
      musicAudio.currentTime = 0;
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
