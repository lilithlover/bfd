/* =============================================
   RUNE TRIBE - Main Application Logic
   Screen navigation, members, profile editor,
   chat UI, and all interactivity
   ============================================= */

(function () {
  'use strict';

  /* ===== ASCII VIDEO ENGINE ===== */
  const video = document.getElementById('video');
  const sourceCanvas = document.getElementById('source');
  const sourceCtx = sourceCanvas.getContext('2d');
  const asciiCanvas = document.getElementById('ascii-canvas');
  const asciiCtx = asciiCanvas.getContext('2d');
  const noVideo = document.getElementById('no-video');

  const CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const COLS = 150;
  const CELL_W = 4;
  const CELL_H = 6;
  const BG_COLOR = '#000';
  const WHITE_THRESHOLD = 245;
  const FPS_TARGET = 12;
  let lastFrameTime = 0;

  function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function charForLuminance(lum) {
    return CHARS[Math.min(Math.floor((lum / 255) * CHARS.length), CHARS.length - 1)];
  }
  function boostColor(r, g, b, lum) {
    const boost = 1.15, gray = lum;
    return [
      Math.min(255, Math.round(r * boost + (1 - boost) * gray)),
      Math.min(255, Math.round(g * boost + (1 - boost) * gray)),
      Math.min(255, Math.round(b * boost + (1 - boost) * gray))
    ];
  }

  function processFrame() {
    if (video.readyState < 2) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const cellW = vw / COLS, cellH = cellW * (CELL_H / CELL_W);
    const rows = Math.floor(vh / cellH);
    const outW = COLS * CELL_W, outH = rows * CELL_H;
    sourceCanvas.width = vw; sourceCanvas.height = vh;
    sourceCtx.drawImage(video, 0, 0);
    const data = sourceCtx.getImageData(0, 0, vw, vh).data;
    asciiCanvas.width = outW; asciiCanvas.height = outH;
    asciiCtx.fillStyle = BG_COLOR;
    asciiCtx.fillRect(0, 0, outW, outH);
    asciiCtx.font = `bold ${CELL_H}px "Consolas","Monaco","Courier New",monospace`;
    asciiCtx.textBaseline = 'top';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < COLS; col++) {
        const px = Math.floor(col * cellW + cellW / 2);
        const py = Math.floor(row * cellH + cellH / 2);
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const sx = Math.min(vw - 1, Math.max(0, px + dx));
            const sy = Math.min(vh - 1, Math.max(0, py + dy));
            const i = (sy * vw + sx) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
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
    if (timestamp - lastFrameTime >= 1000 / FPS_TARGET) {
      lastFrameTime = timestamp;
      processFrame();
    }
    requestAnimationFrame(nextFrame);
  }

  video.addEventListener('loadeddata', () => {
    asciiCanvas.style.display = 'block';
    noVideo.style.display = 'none';
    video.play().catch(() => {});
    requestAnimationFrame(nextFrame);
  });
  video.addEventListener('error', () => {
    asciiCanvas.style.display = 'none';
    noVideo.style.display = 'block';
  });
  video.play().catch(() => {});

  /* ===== SCREEN NAVIGATION ===== */
  let currentScreen = 'screen-title';
  const hud = document.getElementById('player-hud');

  function switchScreen(fromId, toId) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (!from || !to) return;

    // Play appropriate sound
    if (toId === 'screen-title' || fromId !== 'screen-title' && toId === 'screen-nav') {
      AudioSystem.sfxBack();
    } else {
      AudioSystem.sfxSelect();
    }

    from.classList.remove('visible');
    setTimeout(() => {
      from.classList.remove('active');
      to.classList.add('active');
      to.offsetHeight; // reflow
      to.classList.add('visible');

      // Show/hide HUD
      if (toId === 'screen-title') {
        hud.classList.remove('show');
      } else {
        hud.classList.add('show');
      }

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

  // Menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (!target) return;

      // Chat requires login
      if (target === 'screen-chat' && !SupabaseClient.getUser()) {
        AudioSystem.sfxError();
        showToast('LOGIN REQUIRED TO ACCESS CHAT');
        return;
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

  /* ===== TOAST NOTIFICATIONS ===== */
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
      inputs[0].value = ''; inputs[1].value = '';
      switchScreen('screen-auth', 'screen-nav');
    } catch (err) {
      AudioSystem.sfxError();
      showToast('ACCESS DENIED: ' + (err.message || 'ERROR').toUpperCase());
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
    if (password.length < 6) { showToast('PASSWORD TOO SHORT (MIN 6)'); AudioSystem.sfxError(); return; }
    try {
      await SupabaseClient.register(email, password, username);
      AudioSystem.sfxSelect();
      showToast('REGISTERED - CHECK EMAIL TO CONFIRM');
      inputs.forEach(i => i.value = '');
    } catch (err) {
      AudioSystem.sfxError();
      showToast('ERROR: ' + (err.message || 'REGISTRATION FAILED').toUpperCase());
    }
  });

  /* ===== AUTH STATE CHANGE ===== */
  SupabaseClient.setOnAuthChange((user, profile) => {
    updateHUD(user, profile);
    updateNavMenu(user);
  });

  function updateNavMenu(user) {
    const authItem = document.querySelector('[data-target="screen-auth"]');
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
        updateNavMenu(null);
      };
    } else {
      authItem.textContent = 'LOGIN / REGISTER';
      authItem.dataset.target = 'screen-auth';
      authItem.onclick = null;
    }
  }

  /* ===== PLAYER HUD ===== */
  function updateHUD(user, profile) {
    const hudContent = document.getElementById('hud-content');
    if (!user || !profile) {
      hudContent.innerHTML = '<span class="hud-text">NOT LOGGED IN</span>';
      return;
    }
    const effect = getEffectClass(profile.name_effect);
    hudContent.innerHTML = `
      <div class="hud-avatar" id="hud-avatar-btn">
        ${profile.avatar_url
          ? `<img src="${escapeHtml(profile.avatar_url)}" alt="PFP">`
          : '<span class="hud-avatar-placeholder">?</span>'}
      </div>
      <div class="hud-info">
        <span class="hud-username ${effect}" style="color:${escapeHtml(profile.name_color)}">${escapeHtml(profile.username)}</span>
        <span class="hud-rank">${escapeHtml(profile.rank)}</span>
        <span class="hud-stats">LV.${profile.level} | $${profile.balance}</span>
      </div>
    `;
    // Click HUD to open profile editor
    document.getElementById('hud-avatar-btn').addEventListener('click', () => {
      openProfileEditor();
    });
    hudContent.addEventListener('click', () => {
      openProfileEditor();
    });
  }

  function getEffectClass(effect) {
    const effects = {
      'none': '',
      'glow': 'fx-glow',
      'radioactive': 'fx-radioactive',
      'glitch': 'fx-glitch',
      'pulse': 'fx-pulse',
      'neon': 'fx-neon',
      'fire': 'fx-fire',
      'ice': 'fx-ice',
      'shadow': 'fx-shadow',
    };
    return effects[effect] || '';
  }

  /* ===== PROFILE EDITOR ===== */
  function openProfileEditor() {
    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    AudioSystem.sfxSelect();

    // Populate editor fields
    document.getElementById('edit-color').value = profile.name_color || '#e02020';
    document.getElementById('edit-effect').value = profile.name_effect || 'none';
    document.getElementById('edit-preview-name').textContent = profile.username;
    document.getElementById('edit-preview-name').style.color = profile.name_color;
    document.getElementById('edit-preview-name').className = 'edit-preview-name ' + getEffectClass(profile.name_effect);

    // Show current avatar
    const avatarPreview = document.getElementById('edit-avatar-preview');
    if (profile.avatar_url) {
      avatarPreview.innerHTML = `<img src="${escapeHtml(profile.avatar_url)}" alt="Avatar">`;
    } else {
      avatarPreview.innerHTML = '<span class="hud-avatar-placeholder">?</span>';
    }

    const created = new Date(profile.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).toUpperCase();
    document.getElementById('edit-info').innerHTML = `
      <span class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(profile.rank)}</span>
      <span class="profile-detail"><span class="label">LEVEL:</span> ${profile.level}</span>
      <span class="profile-detail"><span class="label">BALANCE:</span> $${profile.balance}</span>
      <span class="profile-detail"><span class="label">JOINED:</span> ${created}</span>
    `;

    switchScreen(currentScreen, 'screen-editor');
  }

  // Color picker live preview
  document.getElementById('edit-color').addEventListener('input', (e) => {
    document.getElementById('edit-preview-name').style.color = e.target.value;
  });

  // Effect selector live preview
  document.getElementById('edit-effect').addEventListener('change', (e) => {
    const preview = document.getElementById('edit-preview-name');
    preview.className = 'edit-preview-name ' + getEffectClass(e.target.value);
  });

  // Avatar upload
  document.getElementById('edit-avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('FILE TOO LARGE (MAX 2MB)'); return; }
    try {
      showToast('UPLOADING...');
      const url = await SupabaseClient.uploadAvatar(file);
      document.getElementById('edit-avatar-preview').innerHTML = `<img src="${escapeHtml(url)}" alt="Avatar">`;
      showToast('AVATAR UPDATED');
      AudioSystem.sfxSelect();
    } catch (err) {
      AudioSystem.sfxError();
      showToast('UPLOAD FAILED');
    }
  });

  // Save profile
  document.getElementById('edit-save').addEventListener('click', async () => {
    const color = document.getElementById('edit-color').value;
    const effect = document.getElementById('edit-effect').value;
    try {
      await SupabaseClient.updateProfile({ name_color: color, name_effect: effect });
      AudioSystem.sfxSelect();
      showToast('PROFILE SAVED');
      switchScreen('screen-editor', 'screen-nav');
    } catch (err) {
      AudioSystem.sfxError();
      showToast('SAVE FAILED');
    }
  });

  /* ===== CHAT SYSTEM ===== */
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');
  let chatLoaded = false;

  // Retro emoji map
  const RETRO_EMOJIS = {
    ':skull:': '\u2620',
    ':heart:': '\u2665',
    ':star:': '\u2605',
    ':sword:': '\u2694',
    ':lightning:': '\u26A1',
    ':moon:': '\u263E',
    ':sun:': '\u2600',
    ':crown:': '\u265B',
    ':music:': '\u266B',
    ':fire:': '\u2739',
    ':check:': '\u2714',
    ':x:': '\u2718',
    ':arrow:': '\u25BA',
    ':diamond:': '\u25C6',
    ':circle:': '\u25CF',
    ':square:': '\u25A0',
    ':triangle:': '\u25B2',
    ':wave:': '\u223F',
    ':eye:': '\u25C9',
    ':skull2:': '\u2623',
  };

  function parseEmojis(text) {
    let result = escapeHtml(text);
    for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), `<span class="retro-emoji">${emoji}</span>`);
    }
    // Highlight @mentions
    result = result.replace(/@(\w+)/g, '<span class="chat-mention">@$1</span>');
    return result;
  }

  function renderMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    const profile = msg.profiles;
    const effect = profile ? getEffectClass(profile.name_effect) : '';
    const color = profile ? profile.name_color : '#aaa';
    const username = profile ? profile.username : 'UNKNOWN';
    const time = new Date(msg.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    div.innerHTML = `
      <span class="chat-time">${time}</span>
      <span class="chat-user ${effect}" style="color:${escapeHtml(color)}">${escapeHtml(username)}</span>
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

    // Subscribe to new messages
    SupabaseClient.subscribeChat((msg) => {
      chatMessages.appendChild(renderMessage(msg));
      chatMessages.scrollTop = chatMessages.scrollHeight;
      AudioSystem.sfxChat();
    });
  }

  // Navigate to chat
  const chatMenuItem = document.querySelector('[data-target="screen-chat"]');
  if (chatMenuItem) {
    const origClick = chatMenuItem.onclick;
    chatMenuItem.addEventListener('click', () => {
      if (SupabaseClient.getUser()) {
        loadChat();
        SupabaseClient.markMentionsRead();
        updateChatBadge(0);
      }
    });
  }

  // Send message
  function sendChatMessage() {
    const content = chatInput.value.trim();
    if (!content) return;
    chatInput.value = '';
    SupabaseClient.sendMessage(content).catch(() => {
      showToast('SEND FAILED');
      AudioSystem.sfxError();
    });
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Emoji picker toggle
  const emojiBtn = document.getElementById('emoji-toggle');
  const emojiPicker = document.getElementById('emoji-picker');
  emojiBtn.addEventListener('click', () => {
    AudioSystem.sfxNavigate();
    emojiPicker.classList.toggle('show');
  });

  // Build emoji picker
  for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
    const btn = document.createElement('span');
    btn.className = 'emoji-option';
    btn.textContent = emoji;
    btn.title = code;
    btn.addEventListener('click', () => {
      chatInput.value += code;
      chatInput.focus();
      emojiPicker.classList.remove('show');
      AudioSystem.sfxNavigate();
    });
    emojiPicker.appendChild(btn);
  }

  // Chat badge (mention notification count)
  function updateChatBadge(count) {
    const badge = document.getElementById('chat-badge');
    if (count > 0) {
      badge.textContent = '+' + count;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  }

  SupabaseClient.setOnMentionUpdate((count) => {
    updateChatBadge(count);
  });

  /* ===== MEMBERS ===== */
  const members = [
    { name: 'PHANTOM', role: 'PRODUCER / ENGINEER', rank: 'FOUNDER', time: 'SINCE DAY ONE', redacted: false },
    { name: 'VEXIS', role: 'VOCALIST / LYRICIST', rank: 'CO-FOUNDER', time: 'SINCE DAY ONE', redacted: false },
    { name: 'KROW', role: 'GRAPHIC DESIGNER / VISUAL ARTIST', rank: 'ELDER', time: '3 YEARS', redacted: false },
    { name: 'SHADE', role: 'BEAT ARCHITECT', rank: 'ELDER', time: '2 YEARS', redacted: false },
    { name: 'NOXIS', role: 'MIX ENGINEER', rank: 'MEMBER', time: '1 YEAR', redacted: false },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', role: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', rank: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', time: '\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', role: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', rank: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', time: '\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', role: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', rank: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', time: '\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', role: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', rank: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', time: '\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
    { name: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588', role: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', rank: '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', time: '\u2588\u2588\u2588\u2588\u2588\u2588', redacted: true },
  ];

  const membersList = document.getElementById('members-list');
  members.forEach((member) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'member-name' + (member.redacted ? ' redacted' : '');
    span.textContent = member.name;
    span.addEventListener('mouseenter', () => AudioSystem.sfxHover());
    span.addEventListener('click', () => {
      if (member.redacted) {
        switchScreen('screen-members', 'screen-classified');
      } else {
        const card = document.getElementById('profile-card');
        card.innerHTML = `
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

  /* ===== INIT SUPABASE ===== */
  SupabaseClient.init();

})();
