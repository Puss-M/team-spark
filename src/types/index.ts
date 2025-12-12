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
  // Prediction Market & Bounty
  status: 'idea' | 'project';
  is_bounty: boolean;
  bounty_amount: number;
  bounty_winner_id?: string;
  stock_price?: number; // Visual only, derived from total investments
  // Failure Graveyard
  is_failed?: boolean;
  failure_reason?: string;
  failed_at?: string;
}

export interface UserWallet {
  id: string;
  user_name: string;
  balance: number;
  total_earned: number;
  total_invested: number;
}

export interface Investment {
  id: string;
  user_name: string;
  idea_id: string;
  amount: number;
  timestamp: string;
  roi?: number;
}

export interface Transaction {
  id: string;
  user_name: string;
  type: 'bet' | 'payout' | 'bounty_post' | 'bounty_win' | 'deposit' | 'withdrawal';
  amount: number;
  related_entity_id?: string;
  description: string;
  created_at: string;
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
