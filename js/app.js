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
    AudioSystem.sfxStart();
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
        loadChat();
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
  SupabaseClient.setOnAuthChange((user, profile) => {
    updateHUD(user, profile);
    updateNavMenu(user, profile);
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
          ? `<img src="${escapeHtml(profile.avatar_url)}" alt="PFP">`
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
      ? `<img src="${escapeHtml(profile.avatar_url)}" alt="Avatar">`
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
    try {
      showToast('UPLOADING...');
      const url = await SupabaseClient.uploadAvatar(file);
      document.getElementById('edit-avatar-preview').innerHTML = `<img src="${escapeHtml(url)}" alt="Avatar">`;
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
  let chatLoaded = false;

  // Cooldown state
  let lastMsgTime = 0;
  let recentMessages = []; // timestamps + content for spam detection
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

  function parseEmojis(text) {
    let result = escapeHtml(text);
    for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
      result = result.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `<span class="retro-emoji">${emoji}</span>`);
    }
    result = result.replace(/@(\w+)/g, '<span class="chat-mention">@$1</span>');
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
    const idNum = p && p.user_id_num ? ('#' + String(p.user_id_num).padStart(4, '0')) : '';
    const adminTag = p && p.is_admin ? '<span class="chat-admin-tag">[ADMIN]</span>' : '';
    const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    div.innerHTML = `
      <span class="chat-time">${time}</span>
      <span class="chat-user ${effect}" style="color:${escapeHtml(color)}">${escapeHtml(username)}</span>
      <span class="chat-id">${idNum}</span>
      ${adminTag}
      <span class="chat-text">${parseEmojis(msg.content)}</span>
    `;
    return div;
  }

  async function loadChat() {
    if (chatLoaded) return;
    chatLoaded = true;
    try {
      const messages = await SupabaseClient.fetchMessages(50);
      chatMessages.innerHTML = '';
      messages.forEach(msg => chatMessages.appendChild(renderMessage(msg)));
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      chatMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD MESSAGES</div>';
    }
    SupabaseClient.subscribeChat((msg) => {
      chatMessages.appendChild(renderMessage(msg));
      chatMessages.scrollTop = chatMessages.scrollHeight;
      AudioSystem.sfxChat();
    });
  }

  function checkCooldown(content) {
    const now = Date.now();

    // Check spam mute
    if (spamCooldownUntil > now) {
      const secs = Math.ceil((spamCooldownUntil - now) / 1000);
      showToast(`SPAM COOLDOWN: ${secs}S`);
      AudioSystem.sfxError();
      return false;
    }

    // Check base cooldown (5 seconds)
    if (now - lastMsgTime < COOLDOWN_MS) {
      const secs = Math.ceil((COOLDOWN_MS - (now - lastMsgTime)) / 1000);
      showToast(`WAIT ${secs}S`);
      AudioSystem.sfxError();
      return false;
    }

    // Spam detection: check last messages for repeats
    const trimmed = content.trim().toLowerCase();
    recentMessages.push({ time: now, content: trimmed });
    // Keep only last 60 seconds of messages
    recentMessages = recentMessages.filter(m => now - m.time < 60000);

    const repeatCount = recentMessages.filter(m => m.content === trimmed).length;
    if (repeatCount >= SPAM_REPEAT_LIMIT) {
      spamOffenseCount++;
      if (spamOffenseCount >= SPAM_MUTE_OFFENSES) {
        // Server-side mute for 30 minutes
        SupabaseClient.updateProfile({ is_muted: true, muted_until: new Date(now + 30 * 60000).toISOString() })
          .catch(() => {});
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

  async function sendChatMessage() {
    const content = chatInput.value.trim();
    if (!content) return;
    if (!checkCooldown(content)) return;
    chatInput.value = '';
    lastMsgTime = Date.now();
    try {
      await SupabaseClient.sendMessage(content);
    } catch (err) {
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'SEND FAILED');
      AudioSystem.sfxError();
    }
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  // Emoji picker
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

  // Chat badge
  function updateChatBadge(count) {
    const badge = document.getElementById('chat-badge');
    if (count > 0) { badge.textContent = '+' + count; badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
  }
  SupabaseClient.setOnMentionUpdate(updateChatBadge);

  /* ===== ADMIN PANEL ===== */
  const adminUserList = document.getElementById('admin-user-list');
  const adminSearch = document.getElementById('admin-search');
  const adminDetail = document.getElementById('admin-detail');
  let adminSelectedUser = null;

  // Open admin panel
  document.querySelector('[data-target="screen-admin"]')?.addEventListener('click', () => {
    if (!SupabaseClient.isAdmin()) return;
    loadAdminUsers();
  });

  async function loadAdminUsers(search = '') {
    if (!SupabaseClient.isAdmin()) return;
    try {
      const users = await SupabaseClient.adminFetchAllUsers(search);
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
        <button class="admin-btn" data-action="admin">${user.is_admin ? 'REMOVE ADMIN' : 'MAKE ADMIN'}</button>
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
        case 'admin':
          await SupabaseClient.adminSetAdmin(uid, !adminSelectedUser.is_admin);
          showToast(adminSelectedUser.is_admin ? 'ADMIN REMOVED' : 'ADMIN GRANTED');
          break;
        case 'set-level':
          const lvl = parseInt(document.getElementById('admin-level-input').value) || 1;
          await SupabaseClient.adminSetLevel(uid, lvl);
          showToast('LEVEL SET TO ' + Math.max(1, Math.min(100, lvl)));
          break;
        case 'set-rank':
          const rank = document.getElementById('admin-rank-input').value.trim();
          if (rank) { await SupabaseClient.adminSetRank(uid, rank.toUpperCase()); showToast('RANK UPDATED'); }
          break;
        case 'set-balance':
          const bal = parseInt(document.getElementById('admin-balance-input').value) || 0;
          await SupabaseClient.adminSetBalance(uid, bal);
          showToast('BALANCE SET TO $' + Math.max(0, bal));
          break;
        case 'set-effect':
          const fx = document.getElementById('admin-effect-select').value;
          await SupabaseClient.adminSetEffect(uid, fx);
          showToast('EFFECT SET TO ' + fx.toUpperCase());
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

  /* ===== MEMBERS ===== */
  const members = [
    { name: 'Percpuke', role: 'Manager', rank: 'Stone Mask', time: 'Since 2019', redacted: false },
    { name: 'Allcontempt', role: 'Vocals & Graphic Designer', rank: 'Stone Mask', time: 'Since 2020', redacted: false },
    { name: 'Deadbelief', role: 'Vocals & Producer', rank: 'Stone Mask', time: 'Since 2025', redacted: false },
    { name: 'Alkoholinmeinemblut', role: 'Website Manager', rank: 'Rune Tribe', time: 'Since 2026', redacted: false },
    { name: 'Allsomecat', role: 'Producer & Mixxer', rank: 'Rune Tribe', time: 'Since 2026', redacted: false },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
  ];

  const membersList = document.getElementById('members-list');
  members.forEach(member => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'member-name' + (member.redacted ? ' redacted' : '');
    span.textContent = member.name;
    span.addEventListener('mouseenter', () => AudioSystem.sfxHover());
    span.addEventListener('click', () => {
      if (member.redacted) {
        switchScreen('screen-members', 'screen-classified');
      } else {
        document.getElementById('profile-card').innerHTML = `
          <div class="profile-name">${escapeHtml(member.name)}</div>
          <div class="pixel-divider"></div>
          <p class="profile-detail"><span class="label">ROLE:</span> ${escapeHtml(member.role)}</p>
          <p class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(member.rank)}</p>
          <p class="profile-detail"><span class="label">TIME WITH TRIBE:</span> ${escapeHtml(member.time)}</p>
        `;
        switchScreen('screen-members', 'screen-profile');
      }
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
