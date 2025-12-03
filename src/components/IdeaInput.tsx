'use client';
import React from 'react';
import { FiLock, FiUnlock, FiSend } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';
import { matchIdeas } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { Idea } from '../types';


const IdeaInput: React.FC = () => {
  const {
    newIdea,
    setNewIdea,
    addIdea,
    ideas,
    user,
    setMatchIdeas,
    setShowMatchModal,
    resetNewIdea,
    author,
    setAuthor
  } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIdea.title.trim() || !newIdea.content.trim() || !author.trim()) {
      return;
    }
    
    try {
      // Generate embedding via API call to server
      const response = await fetch('/api/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${newIdea.title} ${newIdea.content} ${newIdea.tags.join(' ')}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }
      
      const { embedding } = await response.json();
      
      // Create a new idea object
      const idea: Idea = {
        id: Date.now().toString(),
        author_id: [author],
        title: newIdea.title,
        content: newIdea.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: newIdea.isPublic,
        tags: newIdea.tags,
        comments_count: 0,
        likes_count: 0,
        embedding,
      };
      
      // Match similar ideas (now synchronous)
      const matchedIdeas = matchIdeas(
        idea,
        ideas,
        author,
        0.8
      );
      
      if (matchedIdeas.length > 0) {
        setMatchIdeas(matchedIdeas);
        setShowMatchModal(true);
      }

      // Persist to Supabase
      const { data: insertedData, error } = await supabase
        .from('ideas')
        .insert({
          // Let Supabase generate the UUID
          author_id: [author],
          title: newIdea.title,
          content: newIdea.content,
          is_public: newIdea.isPublic,
          tags: newIdea.tags,
          embedding
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting into Supabase:', error);
        throw error;
      }
      
      // Add the new idea to the list (using the real ID from DB)
      if (insertedData) {
        addIdea({
          ...idea,
          id: insertedData.id, // Use the real UUID
          authors: [{ id: author, name: author, email: '', role: '', created_at: new Date().toISOString() }],
        });
      }
      
      // Reset the form
      resetNewIdea();
    } catch (error) {
      console.error('Error submitting idea:', error);
      alert('提交灵感时出错，请重试');
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setNewIdea({ content });
    
    // Extract tags from content (starting with #)
    const tags = content.match(/#[\w\u4e00-\u9fa5]+/g) || [];
    setNewIdea({ tags });
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-4">记录你的灵感</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Author Input */}
        <div className="mb-3">
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            你的名字
          </label>
          <input
            type="text"
            id="author"
            placeholder="请输入你的名字"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        
        {/* Title Input */}
        <input
          type="text"
          placeholder="标题"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ title: e.target.value })}
        />
        
        {/* Content Input */}
        <textarea
          placeholder="写下你的想法...支持使用 @提及成员或 #添加标签"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 min-h-[150px] resize-none"
          value={newIdea.content}
          onChange={handleContentChange}
        />
        
        {/* Tags Preview */}
        {newIdea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {newIdea.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Permission Selection */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <FiUnlock className="text-gray-400" />
              <span className={`text-sm font-medium ${
                newIdea.isPublic ? 'text-blue-600' : 'text-gray-500'
              }`}>
                公开
              </span>
              <input
                type="radio"
                name="permission"
                value="public"
                checked={newIdea.isPublic}
                onChange={() => setNewIdea({ isPublic: true })}
                className="hidden"
              />
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <FiLock className="text-gray-400" />
              <span className={`text-sm font-medium ${
                !newIdea.isPublic ? 'text-blue-600' : 'text-gray-500'
              }`}>
                私有
              </span>
              <input
                type="radio"
                name="permission"
                value="private"
                checked={!newIdea.isPublic}
                onChange={() => setNewIdea({ isPublic: false })}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          发布并碰撞灵感
          <FiSend size={16} />
        </button>
      </form>
      
      {/* Collision Result Preview */}
      <div className="mt-6 p-3 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">碰撞结果预览：</h3>
        <p className="text-sm text-gray-500">
          提交后，这里将显示相关的历史灵感...
        </p>
      </div>
    </div>
  );
};

export default IdeaInput;
