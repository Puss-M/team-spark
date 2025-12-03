'use client';
import React, { useEffect } from 'react';
import IdeaCard from './IdeaCard';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const IdeasFeed: React.FC = () => {
  const { ideas, fetchIdeas, isLoading, viewMode, setViewMode, author } = useAppStore();

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

  const filteredIdeas = viewMode === 'mine' 
    ? ideas.filter(idea => idea.authors.some(a => a.name === author))
    : ideas;

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
        <h2 className="text-xl font-bold text-gray-800">灵感流</h2>
        
        {/* View Mode Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('mine')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'mine'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            我的灵感
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            灵感广场
          </button>
        </div>
      </div>
      
      {filteredIdeas.length === 0 ? (
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
          {filteredIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeasFeed;
