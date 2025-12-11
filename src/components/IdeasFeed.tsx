'use client';
import React, { useEffect } from 'react';
import IdeaCard from './IdeaCard';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const IdeasFeed: React.FC = () => {
  const { ideas, fetchIdeas, isLoading, viewMode, setViewMode, sortBy, username } = useAppStore();

  // Fetch ideas on component mount
  useEffect(() => {
    fetchIdeas();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('ideas-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ideas' },
        (payload) => {
          // Fetch latest ideas when a new one is added
          fetchIdeas();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchIdeas]);

  // Filter by view mode (mine vs all)
  const filteredIdeas = viewMode === 'mine' 
    ? ideas.filter(idea => idea.authors.some(a => a.name === username))
    : ideas;

  // Sort by sortBy (latest vs popular)
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === 'popular') {
      // Sort by hotness: likes_count + comments_count
      const hotnessA = a.likes_count + a.comments_count;
      const hotnessB = b.likes_count + b.comments_count;
      return hotnessB - hotnessA; // Descending order
    } else {
      // Sort by latest (default)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">我的灵感流</h2>
      </div>
      
      {sortedIdeas.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          {viewMode === 'mine' ? (
            <>
              <p className="mb-2">还没有属于你的灵感</p>
              <p className="text-sm">快去右侧发布第一个想法吧！✨</p>
            </>
          ) : (
            <p>暂时还没有任何灵感</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeasFeed;
