import { create } from 'zustand';
import { Idea, IdeaWithAuthors, MatchIdea, User, Note } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  author: string;
  setAuthor: (author: string) => void;
  
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
  sortBy: 'latest' | 'popular';
  setSortBy: (sortBy: 'latest' | 'popular') => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  
  // Loading state
  isLoading: boolean;
  
  // Match ideas state
  matchIdeas: MatchIdea[];
  setMatchIdeas: (ideas: MatchIdea[]) => void;
  showMatchModal: boolean;
  setShowMatchModal: (show: boolean) => void;
  
  // New idea state
  newIdea: {
    title: string;
    content: string;
    isPublic: boolean;
    tags: string[];
  };
  setNewIdea: (idea: Partial<AppState['newIdea']>) => void;
  resetNewIdea: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  // Initialize author with a fallback for SSR
  author: '',
  setAuthor: (author) => {
    set({ author });
    // Only use localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('author', author);
    }
  },
  
  // Ideas state
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  updateIdea: (updatedIdea) => set((state) => ({
    ideas: state.ideas.map((idea) =>
      idea.id === updatedIdea.id ? updatedIdea : idea
    )
  })),
  fetchIdeas: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching ideas from Supabase...');
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Fetched ideas:', data);
      
      // Convert to IdeaWithAuthors format (simplified for now)
      const ideasWithAuthors: IdeaWithAuthors[] = (data || []).map(idea => ({
        ...idea,
        authors: [{ id: idea.author_id[0], name: idea.author_id[0], email: '', role: '', created_at: '' }]
      }));
      set({ ideas: ideasWithAuthors });
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
        authors: [{ id: author, name: author, email: '', role: '', created_at: '' }]
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
  
  // Loading state
  isLoading: false,
  
  // Match ideas state
  matchIdeas: [],
  setMatchIdeas: (ideas) => set({ matchIdeas: ideas }),
  showMatchModal: false,
  setShowMatchModal: (show) => set({ showMatchModal: show }),
  
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
}));
