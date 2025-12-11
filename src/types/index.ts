export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  created_at: string;
  embedding?: number[];
}

export interface Idea {
  id: string;
  author_id: string[];
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  tags: string[];
  comments_count: number;
  likes_count: number;
  embedding?: number[];
  liked_by_user?: boolean; // Whether current user has liked this idea
  match_score?: number; // Match score for recommendations
}

export interface Comment {
  id: string;
  idea_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

// Social Group Types
export interface SocialGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  invite_code: string;
}

export interface SocialGroupMember {
  id: string;
  group_id: string;
  user_name: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface SocialGroupMessage {
  id: string;
  group_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  members: string[];
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IdeaWithAuthors extends Idea {
  authors: User[];
}

export interface MatchIdea {
  idea: IdeaWithAuthors;
  similarity: number;
}
