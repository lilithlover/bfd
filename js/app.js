/* =============================================
   RUNE TRIBE - Main Application v2
   Navigation, Members, Profile, Chat (cooldown),
   Effects System, Admin Panel
   ============================================= */

(function () {
  'use strict';

  /* ===== EFFECTS REGISTRY ===== */
  // { id, name, level (0=free, -1=admin only), css class }
  const EFFECTS = [
    // FREE (Level 0) - first 5
    { id: 'none',       name: 'NONE',        level: 0 },
    { id: 'glow',       name: 'GLOW',        level: 0 },
    { id: 'pulse',      name: 'PULSE',       level: 0 },
    { id: 'shadow',     name: 'SHADOW',      level: 0 },
    { id: 'flicker',    name: 'FLICKER',     level: 0 },
    { id: 'outline',    name: 'OUTLINE',     level: 0 },
    // LEVEL-GATED (35 effects)
    { id: 'neon',       name: 'NEON',        level: 3 },
    { id: 'ice',        name: 'ICE',         level: 5 },
    { id: 'fire',       name: 'FIRE',        level: 8 },
    { id: 'glitch',     name: 'GLITCH',      level: 10 },
    { id: 'radioactive',name: 'RADIOACTIVE', level: 12 },
    { id: 'phantom',    name: 'PHANTOM',     level: 15 },
    { id: 'lightning',  name: 'LIGHTNING',   level: 18 },
    { id: 'blood',      name: 'BLOOD',       level: 20 },
    { id: 'ember',      name: 'EMBER',       level: 22 },
    { id: 'toxic',      name: 'TOXIC',       level: 25 },
    { id: 'chrome',     name: 'CHROME',      level: 28 },
    { id: 'matrix',     name: 'MATRIX',      level: 30 },
    { id: 'voidfx',     name: 'VOID',        level: 33 },
    { id: 'thunder',    name: 'THUNDER',     level: 35 },
    { id: 'crystal',    name: 'CRYSTAL',     level: 38 },
    { id: 'magma',      name: 'MAGMA',       level: 40 },
    { id: 'spectrum',   name: 'SPECTRUM',    level: 42 },
    { id: 'storm',      name: 'STORM',       level: 45 },
    { id: 'inferno',    name: 'INFERNO',     level: 48 },
    { id: 'plasma',     name: 'PLASMA',      level: 50 },
    { id: 'eclipse',    name: 'ECLIPSE',     level: 53 },
    { id: 'cyber',      name: 'CYBER',       level: 55 },
    { id: 'frost',      name: 'FROST',       level: 58 },
    { id: 'nova',       name: 'NOVA',        level: 60 },
    { id: 'vortex',     name: 'VORTEX',      level: 63 },
    { id: 'demon',      name: 'DEMON',       level: 65 },
    { id: 'wraith',     name: 'WRAITH',      level: 68 },
    { id: 'titan',      name: 'TITAN',       level: 70 },
    { id: 'reaper',     name: 'REAPER',      level: 75 },
    { id: 'dragon',     name: 'DRAGON',      level: 80 },
    { id: 'celestial',  name: 'CELESTIAL',   level: 85 },
    { id: 'oblivion',   name: 'OBLIVION',    level: 90 },
    { id: 'eternal',    name: 'ETERNAL',     level: 95 },
    { id: 'supernova',  name: 'SUPERNOVA',   level: 98 },
    { id: 'god',        name: 'GOD',         level: 100 },
    // ADMIN-ONLY (-1)
    { id: 'divine',     name: 'DIVINE',      level: -1 },
    { id: 'corrupted',  name: 'CORRUPTED',   level: -1 },
    { id: 'ancient',    name: 'ANCIENT',     level: -1 },
    { id: 'overlord',   name: 'OVERLORD',    level: -1 },
    { id: 'omega',      name: 'OMEGA',       level: -1 },
  ];

  function getEffectClass(effectId) {
    return effectId && effectId !== 'none' ? 'fx-' + effectId : '';
  }

  function getAvailableEffects(level, isAdmin) {
    return EFFECTS.filter(e => {
      if (e.level === -1) return isAdmin;
      return e.level <= level;
    });
  }

  // Render avatar HTML - supports video/gif avatars with looping
  function renderAvatar(url, size) {
    if (!url) return '';
    const sizeStyle = size ? `width:${size}px;height:${size}px;` : 'width:100%;height:100%;';
    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
    if (isVideo) {
      return `<video src="${escapeHtml(url)}" autoplay loop muted playsinline style="${sizeStyle}object-fit:cover;"></video>`;
    }
    return `<img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover;image-rendering:pixelated;">`;
  }

  /* ===== ASCII VIDEO ENGINE ===== */
  const video = document.getElementById('video');
  const sourceCanvas = document.getElementById('source');
  const sourceCtx = sourceCanvas.getContext('2d');
  const asciiCanvas = document.getElementById('ascii-canvas');
  const asciiCtx = asciiCanvas.getContext('2d');
  const noVideo = document.getElementById('no-video');

  const CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const COLS = 150, CELL_W = 4, CELL_H = 6, BG_COLOR = '#000', WHITE_THRESHOLD = 245, FPS_TARGET = 12;
  let lastFrameTime = 0;

  function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function charForLuminance(lum) { return CHARS[Math.min(Math.floor((lum / 255) * CHARS.length), CHARS.length - 1)]; }
  function boostColor(r, g, b, lum) {
    const boost = 1.15, gray = lum;
    return [Math.min(255, Math.round(r * boost + (1 - boost) * gray)), Math.min(255, Math.round(g * boost + (1 - boost) * gray)), Math.min(255, Math.round(b * boost + (1 - boost) * gray))];
  }

  function processFrame() {
    if (video.readyState < 2) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const cellW = vw / COLS, cellH = cellW * (CELL_H / CELL_W), rows = Math.floor(vh / cellH);
    const outW = COLS * CELL_W, outH = rows * CELL_H;
    sourceCanvas.width = vw; sourceCanvas.height = vh;
    sourceCtx.drawImage(video, 0, 0);
    const data = sourceCtx.getImageData(0, 0, vw, vh).data;
    asciiCanvas.width = outW; asciiCanvas.height = outH;
    asciiCtx.fillStyle = BG_COLOR; asciiCtx.fillRect(0, 0, outW, outH);
    asciiCtx.font = `bold ${CELL_H}px "Consolas","Monaco","Courier New",monospace`;
    asciiCtx.textBaseline = 'top';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < COLS; col++) {
        const px = Math.floor(col * cellW + cellW / 2), py = Math.floor(row * cellH + cellH / 2);
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const sx = Math.min(vw - 1, Math.max(0, px + dx)), sy = Math.min(vh - 1, Math.max(0, py + dy));
          const i = (sy * vw + sx) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        r /= n; g /= n; b /= n;
        const lum = luminance(r, g, b);
        if (lum >= WHITE_THRESHOLD) continue;
        const [rr, gg, bb] = boostColor(r, g, b, lum);
        asciiCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
        asciiCtx.fillText(charForLuminance(lum), col * CELL_W, row * CELL_H);
      }
    }
  }

  function nextFrame(timestamp) {
    if (video.paused || video.ended) return;
    if (timestamp - lastFrameTime >= 1000 / FPS_TARGET) { lastFrameTime = timestamp; processFrame(); }
    requestAnimationFrame(nextFrame);
  }

  video.addEventListener('loadeddata', () => { asciiCanvas.style.display = 'block'; noVideo.style.display = 'none'; video.play().catch(() => {}); requestAnimationFrame(nextFrame); });
  video.addEventListener('error', () => { asciiCanvas.style.display = 'none'; noVideo.style.display = 'block'; });
  video.play().catch(() => {});

  /* ===== SCREEN NAVIGATION ===== */
  let currentScreen = 'screen-title';
  const hud = document.getElementById('player-hud');

  function switchScreen(fromId, toId) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (!from || !to) return;
    if (toId === 'screen-title' || (fromId !== 'screen-title' && toId === 'screen-nav')) {
      AudioSystem.sfxBack();
    } else {
      AudioSystem.sfxSelect();
    }
    from.classList.remove('visible');
    setTimeout(() => {
      from.classList.remove('active');
      to.classList.add('active');
      to.offsetHeight;
      to.classList.add('visible');
      hud.classList.toggle('show', toId !== 'screen-title');
      currentScreen = toId;
    }, 600);
  }

  // Press Start
  document.getElementById('press-start').addEventListener('click', () => {
    AudioSystem.init();
    AudioSystem.sfxSelect();
    setTimeout(() => AudioSystem.startMusic(), 400);
    switchScreen('screen-title', 'screen-nav');
  });

  // All clickable menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (!target) return;
      if (target === 'screen-chat' && !SupabaseClient.getUser()) {
        AudioSystem.sfxError(); showToast('LOGIN REQUIRED TO ACCESS CHAT'); return;
      }
      if (target === 'screen-chat') {
        switchHub(currentChannel);
        SupabaseClient.markMentionsRead();
        updateChatBadge(0);
      }
      switchScreen(currentScreen, target);
    });
    item.addEventListener('mouseenter', () => AudioSystem.sfxHover());
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) switchScreen(currentScreen, target);
    });
    btn.addEventListener('mouseenter', () => AudioSystem.sfxHover());
  });

  // Sound toggle
  document.getElementById('sound-toggle').addEventListener('click', () => {
    AudioSystem.init();
    const muted = AudioSystem.toggleMute();
    document.getElementById('sound-toggle').textContent = muted ? 'SOUND:OFF' : 'SOUND:ON';
    AudioSystem.sfxNavigate();
  });

  /* ===== TOAST ===== */
  function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  /* ===== AUTH TABS ===== */
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      AudioSystem.sfxNavigate();
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.form).classList.add('active');
    });
  });

  /* ===== AUTH: LOGIN ===== */
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('.auth-input');
    const email = inputs[0].value.trim();
    const password = inputs[1].value;
    if (!email || !password) { showToast('FILL ALL FIELDS'); AudioSystem.sfxError(); return; }
    try {
      await SupabaseClient.login(email, password);
      AudioSystem.sfxSelect();
      showToast('ACCESS GRANTED');
      inputs.forEach(i => i.value = '');
      switchScreen('screen-auth', 'screen-nav');
    } catch (err) {
      AudioSystem.sfxError();
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'ACCESS DENIED');
    }
  });

  /* ===== AUTH: REGISTER ===== */
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('.auth-input');
    const username = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const password = inputs[2].value;
    const confirm = inputs[3].value;
    if (!username || !email || !password) { showToast('FILL ALL FIELDS'); AudioSystem.sfxError(); return; }
    if (password !== confirm) { showToast('PASSWORDS DO NOT MATCH'); AudioSystem.sfxError(); return; }
    if (password.length < 6) { showToast('PASSWORD MIN 6 CHARACTERS'); AudioSystem.sfxError(); return; }
    if (username.length < 2 || username.length > 20) { showToast('USERNAME 2-20 CHARACTERS'); AudioSystem.sfxError(); return; }
    try {
      await SupabaseClient.register(email, password, username.toUpperCase());
      AudioSystem.sfxSelect();
      showToast('REGISTERED SUCCESSFULLY');
      inputs.forEach(i => i.value = '');
    } catch (err) {
      AudioSystem.sfxError();
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'REGISTRATION FAILED');
    }
  });

  /* ===== AUTH STATE ===== */
  let hasAutoResumed = false;
  SupabaseClient.setOnAuthChange((user, profile) => {
    updateHUD(user, profile);
    updateNavMenu(user, profile);
    updatePurgeBtn();

    // Auto-resume session: skip title screen if user is already logged in on page load
    if (user && profile && !hasAutoResumed && currentScreen === 'screen-title') {
      hasAutoResumed = true;
      AudioSystem.init();
      setTimeout(() => AudioSystem.startMusic(), 400);
      const titleEl = document.getElementById('screen-title');
      const navEl = document.getElementById('screen-nav');
      if (titleEl && navEl) {
        titleEl.classList.remove('visible');
        setTimeout(() => {
          titleEl.classList.remove('active');
          navEl.classList.add('active');
          navEl.offsetHeight;
          navEl.classList.add('visible');
          hud.classList.add('show');
          currentScreen = 'screen-nav';
        }, 300);
      }
    }
  });

  function updateNavMenu(user, profile) {
    const authItem = document.querySelector('[data-target="screen-auth"]');
    const adminLi = document.getElementById('admin-menu-li');
    const chatLi = document.getElementById('chat-menu-li');
    if (!authItem) return;

    if (user) {
      authItem.textContent = 'LOGOUT';
      authItem.dataset.target = '';
      authItem.onclick = async () => {
        await SupabaseClient.logout();
        authItem.textContent = 'LOGIN / REGISTER';
        authItem.dataset.target = 'screen-auth';
        authItem.onclick = null;
        AudioSystem.sfxBack();
        showToast('LOGGED OUT');
        updateHUD(null, null);
        updateNavMenu(null, null);
      };
    } else {
      authItem.textContent = 'LOGIN / REGISTER';
      authItem.dataset.target = 'screen-auth';
      authItem.onclick = null;
    }

    // Show/hide chat option (logged-in users only)
    if (chatLi) {
      chatLi.style.display = user ? '' : 'none';
    }

    // Show/hide admin panel option
    if (adminLi) {
      adminLi.style.display = (profile && profile.is_admin) ? '' : 'none';
    }
  }

  /* ===== PLAYER HUD ===== */
  function updateHUD(user, profile) {
    const hudContent = document.getElementById('hud-content');
    if (!user || !profile) {
      hudContent.innerHTML = '<span class="hud-guest">GUEST</span>';
      return;
    }
    const effect = getEffectClass(profile.name_effect);
    const idNum = profile.user_id_num ? ('#' + String(profile.user_id_num).padStart(4, '0')) : '#????';
    hudContent.innerHTML = `
      <div class="hud-avatar" id="hud-avatar-btn">
        ${profile.avatar_url
          ? renderAvatar(profile.avatar_url)
          : '<span class="hud-avatar-placeholder">?</span>'}
      </div>
      <div class="hud-info">
        <span class="hud-username ${effect}" style="color:${escapeHtml(profile.name_color)}">${escapeHtml(profile.username)}</span>
        <span class="hud-rank">${escapeHtml(profile.rank)} ${profile.is_admin ? '[ADMIN]' : ''}</span>
        <span class="hud-stats">LV.${profile.level} | $${profile.balance} | ${idNum}</span>
      </div>
    `;
    hudContent.onclick = () => openProfileEditor();
  }

  /* ===== PROFILE EDITOR ===== */
  function openProfileEditor() {
    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    AudioSystem.sfxSelect();

    const available = getAvailableEffects(profile.level, profile.is_admin);
    const effectSelect = document.getElementById('edit-effect');
    effectSelect.innerHTML = '';
    available.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      let label = e.name;
      if (e.level === -1) label += ' [ADMIN]';
      else if (e.level > 0) label += ` (LV.${e.level})`;
      opt.textContent = label;
      if (e.id === profile.name_effect) opt.selected = true;
      effectSelect.appendChild(opt);
    });

    document.getElementById('edit-color').value = profile.name_color || '#e02020';
    const preview = document.getElementById('edit-preview-name');
    preview.textContent = profile.username;
    preview.style.color = profile.name_color;
    preview.className = 'edit-preview-name ' + getEffectClass(profile.name_effect);

    const avatarPreview = document.getElementById('edit-avatar-preview');
    avatarPreview.innerHTML = profile.avatar_url
      ? renderAvatar(profile.avatar_url)
      : '<span class="hud-avatar-placeholder">?</span>';

    const idNum = profile.user_id_num ? ('#' + String(profile.user_id_num).padStart(4, '0')) : '#????';
    const created = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
    document.getElementById('edit-info').innerHTML = `
      <span class="profile-detail"><span class="label">USER ID:</span> ${idNum}</span>
      <span class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(profile.rank)}</span>
      <span class="profile-detail"><span class="label">LEVEL:</span> ${profile.level} / 100</span>
      <span class="profile-detail"><span class="label">BALANCE:</span> $${profile.balance}</span>
      <span class="profile-detail"><span class="label">JOINED:</span> ${created}</span>
      ${profile.is_admin ? '<span class="profile-detail"><span class="label">STATUS:</span> ADMINISTRATOR</span>' : ''}
    `;

    switchScreen(currentScreen, 'screen-editor');
  }

  document.getElementById('edit-color').addEventListener('input', (e) => {
    document.getElementById('edit-preview-name').style.color = e.target.value;
  });
  document.getElementById('edit-effect').addEventListener('change', (e) => {
    const preview = document.getElementById('edit-preview-name');
    preview.className = 'edit-preview-name ' + getEffectClass(e.target.value);
  });
  document.getElementById('edit-avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('MAX 2MB'); return; }

    // Only admins can upload video/gif avatars
    const isAnimated = file.type === 'image/gif' || file.type.startsWith('video/');
    if (isAnimated && !SupabaseClient.isAdmin()) {
      showToast('ONLY ADMINS CAN USE GIF/VIDEO AVATARS');
      AudioSystem.sfxError();
      return;
    }

    try {
      showToast('UPLOADING...');
      const url = await SupabaseClient.uploadAvatar(file);
      if (file.type.startsWith('video/')) {
        document.getElementById('edit-avatar-preview').innerHTML = `<video src="${escapeHtml(url)}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
      } else {
        document.getElementById('edit-avatar-preview').innerHTML = `<img src="${escapeHtml(url)}" alt="Avatar">`;
      }
      showToast('AVATAR UPDATED'); AudioSystem.sfxSelect();
    } catch (err) { AudioSystem.sfxError(); showToast('UPLOAD FAILED'); }
  });
  document.getElementById('edit-save').addEventListener('click', async () => {
    try {
      await SupabaseClient.updateProfile({
        name_color: document.getElementById('edit-color').value,
        name_effect: document.getElementById('edit-effect').value,
      });
      AudioSystem.sfxSelect(); showToast('PROFILE SAVED');
      switchScreen('screen-editor', 'screen-nav');
    } catch (err) { AudioSystem.sfxError(); showToast('SAVE FAILED'); }
  });

  /* ===== CHAT ===== */
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');
  const mentionSuggestions = document.getElementById('mention-suggestions');
  let chatLoaded = false;
  let chatSubscribed = false; // true once realtime subscriptions are set up
  let currentChannel = 'general';
  let cachedUsers = []; // for @mention autocomplete
  let mentionSelIndex = -1;

  // Hub metadata
  const HUBS = {
    general:  { name: 'GENERAL',  icon: '\u25C6', desc: 'Main chat for the tribe' },
    music:    { name: 'MUSIC',    icon: '\u266B', desc: 'Talk about music, beats, production' },
    trading:  { name: 'TRADING',  icon: '\u2605', desc: 'Trade effects, items, and more' },
    offtopic: { name: 'OFF-TOPIC', icon: '\u263C', desc: 'Anything goes' },
  };

  // Hub unread tracking
  const hubUnread = { general: 0, music: 0, trading: 0, offtopic: 0 };

  // Cooldown state
  let lastMsgTime = 0;
  let recentMessages = [];
  let spamCooldownUntil = 0;

  const COOLDOWN_MS = 5000;
  const SPAM_REPEAT_LIMIT = 3;
  const SPAM_COOLDOWN_MS = 15000;
  const SPAM_MUTE_OFFENSES = 3;
  let spamOffenseCount = 0;

  const RETRO_EMOJIS = {
    ':skull:': '\u2620', ':heart:': '\u2665', ':star:': '\u2605', ':sword:': '\u2694',
    ':lightning:': '\u26A1', ':moon:': '\u263E', ':sun:': '\u2600', ':crown:': '\u265B',
    ':music:': '\u266B', ':fire:': '\u2739', ':check:': '\u2714', ':x:': '\u2718',
    ':arrow:': '\u25BA', ':diamond:': '\u25C6', ':circle:': '\u25CF', ':square:': '\u25A0',
    ':triangle:': '\u25B2', ':wave:': '\u223F', ':eye:': '\u25C9', ':skull2:': '\u2623',
  };

  // Chat commands
  const CHAT_COMMANDS = {
    '/help': () => {
      addSystemMessage('COMMANDS: /me [action] \u2022 /roll [max] \u2022 /shrug \u2022 /tableflip \u2022 /lenny \u2022 /disapproval \u2022 /help');
      return null;
    },
    '/shrug': () => '\u00AF\\_(\u30C4)_/\u00AF',
    '/tableflip': () => '(\u256F\u00B0\u25A1\u00B0)\u256F\uFE35 \u253B\u2501\u253B',
    '/lenny': () => '( \u0361\u00B0 \u035C\u0296 \u0361\u00B0)',
    '/disapproval': () => '\u0CA0_\u0CA0',
  };

  function parseEmojis(text) {
    let result = escapeHtml(text);
    for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
      result = result.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `<span class="retro-emoji">${emoji}</span>`);
    }
    result = result.replace(/@(\w+)/g, '<span class="chat-mention" data-user="$1">@$1</span>');
    return result;
  }

  function renderMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.dataset.msgId = msg.id;
    const p = msg.profiles;
    const effect = p ? getEffectClass(p.name_effect) : '';
    const color = p ? p.name_color : '#aaa';
    const username = p ? p.username : 'UNKNOWN';
    const avatarUrl = p ? p.avatar_url : '';
    const idNum = p && p.user_id_num ? ('#' + String(p.user_id_num).padStart(4, '0')) : '';
    const adminTag = p && p.is_admin ? '<span class="chat-admin-tag">[ADMIN]</span>' : '';
    const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Check if it's an action message (/me)
    const isAction = msg.content.startsWith('/me ');
    const content = isAction ? msg.content.slice(4) : msg.content;
    const textClass = isAction ? 'chat-text chat-cmd-msg' : 'chat-text';

    div.innerHTML = `
      <div class="chat-msg-avatar">
        ${avatarUrl
          ? renderAvatar(avatarUrl)
          : '<span class="chat-msg-avatar-placeholder">\u25C9</span>'}
      </div>
      <div class="chat-msg-body">
        <div class="chat-msg-header">
          <span class="chat-user ${effect}" style="color:${escapeHtml(color)}" data-username="${escapeHtml(username)}">${escapeHtml(username)}</span>
          <span class="chat-id">${idNum}</span>
          ${adminTag}
          <span class="chat-time">${time}</span>
        </div>
        <span class="${textClass}">${isAction ? `* ${escapeHtml(username)} ${parseEmojis(content)}` : parseEmojis(content)}</span>
      </div>
    `;

    // Click username to show profile popup
    const userSpan = div.querySelector('.chat-user');
    if (userSpan && msg.user_id) {
      userSpan.addEventListener('click', () => {
        showUserPopup(msg.user_id, username);
      });
    }

    // Click @mention in message to show their profile popup
    div.querySelectorAll('.chat-mention').forEach(m => {
      m.addEventListener('click', () => {
        const mentionedName = m.dataset.user;
        if (mentionedName) {
          const found = cachedUsers.find(u => u.username.toLowerCase() === mentionedName.toLowerCase());
          if (found) {
            showUserPopup(found.id, found.username);
          } else {
            chatInput.value += '@' + mentionedName + ' ';
            chatInput.focus();
          }
        }
      });
    });

    return div;
  }

  function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-system';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- Hub switching ---
  function switchHub(channel) {
    if (channel === currentChannel && chatLoaded) return;
    currentChannel = channel;
    const hub = HUBS[channel];

    // Update sidebar active state
    document.querySelectorAll('.chat-hub-item').forEach(item => {
      item.classList.toggle('active', item.dataset.channel === channel);
    });

    // Update header
    document.getElementById('chat-header-icon')?.remove();
    const headerIcon = document.querySelector('.chat-header-icon');
    if (headerIcon) headerIcon.textContent = hub.icon;
    document.getElementById('chat-header-name').textContent = hub.name;
    document.getElementById('chat-header-desc').textContent = hub.desc;

    // Clear unread for this hub
    hubUnread[channel] = 0;
    updateHubUnreadBadges();

    // Reload messages for this channel
    chatLoaded = false;
    loadChat();
    AudioSystem.sfxNavigate();
  }

  function updateHubUnreadBadges() {
    document.querySelectorAll('.chat-hub-item').forEach(item => {
      const ch = item.dataset.channel;
      const badge = item.querySelector('.hub-unread');
      if (badge) {
        if (hubUnread[ch] > 0 && ch !== currentChannel) {
          badge.textContent = hubUnread[ch];
          badge.classList.add('show');
        } else {
          badge.classList.remove('show');
        }
      }
    });
  }

  // Wire up hub clicks
  document.querySelectorAll('.chat-hub-item').forEach(item => {
    item.addEventListener('click', () => switchHub(item.dataset.channel));
  });

  async function loadChat() {
    if (chatLoaded) return;
    chatLoaded = true;

    // One-time setup: subscriptions, user cache, DMs
    if (!chatSubscribed) {
      chatSubscribed = true;

      // Subscribe to ALL messages (filter by channel client-side)
      SupabaseClient.subscribeChat((msg) => {
        const msgChannel = msg.channel || 'general';
        if (msgChannel === currentChannel) {
          chatMessages.appendChild(renderMessage(msg));
          chatMessages.scrollTop = chatMessages.scrollHeight;
          AudioSystem.sfxChat();
        } else {
          // Unread badge for other hub
          if (hubUnread[msgChannel] !== undefined) {
            hubUnread[msgChannel]++;
            updateHubUnreadBadges();
          }
        }
      });

      // Load cached users for @mention autocomplete
      try {
        cachedUsers = await SupabaseClient.fetchAllProfiles(100);
      } catch (e) { cachedUsers = []; }

      // Load DM conversations
      loadDMList();

      // Subscribe to DMs
      try {
        SupabaseClient.subscribeDMs((dm) => {
          const user = SupabaseClient.getUser();
          if (!user) return;
          const partnerId = dm.from_user_id === user.id ? dm.to_user_id : dm.from_user_id;

          // If DM panel is open for this partner, show message
          if (activeDMPartner === partnerId) {
            appendDMMessage(dm);
            // Mark as read
            if (dm.to_user_id === user.id) SupabaseClient.markDMsRead(dm.from_user_id);
          }
          // Refresh DM list
          loadDMList();
          if (dm.to_user_id === user.id) AudioSystem.sfxMention();
        });
      } catch (e) { /* DM subscription failed - table may not exist */ }

      // Online count (estimate from cached users)
      updateOnlineCount();
    }

    // Load messages for current channel
    try {
      const messages = await SupabaseClient.fetchMessages(50, currentChannel);
      chatMessages.innerHTML = '';
      if (messages.length === 0) {
        addSystemMessage('NO MESSAGES YET. BE THE FIRST TO SPEAK.');
      } else {
        messages.forEach(msg => chatMessages.appendChild(renderMessage(msg)));
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      chatMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD MESSAGES</div>';
    }
  }

  function updateOnlineCount() {
    const el = document.getElementById('chat-online-count');
    if (el) {
      const count = Math.max(1, cachedUsers.length);
      el.innerHTML = `<span class="chat-online-dot"></span><span>${count} MEMBERS</span>`;
    }
  }

  // --- Admin Purge Channel ---
  const purgeBtn = document.getElementById('chat-purge-btn');
  function updatePurgeBtn() {
    if (purgeBtn) {
      purgeBtn.style.display = SupabaseClient.isAdmin() ? '' : 'none';
    }
  }
  if (purgeBtn) {
    purgeBtn.addEventListener('click', async () => {
      if (!SupabaseClient.isAdmin()) return;
      if (!confirm('PURGE ALL MESSAGES IN ' + (HUBS[currentChannel]?.name || currentChannel).toUpperCase() + '? THIS CANNOT BE UNDONE.')) return;
      try {
        await SupabaseClient.adminPurgeChannel(currentChannel);
        chatMessages.innerHTML = '';
        addSystemMessage('CHANNEL PURGED BY ADMIN');
        showToast('CHANNEL PURGED');
        AudioSystem.sfxSelect();
      } catch (err) {
        showToast('PURGE FAILED');
        AudioSystem.sfxError();
      }
    });
  }

  // --- Cooldown ---
  function checkCooldown(content) {
    const now = Date.now();
    if (spamCooldownUntil > now) {
      const secs = Math.ceil((spamCooldownUntil - now) / 1000);
      showToast(`SPAM COOLDOWN: ${secs}S`);
      AudioSystem.sfxError();
      return false;
    }
    if (now - lastMsgTime < COOLDOWN_MS) {
      const secs = Math.ceil((COOLDOWN_MS - (now - lastMsgTime)) / 1000);
      showToast(`WAIT ${secs}S`);
      AudioSystem.sfxError();
      return false;
    }
    const trimmed = content.trim().toLowerCase();
    recentMessages.push({ time: now, content: trimmed });
    recentMessages = recentMessages.filter(m => now - m.time < 60000);
    const repeatCount = recentMessages.filter(m => m.content === trimmed).length;
    if (repeatCount >= SPAM_REPEAT_LIMIT) {
      spamOffenseCount++;
      if (spamOffenseCount >= SPAM_MUTE_OFFENSES) {
        SupabaseClient.updateProfile({ is_muted: true, muted_until: new Date(now + 30 * 60000).toISOString() }).catch(() => {});
        showToast('MUTED FOR 30 MINUTES (SPAM)');
        spamCooldownUntil = now + 30 * 60000;
      } else {
        spamCooldownUntil = now + SPAM_COOLDOWN_MS;
        showToast(`REPEATED TEXT - ${SPAM_COOLDOWN_MS / 1000}S COOLDOWN`);
      }
      AudioSystem.sfxError();
      return false;
    }
    return true;
  }

  // --- Send message with command support ---
  async function sendChatMessage() {
    const content = chatInput.value.trim();
    if (!content) return;
    hideMentionSuggestions();

    // Handle commands
    if (content.startsWith('/')) {
      const parts = content.split(' ');
      const cmd = parts[0].toLowerCase();

      // /help
      if (cmd === '/help') {
        CHAT_COMMANDS['/help']();
        chatInput.value = '';
        return;
      }

      // /roll [max]
      if (cmd === '/roll') {
        const max = parseInt(parts[1]) || 100;
        const roll = Math.floor(Math.random() * max) + 1;
        const profile = SupabaseClient.getProfile();
        const name = profile ? profile.username : 'USER';
        addSystemMessage(`\u2605 ${name} rolled ${roll} (1-${max})`);
        chatInput.value = '';
        AudioSystem.sfxSelect();
        return;
      }

      // Text replacement commands
      const textCmd = CHAT_COMMANDS[cmd];
      if (textCmd && cmd !== '/help') {
        const result = textCmd();
        if (result) {
          if (!checkCooldown(result)) return;
          chatInput.value = '';
          lastMsgTime = Date.now();
          try { await SupabaseClient.sendMessage(result, currentChannel); }
          catch (err) { showToast('SEND FAILED'); AudioSystem.sfxError(); }
        }
        return;
      }

      // /me action
      if (cmd === '/me' && parts.length > 1) {
        if (!checkCooldown(content)) return;
        chatInput.value = '';
        lastMsgTime = Date.now();
        try { await SupabaseClient.sendMessage(content, currentChannel); }
        catch (err) { showToast('SEND FAILED'); AudioSystem.sfxError(); }
        return;
      }
    }

    // Regular message
    if (!checkCooldown(content)) return;
    chatInput.value = '';
    lastMsgTime = Date.now();
    try {
      await SupabaseClient.sendMessage(content, currentChannel);
    } catch (err) {
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'SEND FAILED');
      AudioSystem.sfxError();
    }
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    // Handle mention suggestion navigation
    if (mentionSuggestions.classList.contains('show')) {
      const items = mentionSuggestions.querySelectorAll('.mention-suggestion');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        mentionSelIndex = Math.min(mentionSelIndex + 1, items.length - 1);
        updateMentionSelection(items);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        mentionSelIndex = Math.max(mentionSelIndex - 1, 0);
        updateMentionSelection(items);
        return;
      }
      if ((e.key === 'Tab' || e.key === 'Enter') && mentionSelIndex >= 0 && items[mentionSelIndex]) {
        e.preventDefault();
        selectMention(items[mentionSelIndex].dataset.username);
        return;
      }
      if (e.key === 'Escape') {
        hideMentionSuggestions();
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  // --- @Mention autocomplete ---
  chatInput.addEventListener('input', () => {
    const val = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const textBefore = val.slice(0, cursorPos);

    // Find the @mention being typed
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const matches = cachedUsers.filter(u =>
        u.username.toLowerCase().includes(query)
      ).slice(0, 6);

      if (matches.length > 0) {
        showMentionSuggestions(matches);
      } else {
        hideMentionSuggestions();
      }
    } else {
      hideMentionSuggestions();
    }
  });

  function showMentionSuggestions(users) {
    mentionSelIndex = 0;
    mentionSuggestions.innerHTML = '';
    users.forEach((u, i) => {
      const div = document.createElement('div');
      div.className = 'mention-suggestion' + (i === 0 ? ' selected' : '');
      div.dataset.username = u.username;
      const effect = getEffectClass(u.name_effect);
      div.innerHTML = `
        <span class="mention-av">${u.avatar_url
          ? renderAvatar(u.avatar_url)
          : '<span style="color:#333;font-size:.25rem;">\u25C9</span>'}</span>
        <span class="${effect}" style="color:${escapeHtml(u.name_color)}">${escapeHtml(u.username)}</span>
        ${u.is_admin ? '<span style="color:#e02020;font-size:.7em;">[A]</span>' : ''}
      `;
      div.addEventListener('click', () => selectMention(u.username));
      mentionSuggestions.appendChild(div);
    });
    mentionSuggestions.classList.add('show');
  }

  function hideMentionSuggestions() {
    mentionSuggestions.classList.remove('show');
    mentionSelIndex = -1;
  }

  function updateMentionSelection(items) {
    items.forEach((item, i) => item.classList.toggle('selected', i === mentionSelIndex));
  }

  function selectMention(username) {
    const val = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const textAfter = val.slice(cursorPos);
    const newBefore = textBefore.replace(/@\w*$/, '@' + username + ' ');
    chatInput.value = newBefore + textAfter;
    chatInput.focus();
    chatInput.selectionStart = chatInput.selectionEnd = newBefore.length;
    hideMentionSuggestions();
  }

  // --- Emoji picker ---
  const emojiBtn = document.getElementById('emoji-toggle');
  const emojiPicker = document.getElementById('emoji-picker');
  emojiBtn.addEventListener('click', () => { AudioSystem.sfxNavigate(); emojiPicker.classList.toggle('show'); });
  for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
    const btn = document.createElement('span');
    btn.className = 'emoji-option';
    btn.textContent = emoji;
    btn.title = code;
    btn.addEventListener('click', () => { chatInput.value += code; chatInput.focus(); emojiPicker.classList.remove('show'); AudioSystem.sfxNavigate(); });
    emojiPicker.appendChild(btn);
  }

  // Dismiss mention suggestions & emoji picker when clicking outside
  document.addEventListener('click', (e) => {
    if (mentionSuggestions.classList.contains('show') &&
        !mentionSuggestions.contains(e.target) &&
        e.target !== chatInput) {
      hideMentionSuggestions();
    }
    if (emojiPicker.classList.contains('show') &&
        !emojiPicker.contains(e.target) &&
        e.target !== emojiBtn) {
      emojiPicker.classList.remove('show');
    }
  });

  // --- Chat badge (mentions) ---
  function updateChatBadge(count) {
    const badge = document.getElementById('chat-badge');
    if (count > 0) { badge.textContent = '+' + count; badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
  }
  SupabaseClient.setOnMentionUpdate(updateChatBadge);

  // --- DM System ---
  let activeDMPartner = null;
  const dmPanel = document.getElementById('dm-panel');
  const dmOverlay = document.getElementById('dm-panel-overlay');
  const dmMessages = document.getElementById('dm-panel-messages');
  const dmInput = document.getElementById('dm-panel-input');
  const dmSendBtn = document.getElementById('dm-panel-send');
  const dmSearchModal = document.getElementById('dm-search-modal');
  const dmSearchInput = document.getElementById('dm-search-input');
  const dmSearchResults = document.getElementById('dm-search-results');

  async function loadDMList() {
    const list = document.getElementById('chat-dm-list');
    if (!list) return;
    try {
      const convos = await SupabaseClient.fetchDMConversations();
      list.innerHTML = '';
      convos.forEach(c => {
        const li = document.createElement('li');
        li.className = 'chat-dm-item' + (activeDMPartner === c.partnerId ? ' active' : '');
        const partner = c.partner;
        li.innerHTML = `
          <span class="dm-avatar">${partner && partner.avatar_url
            ? renderAvatar(partner.avatar_url)
            : '<span style="color:#333;font-size:.2rem;">\u25C9</span>'}</span>
          <span>${escapeHtml(partner ? partner.username : 'USER')}</span>
          <span class="dm-unread${c.unread > 0 ? ' show' : ''}"></span>
        `;
        li.addEventListener('click', () => {
          openDMPanel(c.partnerId, partner ? partner.username : 'USER');
          AudioSystem.sfxNavigate();
        });
        list.appendChild(li);
      });
    } catch (e) { /* silently fail */ }
  }

  async function openDMPanel(partnerId, partnerName) {
    activeDMPartner = partnerId;
    document.getElementById('dm-panel-name').textContent = '\u2709 ' + escapeHtml(partnerName);
    dmMessages.innerHTML = '<div class="chat-system">LOADING...</div>';
    dmPanel.classList.add('show');
    dmOverlay.classList.add('show');

    try {
      await SupabaseClient.markDMsRead(partnerId);
      const messages = await SupabaseClient.fetchDMsWith(partnerId, 50);
      dmMessages.innerHTML = '';
      if (messages.length === 0) {
        dmMessages.innerHTML = '<div class="chat-system">NO MESSAGES YET</div>';
      } else {
        messages.forEach(dm => appendDMMessage(dm));
      }
      dmMessages.scrollTop = dmMessages.scrollHeight;
    } catch (e) {
      dmMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD</div>';
    }

    loadDMList();
    dmInput.focus();
  }

  function appendDMMessage(dm) {
    const user = SupabaseClient.getUser();
    if (!user) return;
    const isSent = dm.from_user_id === user.id;
    const div = document.createElement('div');
    div.className = 'dm-msg ' + (isSent ? 'sent' : 'received');
    const time = new Date(dm.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    div.innerHTML = `
      <div class="dm-msg-content">
        <div class="dm-msg-bubble">${parseEmojis(dm.content)}</div>
        <span class="dm-msg-time">${time}</span>
      </div>
    `;
    dmMessages.appendChild(div);
    dmMessages.scrollTop = dmMessages.scrollHeight;
  }

  function closeDMPanel() {
    activeDMPartner = null;
    dmPanel.classList.remove('show');
    dmOverlay.classList.remove('show');
    AudioSystem.sfxBack();
  }

  document.getElementById('dm-panel-close').addEventListener('click', closeDMPanel);
  dmOverlay.addEventListener('click', () => {
    // Close search modal if open
    if (dmSearchModal.classList.contains('show')) {
      dmSearchModal.classList.remove('show');
    }
    // Close DM panel if open
    if (dmPanel.classList.contains('show')) {
      closeDMPanel();
      return;
    }
    // If neither panel was open, just hide overlay
    dmOverlay.classList.remove('show');
  });

  async function sendDM() {
    const content = dmInput.value.trim();
    if (!content || !activeDMPartner) return;
    dmInput.value = '';
    try {
      await SupabaseClient.sendDM(activeDMPartner, content);
    } catch (err) {
      showToast('DM FAILED');
      AudioSystem.sfxError();
    }
  }

  dmSendBtn.addEventListener('click', sendDM);
  dmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendDM(); }
  });

  // --- New DM search ---
  document.getElementById('chat-dm-new').addEventListener('click', () => {
    dmSearchModal.classList.add('show');
    dmOverlay.classList.add('show');
    dmSearchInput.value = '';
    dmSearchResults.innerHTML = '';
    dmSearchInput.focus();
    AudioSystem.sfxNavigate();
  });

  let dmSearchTimeout;
  dmSearchInput.addEventListener('input', () => {
    clearTimeout(dmSearchTimeout);
    dmSearchTimeout = setTimeout(async () => {
      const q = dmSearchInput.value.trim();
      if (!q) { dmSearchResults.innerHTML = ''; return; }
      const users = await SupabaseClient.searchUsers(q, 8);
      const currentUserId = SupabaseClient.getUser()?.id;
      dmSearchResults.innerHTML = '';
      users.filter(u => u.id !== currentUserId).forEach(u => {
        const div = document.createElement('div');
        div.className = 'dm-search-result';
        div.innerHTML = `
          <span class="dm-avatar" style="width:16px;height:16px;border:1px solid #330000;overflow:hidden;display:flex;align-items:center;justify-content:center;">
            ${u.avatar_url ? renderAvatar(u.avatar_url) : '<span style="color:#333;font-size:.2rem;">\u25C9</span>'}
          </span>
          <span style="color:${escapeHtml(u.name_color)}">${escapeHtml(u.username)}</span>
          ${u.is_admin ? '<span style="color:#e02020;font-size:.7em;">[A]</span>' : ''}
        `;
        div.addEventListener('click', () => {
          dmSearchModal.classList.remove('show');
          openDMPanel(u.id, u.username);
          AudioSystem.sfxSelect();
        });
        dmSearchResults.appendChild(div);
      });
      if (users.filter(u => u.id !== currentUserId).length === 0) {
        dmSearchResults.innerHTML = '<div class="chat-system">NO USERS FOUND</div>';
      }
    }, 300);
  });


  /* ===== ADMIN PANEL ===== */
  const adminUserList = document.getElementById('admin-user-list');
  const adminSearch = document.getElementById('admin-search');
  const adminDetail = document.getElementById('admin-detail');
  let adminSelectedUser = null;
  let adminAllUsers = [];

  // Admin tab switching
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      AudioSystem.sfxNavigate();
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('admin-tab-' + btn.dataset.adminTab)?.classList.add('active');
      // Load tab data
      if (btn.dataset.adminTab === 'messages') loadAdminMessages();
      if (btn.dataset.adminTab === 'stats') loadAdminStats();
    });
  });

  // Open admin panel
  document.querySelector('[data-target="screen-admin"]')?.addEventListener('click', () => {
    if (!SupabaseClient.isAdmin()) return;
    loadAdminUsers();
  });

  async function loadAdminUsers(search = '') {
    if (!SupabaseClient.isAdmin()) return;
    try {
      const users = await SupabaseClient.adminFetchAllUsers(search);
      adminAllUsers = users;
      adminUserList.innerHTML = '';
      users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'admin-user-row';
        const idNum = u.user_id_num ? ('#' + String(u.user_id_num).padStart(4, '0')) : '#????';
        let flags = '';
        if (u.is_admin) flags += ' [A]';
        if (u.is_banned) flags += ' [BANNED]';
        if (u.is_muted) flags += ' [MUTED]';
        div.innerHTML = `<span class="admin-user-id">${idNum}</span> <span class="admin-user-name">${escapeHtml(u.username)}</span><span class="admin-flags">${flags}</span>`;
        div.addEventListener('click', () => { selectAdminUser(u); AudioSystem.sfxNavigate(); });
        adminUserList.appendChild(div);
      });
    } catch (err) {
      adminUserList.innerHTML = '<div class="chat-system">FAILED TO LOAD USERS</div>';
    }
  }

  if (adminSearch) {
    let searchTimeout;
    adminSearch.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => loadAdminUsers(adminSearch.value.trim()), 300);
    });
  }

  function selectAdminUser(user) {
    adminSelectedUser = user;
    const idNum = user.user_id_num ? ('#' + String(user.user_id_num).padStart(4, '0')) : '#????';
    const created = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
    const muteInfo = user.is_muted && user.muted_until
      ? `UNTIL ${new Date(user.muted_until).toLocaleString()}`
      : (user.is_muted ? 'YES' : 'NO');

    adminDetail.innerHTML = `
      <div class="admin-detail-header">${escapeHtml(user.username)} ${idNum}</div>
      <div class="admin-detail-info">
        <span class="profile-detail"><span class="label">UUID:</span> ${user.id.slice(0, 8)}...</span>
        <span class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(user.rank)}</span>
        <span class="profile-detail"><span class="label">LEVEL:</span> ${user.level}</span>
        <span class="profile-detail"><span class="label">BALANCE:</span> $${user.balance}</span>
        <span class="profile-detail"><span class="label">EFFECT:</span> ${escapeHtml(user.name_effect)}</span>
        <span class="profile-detail"><span class="label">ADMIN:</span> ${user.is_admin ? 'YES' : 'NO'}</span>
        <span class="profile-detail"><span class="label">BANNED:</span> ${user.is_banned ? 'YES' : 'NO'}</span>
        <span class="profile-detail"><span class="label">MUTED:</span> ${muteInfo}</span>
        <span class="profile-detail"><span class="label">JOINED:</span> ${created}</span>
      </div>
      <div class="admin-actions">
        <button class="admin-btn ${user.is_banned ? 'active' : ''}" data-action="ban">${user.is_banned ? 'UNBAN' : 'BAN'}</button>
        <button class="admin-btn ${user.is_muted ? 'active' : ''}" data-action="mute">${user.is_muted ? 'UNMUTE' : 'MUTE 30M'}</button>
        <button class="admin-btn" data-action="mute-1h">MUTE 1H</button>
        <button class="admin-btn" data-action="mute-24h">MUTE 24H</button>
        <button class="admin-btn" data-action="admin">${user.is_admin ? 'REMOVE ADMIN' : 'MAKE ADMIN'}</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET USERNAME</span>
        <input type="text" id="admin-username-input" class="auth-input admin-small-input" value="${escapeHtml(user.username)}">
        <button class="admin-btn" data-action="set-username">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET LEVEL</span>
        <input type="number" id="admin-level-input" class="auth-input admin-small-input" min="1" max="100" value="${user.level}">
        <button class="admin-btn" data-action="set-level">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET RANK</span>
        <input type="text" id="admin-rank-input" class="auth-input admin-small-input" value="${escapeHtml(user.rank)}">
        <button class="admin-btn" data-action="set-rank">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET BALANCE</span>
        <input type="number" id="admin-balance-input" class="auth-input admin-small-input" min="0" value="${user.balance}">
        <button class="admin-btn" data-action="set-balance">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">GRANT EFFECT</span>
        <select id="admin-effect-select" class="edit-select">
          ${EFFECTS.map(e => `<option value="${e.id}" ${e.id === user.name_effect ? 'selected' : ''}>${e.name}${e.level === -1 ? ' [ADMIN]' : e.level > 0 ? ' (LV.' + e.level + ')' : ''}</option>`).join('')}
        </select>
        <button class="admin-btn" data-action="set-effect">SET</button>
      </div>
      <div class="admin-danger-zone">
        <div class="admin-danger-title">\u26A0 DANGER ZONE</div>
        <div class="admin-actions">
          <button class="admin-btn danger" data-action="purge-msgs">PURGE MESSAGES</button>
          <button class="admin-btn danger" data-action="reset-profile">RESET PROFILE</button>
        </div>
      </div>
    `;

    // Wire up buttons
    adminDetail.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleAdminAction(btn.dataset.action));
    });
  }

  async function handleAdminAction(action) {
    if (!adminSelectedUser) return;
    const uid = adminSelectedUser.id;
    try {
      switch (action) {
        case 'ban':
          await SupabaseClient.adminBanUser(uid, !adminSelectedUser.is_banned);
          showToast(adminSelectedUser.is_banned ? 'USER UNBANNED' : 'USER BANNED');
          break;
        case 'mute':
          if (adminSelectedUser.is_muted) {
            await SupabaseClient.adminUnmuteUser(uid);
            showToast('USER UNMUTED');
          } else {
            await SupabaseClient.adminMuteUser(uid, 30);
            showToast('USER MUTED FOR 30 MINUTES');
          }
          break;
        case 'mute-1h':
          await SupabaseClient.adminMuteUser(uid, 60);
          showToast('USER MUTED FOR 1 HOUR');
          break;
        case 'mute-24h':
          await SupabaseClient.adminMuteUser(uid, 1440);
          showToast('USER MUTED FOR 24 HOURS');
          break;
        case 'admin':
          await SupabaseClient.adminSetAdmin(uid, !adminSelectedUser.is_admin);
          showToast(adminSelectedUser.is_admin ? 'ADMIN REMOVED' : 'ADMIN GRANTED');
          break;
        case 'set-username': {
          const name = document.getElementById('admin-username-input').value.trim();
          if (name && name.length >= 2 && name.length <= 20) {
            await SupabaseClient.adminSetUsername(uid, name);
            showToast('USERNAME SET TO ' + name.toUpperCase());
          } else { showToast('USERNAME MUST BE 2-20 CHARS'); AudioSystem.sfxError(); return; }
          break;
        }
        case 'set-level': {
          const lvl = parseInt(document.getElementById('admin-level-input').value) || 1;
          await SupabaseClient.adminSetLevel(uid, lvl);
          showToast('LEVEL SET TO ' + Math.max(1, Math.min(100, lvl)));
          break;
        }
        case 'set-rank': {
          const rank = document.getElementById('admin-rank-input').value.trim();
          if (rank) { await SupabaseClient.adminSetRank(uid, rank.toUpperCase()); showToast('RANK UPDATED'); }
          break;
        }
        case 'set-balance': {
          const bal = parseInt(document.getElementById('admin-balance-input').value) || 0;
          await SupabaseClient.adminSetBalance(uid, bal);
          showToast('BALANCE SET TO $' + Math.max(0, bal));
          break;
        }
        case 'set-effect': {
          const fx = document.getElementById('admin-effect-select').value;
          await SupabaseClient.adminSetEffect(uid, fx);
          showToast('EFFECT SET TO ' + fx.toUpperCase());
          break;
        }
        case 'purge-msgs':
          await SupabaseClient.adminPurgeUserMessages(uid);
          showToast('ALL MESSAGES PURGED FOR ' + adminSelectedUser.username);
          break;
        case 'reset-profile':
          await SupabaseClient.adminResetProfile(uid);
          showToast('PROFILE RESET FOR ' + adminSelectedUser.username);
          break;
      }
      AudioSystem.sfxSelect();
      // Refresh user data
      const users = await SupabaseClient.adminFetchAllUsers(adminSearch ? adminSearch.value : '');
      const updated = users.find(u => u.id === uid);
      if (updated) selectAdminUser(updated);
      loadAdminUsers(adminSearch ? adminSearch.value : '');
    } catch (err) {
      AudioSystem.sfxError();
      showToast('ACTION FAILED: ' + (err.message || 'ERROR').toUpperCase().slice(0, 40));
    }
  }

  // --- Admin Messages Tab ---
  async function loadAdminMessages(search = '') {
    const log = document.getElementById('admin-msg-log');
    if (!log) return;
    try {
      const messages = await SupabaseClient.fetchMessages(100, 'general');
      // Also fetch from other channels
      const allMessages = [...messages];
      for (const ch of ['music', 'trading', 'offtopic']) {
        try {
          const chMsgs = await SupabaseClient.fetchMessages(50, ch);
          allMessages.push(...chMsgs);
        } catch (e) { /* skip */ }
      }
      allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const filtered = search
        ? allMessages.filter(m => {
            const u = m.profiles?.username || '';
            return u.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase());
          })
        : allMessages;

      log.innerHTML = '';
      if (filtered.length === 0) {
        log.innerHTML = '<div class="chat-system">NO MESSAGES FOUND</div>';
        return;
      }
      filtered.slice(0, 200).forEach(msg => {
        const row = document.createElement('div');
        row.className = 'admin-msg-row';
        const p = msg.profiles;
        const username = p ? p.username : 'UNKNOWN';
        const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const date = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const channel = msg.channel || 'general';
        row.innerHTML = `
          <span class="admin-msg-user" data-uid="${msg.user_id}">${escapeHtml(username)}</span>
          <span style="color:#282828;font-size:7px;">[${channel}]</span>
          <span class="admin-msg-text">${escapeHtml(msg.content.slice(0, 120))}</span>
          <span class="admin-msg-time">${date} ${time}</span>
          <button class="admin-msg-delete" data-msgid="${msg.id}" title="Delete">\u2718</button>
        `;
        // Click username to select in user tab
        row.querySelector('.admin-msg-user')?.addEventListener('click', () => {
          const found = adminAllUsers.find(u => u.id === msg.user_id);
          if (found) {
            // Switch to users tab and select
            document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('[data-admin-tab="users"]')?.classList.add('active');
            document.getElementById('admin-tab-users')?.classList.add('active');
            selectAdminUser(found);
            AudioSystem.sfxNavigate();
          }
        });
        // Delete message
        row.querySelector('.admin-msg-delete')?.addEventListener('click', async () => {
          try {
            await SupabaseClient.adminDeleteMessage(msg.id);
            row.remove();
            showToast('MESSAGE DELETED');
            AudioSystem.sfxSelect();
          } catch (e) {
            showToast('DELETE FAILED');
            AudioSystem.sfxError();
          }
        });
        log.appendChild(row);
      });
    } catch (err) {
      log.innerHTML = '<div class="chat-system">FAILED TO LOAD MESSAGES</div>';
    }
  }

  // Admin message search
  const adminMsgSearch = document.getElementById('admin-msg-search');
  if (adminMsgSearch) {
    let msgSearchTimeout;
    adminMsgSearch.addEventListener('input', () => {
      clearTimeout(msgSearchTimeout);
      msgSearchTimeout = setTimeout(() => loadAdminMessages(adminMsgSearch.value.trim()), 300);
    });
  }

  // --- Admin Stats Tab ---
  async function loadAdminStats() {
    const grid = document.getElementById('admin-stats-grid');
    if (!grid) return;
    try {
      const users = adminAllUsers.length > 0 ? adminAllUsers : await SupabaseClient.adminFetchAllUsers('');
      const totalUsers = users.length;
      const admins = users.filter(u => u.is_admin).length;
      const banned = users.filter(u => u.is_banned).length;
      const muted = users.filter(u => u.is_muted).length;
      const avgLevel = totalUsers > 0 ? Math.round(users.reduce((s, u) => s + (u.level || 1), 0) / totalUsers) : 0;
      const totalBalance = users.reduce((s, u) => s + (u.balance || 0), 0);
      const highestLevel = users.reduce((max, u) => Math.max(max, u.level || 1), 0);
      const newestUser = users.length > 0 ? users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;

      grid.innerHTML = `
        <div class="admin-stat-card"><div class="admin-stat-value">${totalUsers}</div><div class="admin-stat-label">TOTAL USERS</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${admins}</div><div class="admin-stat-label">ADMINS</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${banned}</div><div class="admin-stat-label">BANNED</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${muted}</div><div class="admin-stat-label">MUTED</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${avgLevel}</div><div class="admin-stat-label">AVG LEVEL</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${highestLevel}</div><div class="admin-stat-label">MAX LEVEL</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">$${totalBalance}</div><div class="admin-stat-label">TOTAL BALANCE</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${newestUser ? escapeHtml(newestUser.username).slice(0, 10) : '-'}</div><div class="admin-stat-label">NEWEST USER</div></div>
      `;
    } catch (err) {
      grid.innerHTML = '<div class="chat-system">FAILED TO LOAD STATS</div>';
    }
  }

  /* ===== USER PROFILE POPUP (Discord-style) ===== */
  const userPopup = document.getElementById('user-popup');
  const userPopupOverlay = document.getElementById('user-popup-overlay');
  const userPopupAvatar = document.getElementById('user-popup-avatar');
  const userPopupBody = document.getElementById('user-popup-body');
  const userPopupActions = document.getElementById('user-popup-actions');

  function closeUserPopup() {
    userPopup.classList.remove('show');
    userPopupOverlay.classList.remove('show');
  }
  userPopupOverlay.addEventListener('click', closeUserPopup);

  async function showUserPopup(userId, username) {
    AudioSystem.sfxNavigate();
    // Show loading state
    userPopupAvatar.innerHTML = '<span class="user-popup-avatar-placeholder">\u25C9</span>';
    userPopupBody.innerHTML = '<div class="chat-system">LOADING...</div>';
    userPopupActions.innerHTML = '';
    userPopup.classList.add('show');
    userPopupOverlay.classList.add('show');

    try {
      const profile = await SupabaseClient.fetchProfileById(userId);
      if (!profile) { closeUserPopup(); showToast('USER NOT FOUND'); return; }

      const effect = getEffectClass(profile.name_effect);
      const idNum = profile.user_id_num ? ('#' + String(profile.user_id_num).padStart(4, '0')) : '#????';
      const joined = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
      const adminTag = profile.is_admin ? '<span style="color:#e02020;font-size:8px;margin-left:4px;">[ADMIN]</span>' : '';

      userPopupAvatar.innerHTML = profile.avatar_url
        ? renderAvatar(profile.avatar_url)
        : '<span class="user-popup-avatar-placeholder">\u25C9</span>';

      userPopupBody.innerHTML = `
        <div class="user-popup-name ${effect}" style="color:${escapeHtml(profile.name_color)}">${escapeHtml(profile.username)}${adminTag}</div>
        <div class="user-popup-id">${idNum}</div>
        <div class="user-popup-divider"></div>
        <div class="user-popup-section">ABOUT</div>
        <div class="user-popup-info">
          <span class="label">RANK:</span> ${escapeHtml(profile.rank)}<br>
          <span class="label">LEVEL:</span> ${profile.level}<br>
          <span class="label">EFFECT:</span> ${escapeHtml(profile.name_effect || 'NONE').toUpperCase()}<br>
          <span class="label">JOINED:</span> ${joined}
        </div>
      `;

      // Actions - show DM button if logged in and not viewing own profile
      const currentUser = SupabaseClient.getUser();
      const isOwnProfile = currentUser && currentUser.id === userId;
      let actionsHTML = '';
      if (!isOwnProfile && currentUser) {
        actionsHTML += `<button class="user-popup-btn primary" id="popup-dm-btn">\u2709 MESSAGE</button>`;
      }
      actionsHTML += `<button class="user-popup-btn" id="popup-mention-btn">@ MENTION</button>`;
      actionsHTML += `<button class="user-popup-btn" id="popup-close-btn">\u2718 CLOSE</button>`;
      userPopupActions.innerHTML = actionsHTML;

      // Wire up action buttons
      document.getElementById('popup-close-btn')?.addEventListener('click', closeUserPopup);
      document.getElementById('popup-dm-btn')?.addEventListener('click', () => {
        closeUserPopup();
        openDMPanel(userId, profile.username);
        AudioSystem.sfxSelect();
      });
      document.getElementById('popup-mention-btn')?.addEventListener('click', () => {
        closeUserPopup();
        chatInput.value += '@' + profile.username + ' ';
        chatInput.focus();
        AudioSystem.sfxSelect();
      });
    } catch (err) {
      closeUserPopup();
      showToast('FAILED TO LOAD PROFILE');
    }
  }

  /* ===== MEMBERS ===== */
  const members = [
    { name: 'Percpuke', role: 'Manager', rank: 'Stone Mask', time: 'Since 2019', redacted: false },
    { name: 'Allcontempt', role: 'Vocals & Graphic Designer', rank: 'Stone Mask', time: 'Since 2020', redacted: false },
    { name: 'Deadbelief', role: 'Vocals & Producer', rank: 'Stone Mask', time: 'Since 2025', redacted: false },
    { name: 'Alkoholinmeinemblut', role: 'Website Manager', rank: 'Rune Tribe', time: 'Since 2026', redacted: false },
    { name: 'Allsomecat', role: 'Producer & Mixxer', rank: 'Rune Tribe', time: 'Since 2026', redacted: false },
  ];

  const membersList = document.getElementById('members-list');
  members.forEach(member => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'member-name';
    span.textContent = member.name;
    span.addEventListener('mouseenter', () => AudioSystem.sfxHover());
    span.addEventListener('click', () => {
      document.getElementById('profile-card').innerHTML = `
        <div class="profile-name">${escapeHtml(member.name)}</div>
        <div class="pixel-divider"></div>
        <p class="profile-detail"><span class="label">ROLE:</span> ${escapeHtml(member.role)}</p>
        <p class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(member.rank)}</p>
        <p class="profile-detail"><span class="label">TIME WITH TRIBE:</span> ${escapeHtml(member.time)}</p>
      `;
      switchScreen('screen-members', 'screen-profile');
    });
    li.appendChild(span);
    membersList.appendChild(li);
  });

  /* ===== UTILITY ===== */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ===== INIT ===== */
  SupabaseClient.init();

})();
