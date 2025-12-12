'use client';
import React, { useEffect, useState, useCallback } from 'react';
import IdeaCard from './IdeaCard';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { FiHash, FiGrid, FiSearch } from 'react-icons/fi';
import IdeaDetailModal from './IdeaDetailModal';

const CommunityBoard: React.FC = () => {
  const { ideas, fetchIdeas, isLoading, sortBy, setSortBy, searchQuery, setSearchQuery, username, updateIdea } = useAppStore();
  const [boardViewMode, setBoardViewMode] = React.useState<'overview' | 'topic'>('overview');
  const [isAutoTagging, setIsAutoTagging] = React.useState(false);
  const [autoTagProgress, setAutoTagProgress] = React.useState({ current: 0, total: 0 });
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Handle input change (no longer triggers search automatically)
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setSearchQuery(localSearchQuery);
  };

  // Handle enter key press
  const handleSearchInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(localSearchQuery);
    }
  };

  // Fetch ideas on component mount and when searchQuery or sortBy changes
  useEffect(() => {
    fetchIdeas();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('community-ideas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ideas' },
        (payload) => {
          fetchIdeas();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ideas' },
        (payload) => {
          // Ideally fetch specific idea or just refetch all
           fetchIdeas();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchIdeas, searchQuery, sortBy]);

  // Filter for only public ideas for the Community Board
  const publicIdeas = ideas.filter(idea => idea.is_public);

  // Group ideas by tags
  const groupIdeasByTag = () => {
    const groups: { [tag: string]: typeof ideas } = {};
    const untagged: typeof ideas = [];

    publicIdeas.forEach(idea => {
      if (!idea.tags || idea.tags.length === 0) {
        untagged.push(idea);
      } else {
        idea.tags.forEach(tag => {
          // Clean up tag string (remove # if present)
          const cleanTag = tag.replace(/^#/, '');
          if (!groups[cleanTag]) {
            groups[cleanTag] = [];
          }
          if (!groups[cleanTag].find(i => i.id === idea.id)) {
            groups[cleanTag].push(idea);
          }
        });
      }
    });

    return { groups, untagged };
  };

  const { groups: tagGroups, untagged: untaggedIdeas } = groupIdeasByTag();
  
  // Sort tags by number of ideas (descending)
  const sortedTags = Object.keys(tagGroups).sort((a, b) => {
    return tagGroups[b].length - tagGroups[a].length;
  });



  // Auto Tagging Logic
  const handleAutoClassify = async () => {
    if (!confirm(`确定要为 ${untaggedIdeas.length} 个未分类灵感自动生成标签吗？\n这一过程可能需要一些时间。`)) {
      return;
    }

    setIsAutoTagging(true);
    setAutoTagProgress({ current: 0, total: untaggedIdeas.length });
    
    let processedCount = 0;

    for (const idea of untaggedIdeas) {
      try {
        // Skip if content is too short to tag effectively
        if ((!idea.title && !idea.content) || (idea.content.length < 5 && !idea.title)) {
           processedCount++;
           setAutoTagProgress(prev => ({ ...prev, current: processedCount }));
           continue;
        }

        const response = await fetch('/api/extract-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: idea.title,
            content: idea.content
          })
        });

        if (response.ok) {
          const { tags } = await response.json();
          if (tags && tags.length > 0) {
             // Update Supabase
             const { error } = await supabase
               .from('ideas')
               .update({ tags })
               .eq('id', idea.id);

             if (!error) {
               // Update local store
               updateIdea({ ...idea, tags });
             }
          }
        }
      } catch (error) {
        console.error(`Auto tag failed for idea ${idea.id}`, error);
      }
      
      processedCount++;
      setAutoTagProgress(prev => ({ ...prev, current: processedCount }));
    }

    setIsAutoTagging(false);
    alert('自动分类完成！');
    fetchIdeas(); // Hard refresh to ensure consistency
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      {/* Search and Sort Control Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input with Button */}
          <div className="relative w-full md:w-80 flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search ideas..."
                value={localSearchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchInputKeyPress}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleSearchClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <FiSearch size={16} />
              <span className="hidden sm:inline">搜索</span>
            </button>
          </div>

          {/* Sorting Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                sortBy === 'latest'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                sortBy === 'popular'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              热度
            </button>
            <button
              onClick={() => setSortBy('recommend')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                sortBy === 'recommend'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              为你 <span className="inline-block ml-1">✨</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        {/* Header Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <FiGrid size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">实验室广场</h2>
            <p className="text-xs text-gray-500">探索整个实验室的灵感与讨论</p>
          </div>
        </div>

        {/* Action Area: Toggles and Auto-Classify */}
        <div className="flex items-center gap-3">
          {/* Auto Classify Button (Only show if untagged ideas exist) */}
          {untaggedIdeas.length > 0 && (
             <button
               onClick={handleAutoClassify}
               disabled={isAutoTagging}
               className="bg-white border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-50"
               title="为未分类灵感自动生成标签"
             >
               {isAutoTagging ? (
                 <>
                   <span className="animate-spin">⏳</span>
                   <span>分类中 ({autoTagProgress.current}/{autoTagProgress.total})</span>
                 </>
               ) : (
                 <>
                    <span>✨</span>
                    <span className="hidden sm:inline">一键分类 ({untaggedIdeas.length})</span>
                    <span className="sm:hidden">分类</span>
                 </>
               )}
             </button>
          )}

          {/* View Toggle */}
          <div className="bg-gray-200 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setBoardViewMode('overview')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                boardViewMode === 'overview'
                  ? 'bg-white text-gray-800 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              总览
            </button>
            <button
              onClick={() => setBoardViewMode('topic')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                boardViewMode === 'topic'
                  ? 'bg-white text-gray-800 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              分话题
            </button>
          </div>
        </div>
      </div>
      
      {ideas.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-dashed border-gray-200 shadow-sm">
          <p>暂时还没有任何灵感讨论</p>
        </div>
      ) : (
        <>
          {/* Overview Mode (Grid) */}
          {boardViewMode === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
               {publicIdeas.map((idea) => (
                 <IdeaCard key={idea.id} idea={idea} />
               ))}
             </div>
          )}

          {/* Topic Mode (Cluster) */}
          {boardViewMode === 'topic' && (
            <div className="space-y-8">
              {/* Render Tag Groups */}
              {sortedTags.map(tag => (
                <div key={tag}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                      <FiHash size={16} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{tag}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      {tagGroups[tag].length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {tagGroups[tag].map(idea => (
                      <IdeaCard key={`${tag}-${idea.id}`} idea={idea} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Render Untagged Ideas */}
              {untaggedIdeas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500">
                      <span className="text-sm font-bold">#</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">未分类话题</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      {untaggedIdeas.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {untaggedIdeas.map(idea => (
                      <IdeaCard key={`untagged-${idea.id}`} idea={idea} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Global Idea Detail Modal */}
      <IdeaDetailModal />
    </div>
  );
};

export default CommunityBoard;
