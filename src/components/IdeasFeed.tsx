'use client';
import React, { useEffect } from 'react';
import IdeaCard from './IdeaCard';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const IdeasFeed: React.FC = () => {
  const { ideas, fetchIdeas, isLoading } = useAppStore();

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

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">灵感流</h2>
      
      {ideas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          还没有灵感，快来发布第一个吧！
        </div>
      ) : (
        ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))
      )}
    </div>
  );
};

export default IdeasFeed;
