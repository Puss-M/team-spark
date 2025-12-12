import { create } from 'zustand';
import { Idea, IdeaWithAuthors, MatchIdea, User, Note, Group, Comment, SocialGroup, SocialGroupMember, SocialGroupMessage } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  // View state
  activeView: 'feed' | 'community' | 'group_chat' | 'galaxy';
  setActiveView: (view: 'feed' | 'community' | 'group_chat' | 'galaxy') => void;

  username: string;
  setUsername: (username: string) => void;
  login: (username: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
  
  // Ideas state
  ideas: IdeaWithAuthors[];
  setIdeas: (ideas: IdeaWithAuthors[]) => void;
  addIdea: (idea: IdeaWithAuthors) => void;
  updateIdea: (idea: IdeaWithAuthors) => void;
  fetchIdeas: () => Promise<void>;
  createIdea: (title: string, content: string, author: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  recallIdea: (idea: IdeaWithAuthors) => void;
  
  // Notes state (for Digital Garden)
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  fetchNotes: () => Promise<void>;
  createNote: (content: string, author: string) => Promise<void>;
  
  // Search and filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'latest' | 'popular' | 'recommend';
  setSortBy: (sortBy: 'latest' | 'popular' | 'recommend') => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  
  // Groups state
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  fetchGroups: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  
  // Match ideas state
  activeIdea: IdeaWithAuthors | null;
  setActiveIdea: (idea: IdeaWithAuthors | null) => void;

  // View mode state
  viewMode: 'mine' | 'all';
  setViewMode: (mode: 'mine' | 'all') => void;

  // Match ideas state
  matchIdeas: MatchIdea[];
  currentMatchSourceIdea: IdeaWithAuthors | null;
  setMatchIdeas: (ideas: MatchIdea[]) => void;
  showMatchModal: boolean;
  setShowMatchModal: (show: boolean) => void;
  findMatchesForIdea: (idea: IdeaWithAuthors) => void;
  
  // New idea state
  newIdea: {
    title: string;
    content: string;
    isPublic: boolean;
    tags: string[];
  };
  setNewIdea: (idea: Partial<AppState['newIdea']>) => void;
  resetNewIdea: () => void;
  
  // Like functionality
  toggleLike: (ideaId: string) => Promise<void>;
  
  // Comments functionality
  comments: { [ideaId: string]: Comment[] };
  fetchComments: (ideaId: string) => Promise<void>;
  addComment: (ideaId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string, ideaId: string) => Promise<void>;

  // Social Groups functionality
  socialGroups: SocialGroup[];
  activeSocialGroupId: string | null;
  groupMessages: { [groupId: string]: SocialGroupMessage[] };
  setActiveSocialGroupId: (groupId: string | null) => void;
  fetchUserSocialGroups: () => Promise<void>;
  createSocialGroup: (name: string, description: string) => Promise<boolean>;
  joinSocialGroup: (inviteCode: string) => Promise<{ success: boolean; message: string }>;
  fetchSocialGroupMessages: (groupId: string) => Promise<void>;
  sendGroupMessage: (groupId: string, content: string) => Promise<void>;
  
  // Toast notification state
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  };
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;

  // User interests functionality
  userInterests: string[];
  hasSelectedInterests: boolean;
  showInterestModal: boolean;
  setShowInterestModal: (show: boolean) => void;
  fetchUserInterests: (username: string) => Promise<void>;
  saveUserInterests: (username: string, interests: string[]) => Promise<void>;
  setUserInterests: (interests: string[]) => void;
  
  // Idea Market functionality
  userBalance: number;
  userInvestments: any[];
  topInvestors: any[];
  fetchUserWallet: (username: string) => Promise<void>;
  investInIdea: (ideaId: string, amount: number) => Promise<boolean>;
  fetchUserInvestments: (username: string) => Promise<void>;
  fetchTopInvestors: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  activeView: 'feed',
  setActiveView: (view) => set({ activeView: view }),

  // Initialize with default values on server, will be updated on client mount
  username: '',
  setUsername: (username) => {
    set({ username });
    // Only use localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('username', username);
    }
  },
  // Login function
  login: (username: string) => {
    const trimmedUsername = username.trim();
    set({ username: trimmedUsername, isLoggedIn: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('username', trimmedUsername);
      localStorage.setItem('isLoggedIn', 'true');
    }
  },
  // Logout function
  logout: () => {
    set({ username: '', isLoggedIn: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('username');
      localStorage.removeItem('isLoggedIn');
    }
  },
  // Initialize with default values on server, will be updated on client mount
  isLoggedIn: false,
  
  // Ideas state
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  updateIdea: (updatedIdea) => set((state) => ({
    ideas: state.ideas.map((idea) =>
      idea.id === updatedIdea.id ? updatedIdea : idea
    )
  })),
  // OPTIMIZED fetchIdeas function for useAppStore.ts
// Replace lines 174-290 with this

fetchIdeas: async () => {
  set({ isLoading: true });
  try {
    const state = get();
    const { username, sortBy, searchQuery } = state;
    
    console.log('⚡ Fetching ideas with optimized query...');
    const startTime = Date.now();
    
    // 🚀 Use optimized RPC function (single query instead of N+2)
    const { data: fetchedIdeas, error } = await supabase.rpc('fetch_ideas_optimized', {
      p_user_name: username || null,
      p_search_query: searchQuery || null,
      p_is_public_only: !username
    });
    
    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Fetched ${fetchedIdeas?.length || 0} ideas in ${duration}ms`);
    
    // Transform to IdeaWithAuthors format
    const ideasWithAuthors: IdeaWithAuthors[] = (fetchedIdeas || []).map((idea: any) => ({
      ...idea,
      authors: [{ 
        id: idea.author_id[0], 
        name: idea.author_id[0], 
        email: '', 
        role: '', 
        created_at: '' 
      }]
    }));
    
    // Apply client-side sorting
    let sortedIdeas = ideasWithAuthors;
    if (sortBy === 'popular') {
      sortedIdeas = sortedIdeas.sort((a, b) => {
        const hotnessA = a.likes_count + a.comments_count;
        const hotnessB = b.likes_count + b.comments_count;
        return hotnessB - hotnessA;
      });
    } else if (sortBy === 'recommend') {
      const { userInterests } = state;
      
      sortedIdeas = sortedIdeas.sort((a, b) => {
        const scoreA = userInterests.length > 0 
          ? a.tags.filter(tag => userInterests.includes(tag)).length 
          : 0;
        const scoreB = userInterests.length > 0 
          ? b.tags.filter(tag => userInterests.includes(tag)).length 
          : 0;
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    
    set({ ideas: sortedIdeas });
  } catch (error) {
    console.error('Error fetching ideas:', error);
  } finally {
    set({ isLoading: false });
  }
},

  createIdea: async (title: string, content: string, author: string) => {
    try {
      // Optimistic update
      const newIdea: IdeaWithAuthors = {
        id: Date.now().toString(),
        author_id: [author],
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: true,
        tags: [],
        comments_count: 0,
        likes_count: 0,
        authors: [{ id: author, name: author, email: '', role: '', created_at: '' }],
        // Set embedding to undefined initially, will be updated after fetch
        embedding: undefined,
        status: 'idea',
        is_bounty: false,
        bounty_amount: 0
      };
      
      get().addIdea(newIdea);
      
      console.log('Generating embedding...');
      // Generate embedding
      const embeddingResponse = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${title} ${content}` })
      });
      
      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status}`);
      }
      
      const { embedding } = await embeddingResponse.json();
      console.log('Generated embedding:', embedding);
      
      // Insert into database
      console.log('Inserting idea into Supabase...');
      const { error } = await supabase
        .from('ideas')
        .insert({
          author_id: [author],
          title,
          content,
          is_public: true,
          tags: [],
          embedding
        });
      
      if (error) {
        console.error('Error inserting idea:', error);
        throw error;
      }
      
      console.log('Idea inserted successfully!');
    } catch (error) {
      console.error('Error creating idea:', error);
    }
  },

  deleteIdea: async (id: string) => {
    // Optimistic update
    set((state) => ({
      ideas: state.ideas.filter((idea) => idea.id !== id)
    }));

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting idea:', error);
        // Revert optimistic update if needed (omitted for simplicity, but good practice)
        throw error;
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('删除失败，请重试');
    }
  },

  recallIdea: (idea: IdeaWithAuthors) => {
    // 1. Delete the idea
    get().deleteIdea(idea.id);

    // 2. Populate input with idea content
    set((state) => ({
      newIdea: {
        ...state.newIdea,
        title: idea.title,
        content: idea.content,
        tags: idea.tags,
        isPublic: idea.is_public
      }
    }));
  },
  
  // Notes state (for Digital Garden)
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  fetchNotes: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('id, content, author_id, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map to Note type
      const notes: Note[] = (data || []).map(item => ({
        id: item.id,
        content: item.content,
        author: item.author_id[0],
        created_at: item.created_at
      }));
      
      set({ notes });
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  createNote: async (content: string, author: string) => {
    // Optimistic update
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      author,
      created_at: new Date().toISOString()
    };
    
    get().addNote(newNote);
    
    // Generate embedding
    const { embedding } = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content })
    }).then(res => res.json());
    
    // Insert into database
    await supabase
      .from('ideas')
      .insert({
        author_id: [author],
        title: '',
        content,
        is_public: true,
        tags: [],
        embedding
      });
  },
  
  // Search and filter state
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  sortBy: 'latest',
  setSortBy: (sortBy) => set({ sortBy }),
  selectedGroup: null,
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  selectedTags: [],
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  
  // Groups state
  groups: [],
  setGroups: (groups) => set({ groups }),
  fetchGroups: async () => {
    try {
      const { data, error } = await supabase
        .from('idea_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ groups: data || [] });
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  },
  
  // Loading state
  isLoading: false,
  
  // View mode state
  viewMode: 'mine',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // Toast notification state
  toast: {
    message: '',
    type: 'info',
    visible: false,
  },
  showToast: (message, type) => set({ toast: { message, type, visible: true } }),
  hideToast: () => set({ toast: { ...get().toast, visible: false } }),

  // Match ideas state
  activeIdea: null,
  setActiveIdea: (idea) => set({ activeIdea: idea }),
  matchIdeas: [],
  currentMatchSourceIdea: null,
  setMatchIdeas: (ideas) => set({ matchIdeas: ideas }),
  showMatchModal: false,
  setShowMatchModal: (show) => set({ showMatchModal: show }),
  
  findMatchesForIdea: async (sourceIdea: IdeaWithAuthors) => {
    const state = get();
    const { username } = state;
    
    if (!sourceIdea.embedding) {
      console.warn('Source idea has no embedding');
      return;
    }

    try {
      console.log('Finding matches via RPC...');
      // @ts-ignore - RPC types might not be fully updated
      const { data, error } = await supabase.rpc('match_ideas_by_embedding', {
        query_embedding: sourceIdea.embedding,
        match_threshold: 0.6, // 降低阈值以展示更多相关想法
        match_count: 5,
        current_author: username || '',
        match_idea_id: sourceIdea.id
      });

      if (error) throw error;

      if (!data) {
        set({ 
          matchIdeas: [], 
          currentMatchSourceIdea: sourceIdea,
          showMatchModal: true 
        });
        return;
      }

      // Transform RPC result to MatchIdea format
      // Note: We need to map RPC result to MatchIdea structure
      const matches: MatchIdea[] = data.map((item: any) => ({
        idea: {
          ...item,
          // Add default values for missing fields if necessary
          author_id: item.author_id || [],
          authors: [{ 
            id: item.author_id ? item.author_id[0] : 'unknown', 
            name: item.author_id ? item.author_id[0] : 'Unknown', 
            email: '', 
            role: '', 
            created_at: '' 
          }],
          likes_count: 0, // RPC might not return this, or we need to update RPC
          comments_count: 0
        },
        similarity: item.similarity
      }));

      set({ 
        matchIdeas: matches, 
        currentMatchSourceIdea: sourceIdea,
        showMatchModal: true 
      });
    } catch (error) {
      console.error('Error finding matches:', error);
      alert('寻找灵感失败，请稍后重试');
    }
  },

  // New idea state
  newIdea: {
    title: '',
    content: '',
    isPublic: true,
    tags: [],
  },
  setNewIdea: (idea) => set((state) => ({
    newIdea: { ...state.newIdea, ...idea }
  })),
  resetNewIdea: () => set({
    newIdea: {
      title: '',
      content: '',
      isPublic: true,
      tags: [],
    }
  }),
  
  // Like functionality
  toggleLike: async (ideaId: string) => {
    const state = get();
    const { username } = state;
    
    if (!username) {
      alert('请先登录');
      return;
    }

    // Find the idea
    const idea = state.ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const isLiked = idea.liked_by_user || false;

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.map((i) =>
        i.id === ideaId
          ? { 
              ...i, 
              likes_count: isLiked ? i.likes_count - 1 : i.likes_count + 1,
              liked_by_user: !isLiked
            }
          : i
      )
    }));

    try {
      if (isLiked) {
        // Unlike: delete the like record
        const { error } = await supabase
          .from('idea_likes')
          .delete()
          .eq('idea_id', ideaId)
          .eq('user_name', username);

        if (error) throw error;
      } else {
        // Like: insert a new like record
        const { error } = await supabase
          .from('idea_likes')
          .insert({
            idea_id: ideaId,
            user_name: username
          });

        if (error) {
          // Check for unique key violation (already liked)
          if (error.code === '23505') {
            console.log('Already liked in DB, treating as success');
            // Do not throw, keep the optimistic update
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      // Rollback optimistic update on error
      set((state) => ({
        ideas: state.ideas.map((i) =>
          i.id === ideaId
            ? { 
                ...i, 
                likes_count: isLiked ? i.likes_count + 1 : i.likes_count - 1,
                liked_by_user: isLiked
              }
            : i
        )
      }));
      
      alert('点赞操作失败：' + error.message);
    }
  },

  // Comments functionality
  comments: {},
  
  fetchComments: async (ideaId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      set((state) => ({
        comments: {
          ...state.comments,
          [ideaId]: data || []
        }
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  },
  
  addComment: async (ideaId: string, content: string) => {
    const state = get();
    const { username } = state;
    
    if (!username) {
      alert('请先登录');
      return;
    }
    
    // Optimistic update
    const tempId = Date.now().toString();
    const newComment: Comment = {
      id: tempId,
      idea_id: ideaId,
      user_name: username,
      content,
      created_at: new Date().toISOString()
    };
    
    set((state) => ({
      comments: {
        ...state.comments,
        [ideaId]: [...(state.comments[ideaId] || []), newComment]
      },
      // Optimistically update idea comment count
      ideas: state.ideas.map(idea => 
        idea.id === ideaId 
          ? { ...idea, comments_count: (idea.comments_count || 0) + 1 } 
          : idea
      )
    }));
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          idea_id: ideaId,
          user_name: username,
          content
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update with real comment data
      set((state) => ({
        comments: {
          ...state.comments,
          [ideaId]: state.comments[ideaId].map(c => c.id === tempId ? data : c)
        }
      }));
    } catch (error: any) {
      console.error('Error adding comment:', error);
      
      // Rollback
      set((state) => ({
        comments: {
          ...state.comments,
          [ideaId]: state.comments[ideaId].filter(c => c.id !== tempId)
        },
        ideas: state.ideas.map(idea => 
          idea.id === ideaId 
            ? { ...idea, comments_count: (idea.comments_count || 1) - 1 } 
            : idea
        )
      }));
      
      alert('评论失败：' + error.message);
    }
  },
  
  deleteComment: async (commentId: string, ideaId: string) => {
    // Optimistic update
    const previousComments = get().comments[ideaId] || [];
    
    set((state) => ({
      comments: {
        ...state.comments,
        [ideaId]: state.comments[ideaId].filter(c => c.id !== commentId)
      },
      ideas: state.ideas.map(idea => 
        idea.id === ideaId 
          ? { ...idea, comments_count: (idea.comments_count || 1) - 1 } 
          : idea
      )
    }));
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      
      // Rollback
      set((state) => ({
        comments: {
          ...state.comments,
          [ideaId]: previousComments
        },
        ideas: state.ideas.map(idea => 
          idea.id === ideaId 
            ? { ...idea, comments_count: (idea.comments_count || 0) + 1 } 
            : idea
        )
      }));
      
      alert('删除评论失败：' + error.message);
    }
  },

  // Social Grpups Implementation
  socialGroups: [],
  activeSocialGroupId: null,
  groupMessages: {},
  
  setActiveSocialGroupId: (groupId) => set({ activeSocialGroupId: groupId }),
  
  fetchUserSocialGroups: async () => {
    const { username } = get();
    if (!username) return;
    
    try {
      // 1. Get group IDs user belongs to
      const { data: members, error: memberError } = await supabase
        .from('social_group_members')
        .select('group_id')
        .eq('user_name', username);
        
      if (memberError) throw memberError;
      
      const groupIds = members.map(m => m.group_id);
      
      if (groupIds.length === 0) {
        set({ socialGroups: [] });
        return;
      }
      
      // 2. Fetch group details
      const { data: groups, error: groupError } = await supabase
        .from('social_groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });
        
      if (groupError) throw groupError;
      
      set({ socialGroups: groups || [] });
    } catch (error) {
      console.error('Error fetching social groups:', error);
    }
  },
  
  createSocialGroup: async (name: string, description: string) => {
    const { username } = get();
    if (!username) return false;
    
    try {
      // 1. Create group
      const { data: group, error: groupError } = await supabase
        .from('social_groups')
        .insert({
          name,
          description,
          created_by: username
        })
        .select()
        .single();
        
      if (groupError) throw groupError;
      
      // 2. Add creator as member (owner)
      const { error: memberError } = await supabase
        .from('social_group_members')
        .insert({
          group_id: group.id,
          user_name: username,
          role: 'owner'
        });
        
      if (memberError) throw memberError;
      
      // Update local state
      set(state => ({
        socialGroups: [group, ...state.socialGroups],
        activeSocialGroupId: group.id
      }));
      
      return true;
    } catch (error: any) {
      console.error('Error creating social group:', error);
      alert('创建小组失败: ' + (error.message || '请检查网络或权限'));
      return false;
    }
  },
  
  joinSocialGroup: async (inviteCode: string) => {
    const { username } = get();
    if (!username) return { success: false, message: '请先登录' };
    
    try {
      // Call RPC function
      const { data, error } = await supabase
        .rpc('join_group_by_code', {
          user_name: username,
          invite_code: inviteCode
        });
        
      if (error) throw error;
      
      if (data.success) {
        // Refresh groups
        await get().fetchUserSocialGroups();
        set({ activeSocialGroupId: data.group_id });
        return { success: true, message: '加入成功' };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      return { success: false, message: error.message || '加入失败' };
    }
  },
  
  fetchSocialGroupMessages: async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('social_group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      set(state => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: data || []
        }
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },
  
  sendGroupMessage: async (groupId: string, content: string) => {
    const { username } = get();
    if (!username) return;
    
    // Optimistic update
    const tempId = Date.now().toString();
    const newMessage: SocialGroupMessage = {
      id: tempId,
      group_id: groupId,
      user_name: username,
      content,
      created_at: new Date().toISOString()
    };
    
    set(state => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: [...(state.groupMessages[groupId] || []), newMessage]
      }
    }));
    
    try {
      const { data, error } = await supabase
        .from('social_group_messages')
        .insert({
          group_id: groupId,
          user_name: username,
          content
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update with real message
      set(state => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: state.groupMessages[groupId].map(m => m.id === tempId ? data : m)
        }
      }));
    } catch (error) {
      console.error('Error sending message:', error);
       // Rollback
       set(state => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: state.groupMessages[groupId].filter(m => m.id !== tempId)
        }
      }));
      alert('发送消息失败');
    }
  },

  // User interests functionality
  userInterests: [],
  hasSelectedInterests: false,
  showInterestModal: false,
  
  setShowInterestModal: (show) => set({ showInterestModal: show }),
  
  setUserInterests: (interests) => set({ 
    userInterests: interests,
    hasSelectedInterests: interests.length > 0
  }),
  
  fetchUserInterests: async (username: string) => {
    if (!username) return;
    
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('interests')
        .eq('user_name', username)
        .maybeSingle();
      
      // Ignore errors if table doesn't exist yet
      if (error) {
        // PGRST116 is "not found", 42P01 is "table does not exist"
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('User interests table not found or user has no interests yet');
          set({ 
            userInterests: [],
            hasSelectedInterests: false
          });
          return;
        }
        console.warn('Error fetching user interests:', error);
        return;
      }
      
      if (data) {
        set({ 
          userInterests: data.interests || [],
          hasSelectedInterests: true
        });
      } else {
        set({ 
          userInterests: [],
          hasSelectedInterests: false
        });
      }
    } catch (error) {
      console.warn('Error fetching user interests:', error);
      // Set default values on error
      set({ 
        userInterests: [],
        hasSelectedInterests: false
      });
    }
  },
  
  saveUserInterests: async (username: string, interests: string[]) => {
    if (!username || interests.length === 0) return;
    
    try {
      // Use upsert to insert or update
      const { error } = await supabase
        .from('user_interests')
        .upsert({
          user_name: username,
          interests,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_name'
        });
      
      if (error) {
        console.error('Error saving user interests:', error);
        throw error;
      }
      
      // Update local state
      set({ 
        userInterests: interests,
        hasSelectedInterests: true,
        showInterestModal: false
      });
      
      // Show success toast
      get().showToast('兴趣标签已保存！', 'success');
    } catch (error: any) {
      console.error('Error saving user interests:', error);
      get().showToast('保存失败: ' + (error.message || '请稍后重试'), 'error');
    }
  },
  
  // Idea Market functionality
  userBalance: 100,
  userInvestments: [],
  topInvestors: [],
  
  fetchUserWallet: async (username: string) => {
    if (!username) return;
    
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_name', username)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching wallet:', error);
        return;
      }
      
      if (data) {
        set({ userBalance: data.balance });
      } else {
        // 初始化钱包
        const { error: insertError } = await supabase
          .from('user_wallets')
          .insert({ user_name: username, balance: 100 });
        
        if (!insertError) {
          set({ userBalance: 100 });
        }
      }
    } catch (error) {
      console.warn('Error fetching wallet:', error);
    }
  },
  
  investInIdea: async (ideaId: string, amount: number) => {
    const { username, userBalance } = get();
    
    if (!username) {
      get().showToast('请先登录', 'error');
      return false;
    }
    
    if (amount > userBalance) {
      get().showToast(`余额不足！当前余额: ${userBalance} coins`, 'error');
      return false;
    }
    
    if (amount < 1) {
      get().showToast('投资金额至少为 1 coin', 'error');
      return false;
    }
    
    try {
      // 1. 先获取当前total_invested
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('total_invested')
        .eq('user_name', username)
        .single();
      
      const newTotalInvested = (walletData?.total_invested || 0) + amount;
      
      // 2. 扣除余额
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: userBalance - amount,
          total_invested: newTotalInvested
        })
        .eq('user_name', username);
      
      if (walletError) throw walletError;
      
      // 2. 记录投资
      const { error: investError } = await supabase
        .from('investments')
        .insert({
          user_name: username,
          idea_id: ideaId,
          amount
        });
      
      if (investError) throw investError;
      
      // 3. 更新本地状态
      set({ userBalance: userBalance - amount });
      
      get().showToast(`成功投资 ${amount} coins! 🚀`, 'success');
      return true;
    } catch (error: any) {
      console.error('Error investing:', error);
      get().showToast('投资失败: ' + (error.message || '请稍后重试'), 'error');
      return false;
    }
  },
  
  fetchUserInvestments: async (username: string) => {
    if (!username) return;
    
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*, ideas(title, content)')
        .eq('user_name', username)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      set({ userInvestments: data || [] });
    } catch (error) {
      console.warn('Error fetching investments:', error);
    }
  },
  
  fetchTopInvestors: async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .order('total_earned', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      set({ topInvestors: data || [] });
    } catch (error) {
      console.warn('Error fetching top investors:', error);
    }
  },
}));

// Helper function for cosine similarity
function calculateSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
