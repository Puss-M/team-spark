'use client';
import React, { useState } from 'react';
import { FiLock, FiUnlock, FiSend } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';
import { matchIdeasFromDatabase } from '../lib/ai';
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

  // Local state for loading during collision matching
  const [isMatching, setIsMatching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIdea.title.trim() || !newIdea.content.trim() || !author.trim()) {
      return;
    }

    if (isMatching) {
      return; // Prevent duplicate submissions
    }
    
    try {
      setIsMatching(true);
      
      // Create temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      
      // Step 1: Generate embedding via API call to server
      console.log('📝 步骤 1/3: 生成语义向量...');
      let embedding: number[];
      
      try {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Embedding 生成失败: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        embedding = data.embedding;
        console.log('✅ Embedding 生成成功，维度:', embedding.length);
      } catch (error: any) {
        console.error('❌ Embedding 生成失败:', error);
        alert(`❌ 步骤 1/3 失败：语义向量生成出错\n\n错误详情: ${error.message}\n\n请检查网络连接或稍后重试`);
        return;
      }
      
      // Create a new idea object for optimistic update
      const optimisticIdea: Idea = {
        id: tempId,
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
      
      // 🚀 OPTIMISTIC UPDATE: Add to UI immediately
      console.log('⚡ 乐观更新：立即显示灵感到 Feed');
      addIdea({
        ...optimisticIdea,
        authors: [{ id: author, name: author, email: '', role: '', created_at: new Date().toISOString() }],
      });
      
      // Reset form immediately for better UX
      resetNewIdea();
      
      // Step 2: Match similar ideas using database RPC
      console.log('🔍 步骤 2/3: 碰撞匹配相似灵感...');
      console.log('👤 当前用户:', author);
      
      try {
        const matchedIdeas = await matchIdeasFromDatabase(
          embedding,
          author,
          0.7, // threshold
          10   // max results
        );
        
        console.log('✨ 碰撞结果数量:', matchedIdeas.length);
        if (matchedIdeas.length > 0) {
          console.log('🎯 匹配到的灵感:', matchedIdeas);
          setMatchIdeas(matchedIdeas);
          setShowMatchModal(true);
        } else {
          console.log('ℹ️ 没有找到匹配的灵感 (可能是阈值太高或没有其他用户的灵感)');
        }
      } catch (error: any) {
        console.warn('⚠️ 碰撞匹配失败（不影响发布）:', error);
        // 碰撞失败不应该阻止发布，所以只是警告
      }

      // Step 3: Persist to Supabase
      console.log('💾 步骤 3/3: 保存到数据库...');
      
      try {
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
          console.error('❌ 数据库插入失败:', error);
          
          // 🔄 ROLLBACK: Remove optimistic update on error
          console.log('⚠️ 回滚：移除乐观更新的灵感');
          const { ideas } = useIdeasStore.getState();
          useIdeasStore.setState({
            ideas: ideas.filter(i => i.id !== tempId)
          });
          
          // 提供更具体的错误信息
          let errorMessage = '数据库保存失败';
          
          if (error.message.includes('permission') || error.message.includes('policy')) {
            errorMessage = '❌ 步骤 3/3 失败：数据库权限不足\n\n请在 Supabase 中运行 supabase/setup_permissions.sql 脚本来设置权限';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = '❌ 步骤 3/3 失败：网络连接错误\n\n请检查网络连接并重试';
          } else {
            errorMessage = `❌ 步骤 3/3 失败：${error.message}\n\n错误代码: ${error.code || '未知'}`;
          }
          
          alert(errorMessage);
          return;
        }
        
        console.log('✅ 保存成功！ID:', insertedData?.id);
        
        // ✨ UPDATE: Replace temp ID with real ID from database
        if (insertedData) {
          console.log('🔄 更新：用真实 ID 替换临时 ID');
          const { ideas } = useIdeasStore.getState();
          useIdeasStore.setState({
            ideas: ideas.map(i => 
              i.id === tempId 
                ? { ...i, id: insertedData.id }
                : i
            )
          });
        }
        
        // 成功提示
        console.log('🎉 灵感发布成功！');
      } catch (error: any) {
        console.error('❌ 未预期的错误:', error);
        
        // 🔄 ROLLBACK: Remove optimistic update on error
        const { ideas } = useIdeasStore.getState();
        useIdeasStore.setState({
          ideas: ideas.filter(i => i.id !== tempId)
        });
        
        alert(`❌ 步骤 3/3 失败：发生未预期的错误\n\n${error.message || '请稍后重试'}`);
        return;
      }
    } catch (error: any) {
      console.error('💥 提交失败:', error);
      alert(`提交失败：${error.message || '未知错误，请重试'}`);
    } finally {
      setIsMatching(false);
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
          disabled={isMatching}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isMatching
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isMatching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              正在碰撞灵感...
            </>
          ) : (
            <>
              发布并碰撞灵感
              <FiSend size={16} />
            </>
          )}
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
