/* =============================================
   RUNE TRIBE - Supabase Client v2
   Auth (persistent), Profiles, Chat, Mentions,
   Admin functions, Mute/Ban system
   ============================================= */

const SupabaseClient = (() => {
  const SUPABASE_URL = 'https://oaefzkipbkjmtchckfwd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZWZ6a2lwYmtqbXRjaGNrZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTIxODEsImV4cCI6MjA4OTAyODE4MX0.3fAjcNGiGEGeVSk4xLL0wY_65pAOGu8d-wsdA-7EChs';

  let sb = null;
  let currentUser = null;
  let currentProfile = null;
  let chatSubscription = null;
  let mentionSubscription = null;
  let unreadMentions = 0;

  let onAuthChange = null;
  let onNewMessage = null;
  let onMentionUpdate = null;

  function init() {
    if (typeof supabase === 'undefined') {
      console.error('Supabase JS library not loaded');
      return;
    }
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'rune-tribe-auth',
      }
    });

    // Listen for auth changes
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          currentUser = session.user;
          await fetchProfile();
          subscribeMentions();
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        unsubscribeAll();
      }
      if (onAuthChange) onAuthChange(currentUser, currentProfile);
    });
  }

  // --- AUTH ---
  async function register(email, password, username) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin,
      }
    });
    if (error) throw error;
    // Check if email confirmation is needed
    if (data.user && !data.session) {
      throw new Error('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT BEFORE LOGGING IN');
    }
    return data;
  }

  async function login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('EMAIL NOT CONFIRMED - CHECK YOUR INBOX');
      }
      throw error;
    }
    // Check if banned
    if (data.user) {
      currentUser = data.user;
      const profile = await fetchProfile();
      if (profile && profile.is_banned) {
        await sb.auth.signOut();
        throw new Error('ACCOUNT BANNED');
      }
    }
    return data;
  }

  async function logout() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    currentUser = null;
    currentProfile = null;
  }

  // --- PROFILES ---
  async function fetchProfile() {
    if (!currentUser) return null;
    const { data, error } = await sb.from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    currentProfile = data;
    return data;
  }

  async function updateProfile(updates) {
    if (!currentUser) return null;
    const { data, error } = await sb.from('profiles')
      .update(updates)
      .eq('id', currentUser.id)
      .select()
      .single();
    if (error) throw error;
    currentProfile = data;
    if (onAuthChange) onAuthChange(currentUser, currentProfile);
    return data;
  }

  async function uploadAvatar(file) {
    if (!currentUser) throw new Error('Not logged in');
    const ext = file.name.split('.').pop();
    const path = `${currentUser.id}/avatar.${ext}`;
    const { error: uploadError } = await sb.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = sb.storage
      .from('avatars')
      .getPublicUrl(path);
    await updateProfile({ avatar_url: publicUrl });
    return publicUrl;
  }

  // --- CHAT ---
  async function fetchMessages(limit = 50) {
    const { data, error } = await sb.from('messages')
      .select(`
        id, content, created_at, user_id,
        profiles:user_id (
          username, avatar_url, name_color, name_effect, rank, user_id_num, is_admin
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).reverse();
  }

  async function sendMessage(content) {
    if (!currentUser) throw new Error('Not logged in');

    // Check if muted
    if (currentProfile) {
      if (currentProfile.is_muted && currentProfile.muted_until) {
        const muteEnd = new Date(currentProfile.muted_until);
        if (muteEnd > new Date()) {
          const mins = Math.ceil((muteEnd - new Date()) / 60000);
          throw new Error(`MUTED FOR ${mins} MORE MINUTES`);
        }
        // Mute expired, clear it
        await updateProfile({ is_muted: false, muted_until: null });
      }
    }

    const sanitized = content.trim().slice(0, 500);
    if (!sanitized) return;

    const { data, error } = await sb.from('messages')
      .insert({ user_id: currentUser.id, content: sanitized })
      .select()
      .single();
    if (error) throw error;

    // Check for @mentions
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(sanitized)) !== null) {
      const mentionedUsername = match[1];
      const { data: mentionedUser } = await sb.from('profiles')
        .select('id')
        .ilike('username', mentionedUsername)
        .single();
      if (mentionedUser && mentionedUser.id !== currentUser.id) {
        await sb.from('mentions').insert({
          message_id: data.id,
          from_user_id: currentUser.id,
          to_user_id: mentionedUser.id,
        }).catch(() => {});
      }
    }
    return data;
  }

  function subscribeChat(callback) {
    if (chatSubscription) chatSubscription.unsubscribe();
    onNewMessage = callback;
    chatSubscription = sb.channel('public:messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data } = await sb.from('messages')
            .select(`
              id, content, created_at, user_id,
              profiles:user_id ( username, avatar_url, name_color, name_effect, rank, user_id_num, is_admin )
            `)
            .eq('id', payload.new.id)
            .single();
          if (data && onNewMessage) onNewMessage(data);
        }
      )
      .subscribe();
  }

  function unsubscribeChat() {
    if (chatSubscription) { chatSubscription.unsubscribe(); chatSubscription = null; }
  }

  // --- MENTIONS ---
  async function fetchUnreadMentions() {
    if (!currentUser) return 0;
    const { count } = await sb.from('mentions')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', currentUser.id)
      .eq('is_read', false);
    unreadMentions = count || 0;
    return unreadMentions;
  }

  async function markMentionsRead() {
    if (!currentUser) return;
    await sb.from('mentions')
      .update({ is_read: true })
      .eq('to_user_id', currentUser.id)
      .eq('is_read', false);
    unreadMentions = 0;
    if (onMentionUpdate) onMentionUpdate(0);
  }

  function subscribeMentions() {
    if (!currentUser) return;
    if (mentionSubscription) mentionSubscription.unsubscribe();
    fetchUnreadMentions().then(count => {
      if (onMentionUpdate) onMentionUpdate(count);
    });
    mentionSubscription = sb.channel('mentions:' + currentUser.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mentions', filter: `to_user_id=eq.${currentUser.id}` },
        () => {
          unreadMentions++;
          if (onMentionUpdate) onMentionUpdate(unreadMentions);
          if (typeof AudioSystem !== 'undefined') AudioSystem.sfxMention();
        }
      )
      .subscribe();
  }

  function unsubscribeAll() {
    unsubscribeChat();
    if (mentionSubscription) { mentionSubscription.unsubscribe(); mentionSubscription = null; }
  }

  // --- ADMIN FUNCTIONS ---
  async function adminFetchAllUsers(search = '') {
    let query = sb.from('profiles')
      .select('*')
      .order('user_id_num', { ascending: true });
    if (search) {
      query = query.or(`username.ilike.%${search}%,user_id_num.eq.${parseInt(search) || 0}`);
    }
    const { data, error } = await query.limit(100);
    if (error) throw error;
    return data || [];
  }

  async function adminUpdateUser(userId, updates) {
    if (!currentProfile?.is_admin) throw new Error('Not admin');
    const { data, error } = await sb.from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function adminBanUser(userId, ban = true) {
    return adminUpdateUser(userId, { is_banned: ban });
  }

  async function adminMuteUser(userId, minutes = 30) {
    const muteUntil = new Date(Date.now() + minutes * 60000).toISOString();
    return adminUpdateUser(userId, { is_muted: true, muted_until: muteUntil });
  }

  async function adminUnmuteUser(userId) {
    return adminUpdateUser(userId, { is_muted: false, muted_until: null });
  }

  async function adminSetEffect(userId, effect) {
    return adminUpdateUser(userId, { name_effect: effect });
  }

  async function adminSetAdmin(userId, isAdmin) {
    return adminUpdateUser(userId, { is_admin: isAdmin });
  }

  async function adminSetLevel(userId, level) {
    return adminUpdateUser(userId, { level: Math.max(1, Math.min(100, level)) });
  }

  async function adminSetRank(userId, rank) {
    return adminUpdateUser(userId, { rank });
  }

  async function adminSetBalance(userId, balance) {
    return adminUpdateUser(userId, { balance: Math.max(0, balance) });
  }

  async function adminDeleteMessage(messageId) {
    if (!currentProfile?.is_admin) throw new Error('Not admin');
    const { error } = await sb.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  }

  // --- HELPERS ---
  function setOnAuthChange(cb) { onAuthChange = cb; }
  function setOnMentionUpdate(cb) { onMentionUpdate = cb; }
  function getUser() { return currentUser; }
  function getProfile() { return currentProfile; }
  function getUnreadCount() { return unreadMentions; }
  function isAdmin() { return currentProfile?.is_admin === true; }

  return {
    init, register, login, logout,
    fetchProfile, updateProfile, uploadAvatar,
    fetchMessages, sendMessage, subscribeChat, unsubscribeChat,
    fetchUnreadMentions, markMentionsRead,
    setOnAuthChange, setOnMentionUpdate,
    getUser, getProfile, getUnreadCount, isAdmin,
    adminFetchAllUsers, adminUpdateUser,
    adminBanUser, adminMuteUser, adminUnmuteUser,
    adminSetEffect, adminSetAdmin, adminSetLevel, adminSetRank, adminSetBalance,
    adminDeleteMessage,
  };
})();
