import { create } from 'zustand';
import { Idea, IdeaWithAuthors, MatchIdea, User } from '../types';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Ideas state
  ideas: IdeaWithAuthors[];
  setIdeas: (ideas: IdeaWithAuthors[]) => void;
  addIdea: (idea: IdeaWithAuthors) => void;
  updateIdea: (idea: IdeaWithAuthors) => void;
  
  // Search and filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'latest' | 'popular';
  setSortBy: (sortBy: 'latest' | 'popular') => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  
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

export const useAppStore = create<AppState>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Ideas state
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  updateIdea: (updatedIdea) => set((state) => ({
    ideas: state.ideas.map((idea) =>
      idea.id === updatedIdea.id ? updatedIdea : idea
    )
  })),
  
  // Search and filter state
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  sortBy: 'latest',
  setSortBy: (sortBy) => set({ sortBy }),
  selectedGroup: null,
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  selectedTags: [],
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  
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
