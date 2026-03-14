/* =============================================
   RUNE TRIBE - Supabase Client
   Auth, Profiles, Chat, Mentions
   ============================================= */

const SupabaseClient = (() => {
  // !! REPLACE THESE with your Supabase project values !!
  // Found in: Supabase Dashboard > Settings > API
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

  let sb = null;
  let currentUser = null;
  let currentProfile = null;
  let chatSubscription = null;
  let mentionSubscription = null;
  let unreadMentions = 0;

  // Callbacks
  let onAuthChange = null;
  let onNewMessage = null;
  let onMentionUpdate = null;

  function init() {
    if (typeof supabase === 'undefined') {
      console.error('Supabase JS library not loaded');
      return;
    }
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Listen for auth state changes
    sb.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        currentUser = session.user;
        await fetchProfile();
        subscribeMentions();
      } else {
        currentUser = null;
        currentProfile = null;
        unsubscribeAll();
      }
      if (onAuthChange) onAuthChange(currentUser, currentProfile);
    });

    // Check existing session
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        currentUser = session.user;
        fetchProfile().then(() => {
          subscribeMentions();
          if (onAuthChange) onAuthChange(currentUser, currentProfile);
        });
      }
    });
  }

  // --- AUTH ---
  async function register(email, password, username) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  }

  async function login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
        id,
        content,
        created_at,
        user_id,
        profiles:user_id (
          username,
          avatar_url,
          name_color,
          name_effect,
          rank
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).reverse();
  }

  async function sendMessage(content) {
    if (!currentUser) throw new Error('Not logged in');
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
      const mentionedUsername = match[1].toUpperCase();
      const { data: mentionedUser } = await sb.from('profiles')
        .select('id')
        .ilike('username', mentionedUsername)
        .single();
      if (mentionedUser && mentionedUser.id !== currentUser.id) {
        await sb.from('mentions').insert({
          message_id: data.id,
          from_user_id: currentUser.id,
          to_user_id: mentionedUser.id,
        });
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
          // Fetch the full message with profile
          const { data } = await sb.from('messages')
            .select(`
              id, content, created_at, user_id,
              profiles:user_id ( username, avatar_url, name_color, name_effect, rank )
            `)
            .eq('id', payload.new.id)
            .single();
          if (data && onNewMessage) onNewMessage(data);
        }
      )
      .subscribe();
  }

  function unsubscribeChat() {
    if (chatSubscription) {
      chatSubscription.unsubscribe();
      chatSubscription = null;
    }
  }

  // --- MENTIONS / NOTIFICATIONS ---
  async function fetchUnreadMentions() {
    if (!currentUser) return 0;
    const { count, error } = await sb.from('mentions')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', currentUser.id)
      .eq('is_read', false);
    if (error) return 0;
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentions',
          filter: `to_user_id=eq.${currentUser.id}`
        },
        () => {
          unreadMentions++;
          if (onMentionUpdate) onMentionUpdate(unreadMentions);
          AudioSystem.sfxMention();
        }
      )
      .subscribe();
  }

  function unsubscribeAll() {
    unsubscribeChat();
    if (mentionSubscription) {
      mentionSubscription.unsubscribe();
      mentionSubscription = null;
    }
  }

  // --- HELPERS ---
  function setOnAuthChange(cb) { onAuthChange = cb; }
  function setOnMentionUpdate(cb) { onMentionUpdate = cb; }
  function getUser() { return currentUser; }
  function getProfile() { return currentProfile; }
  function getUnreadCount() { return unreadMentions; }

  async function fetchAllProfiles() {
    const { data } = await sb.from('profiles')
      .select('username')
      .order('username');
    return data || [];
  }

  return {
    init,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    fetchMessages,
    sendMessage,
    subscribeChat,
    unsubscribeChat,
    fetchUnreadMentions,
    markMentionsRead,
    setOnAuthChange,
    setOnMentionUpdate,
    getUser,
    getProfile,
    getUnreadCount,
    fetchAllProfiles,
  };
})();
