import React, { useState, useRef } from 'react';
import { FiLock, FiUnlock, FiSend, FiLink } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';
import { matchIdeasFromDatabase } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { Idea, IdeaWithAuthors } from '../types';
import GroupCreationDialog from './GroupCreationDialog';
import MarkdownRenderer from './MarkdownRenderer';


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
    username,
    setUsername
  } = useAppStore();

  // Local state for loading during collision matching
  const [isMatching, setIsMatching] = useState(false);
  const [isExtractingTags, setIsExtractingTags] = useState(false);
  
  // Group creation dialog state
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('write');
  const [pendingGroupIdeas, setPendingGroupIdeas] = useState<IdeaWithAuthors[]>([]);
  const [pendingSourceIdea, setPendingSourceIdea] = useState<{title: string; content: string; tags: string[]} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIdea.title.trim() || !newIdea.content.trim() || !username.trim()) {
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
        author_id: [username],
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
        authors: [{ id: username, name: username, email: '', role: '', created_at: new Date().toISOString() }]
      });
      
      // Reset form immediately for better UX
      resetNewIdea();
      
      // Step 2: Match similar ideas using database RPC
      console.log('🔍 步骤 2/3: 碰撞匹配相似灵感...');
      console.log('👤 当前用户:', username);
      
      try {
        const matchedIdeas = await matchIdeasFromDatabase(
          embedding,
          username,
          0.7, // threshold
          10   // max results
        );
        
        console.log('✨ 碰撞结果数量:', matchedIdeas.length);
        
        if (matchedIdeas.length >= 2) {
          // Multiple matches - suggest group creation
          console.log('🎯 发现多个匹配，建议创建小组');
          setPendingGroupIdeas(matchedIdeas.map(m => m.idea));
          setPendingSourceIdea({
            title: newIdea.title,
            content: newIdea.content,
            tags: newIdea.tags
          });
          setShowGroupDialog(true);
        } else if (matchedIdeas.length === 1) {
          // Single match - show traditional match modal
          console.log('🎯 匹配到 1 个灵感');
          setMatchIdeas(matchedIdeas);
          setShowMatchModal(true);
        } else {
          console.log('ℹ️ 没有找到匹配的灵感');
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
            author_id: [username],
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
          const { ideas } = useAppStore.getState();
          useAppStore.setState({
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
          const { ideas } = useAppStore.getState();
          useAppStore.setState({
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
        const { ideas } = useAppStore.getState();
        useAppStore.setState({
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newIdea.content.substring(start, end);
    const linkText = `[[${selectedText || '灵感标题'}]]`;
    
    const newContent = 
      newIdea.content.substring(0, start) + 
      linkText + 
      newIdea.content.substring(end);
      
    setNewIdea({ content: newContent });
    
    // Set focus back and adjust cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + linkText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle group creation
  const handleGroupCreation = async (groupName: string) => {
    try {
      // Create group in database
      const { data: groupData, error: groupError } = await supabase
        .from('idea_groups')
        .insert({
          name: groupName,
          description: `由${pendingGroupIdeas.length + 1}个相似灵感组成的协作小组`
        })
        .select()
        .single();

      if (groupError) {
        console.error('Group creation error:', groupError);
        alert('小组创建失败：' + groupError.message);
        return;
      }

      console.log('✅ 小组创建成功:', groupData);

      // TODO: Add ideas to group  
      // 这部分需要在灵感创建完成后再添加到小组
      
      setShowGroupDialog(false);
      setPendingGroupIdeas([]);
      setPendingSourceIdea(null);
      
      alert(`🎉 小组 "${groupName}" 创建成功！`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      alert('创建小组时出错：' + error.message);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-4">记录你的灵感</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Title Input */}
        <input
          type="text"
          placeholder="标题"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ title: e.target.value })}
        />
        
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'write' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            编辑
            {activeTab === 'write' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'preview' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            预览
            {activeTab === 'preview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'split' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            分屏
            {activeTab === 'split' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          
          <div className="flex-1" />
          
          {/* Toolbar Actions */}
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="插入引用 ([[标题]])"
          >
            <FiLink size={16} />
          </button>
        </div>

        {/* Content Input / Preview */}
        {activeTab === 'split' ? (
          <div className="flex gap-4 mb-3 h-[400px]">
             {/* Left: Input */}
             <textarea
              ref={textareaRef}
              placeholder="写下你的想法...支持使用 @提及成员或 #添加标签"
              className="w-1/2 h-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              value={newIdea.content}
              onChange={handleContentChange}
            />
            {/* Right: Preview */}
            <div className="w-1/2 h-full px-4 py-2 rounded-lg border border-gray-200 overflow-y-auto bg-white prose prose-sm max-w-none">
              {newIdea.content ? (
                <MarkdownRenderer content={newIdea.content} />
              ) : (
                <span className="text-gray-400">实时预览区域...</span>
              )}
            </div>
          </div>
        ) : activeTab === 'write' ? (
          <textarea
          ref={textareaRef}
          placeholder="写下你的想法...支持使用 @提及成员或 #添加标签"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 min-h-[150px] resize-none"
          value={newIdea.content}
          onChange={handleContentChange}
        />
        ) : (
          <div className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3 flex-1 min-h-[150px] overflow-y-auto bg-white prose prose-sm max-w-none">
             {newIdea.content ? (
              <MarkdownRenderer content={newIdea.content} />
            ) : (
              <span className="text-gray-400">预览区域...</span>
            )}
          </div>
        )}
        
        {/* Tags Preview with Remove */}
        {newIdea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {newIdea.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    const newTags = newIdea.tags.filter((_, i) => i !== index);
                    setNewIdea({ tags: newTags });
                  }}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Suggest Tags Button */}
        <div className="mb-3">
          <button
            type="button"
            onClick={async () => {
              if (!newIdea.title && !newIdea.content) {
                alert('请先输入标题或内容');
                return;
              }
              
              setIsExtractingTags(true);
              try {
                const response = await fetch('/api/extract-tags', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: newIdea.title,
                    content: newIdea.content
                  })
                });
                
                if (!response.ok) throw new Error('标签提取失败');
                
                const { tags } = await response.json();
                // Merge with existing tags, remove duplicates
                const allTags = [...new Set([...newIdea.tags, ...tags])];
                setNewIdea({ tags: allTags });
              } catch (error: any) {
                console.error('Tag extraction error:', error);
                alert('标签建议失败：' + error.message);
              } finally {
                setIsExtractingTags(false);
              }
            }}
            disabled={isExtractingTags}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExtractingTags ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>建议中...</span>
              </>
            ) : (
              <>
                <span>💡</span>
                <span>建议标签</span>
              </>
            )}
          </button>
        </div>
        
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
      
      {/* Group Creation Dialog */}
      {showGroupDialog && pendingSourceIdea && (
        <GroupCreationDialog
          matchedIdeas={pendingGroupIdeas}
          sourceIdea={pendingSourceIdea}
          onConfirm={handleGroupCreation}
          onCancel={() => {
            setShowGroupDialog(false);
            setPendingGroupIdeas([]);
            setPendingSourceIdea(null);
          }}
        />
      )}
      
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
