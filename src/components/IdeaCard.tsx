'use client';
import React, { useState } from 'react';
import { FiMessageCircle, FiTag, FiClock, FiUser, FiTrash2, FiHeart, FiSend } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa'; // Filled heart for liked state
import { IdeaWithAuthors } from '../types';
import { useAppStore } from '../store/useAppStore';
import MarkdownRenderer from './MarkdownRenderer';
import { runAutoReviewer } from '../services/aiReviewer';

interface IdeaCardProps {
  idea: IdeaWithAuthors;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const { setActiveIdea, recallIdea, findMatchesForIdea, toggleLike, user, username, comments, userInterests, addComment } = useAppStore();
  
  // Check if current user is the author
  const isAuthor = idea.authors.some(a => a.name === username);
  
  // Check if idea matches user's interests
  const hasMatchingTag = userInterests.length > 0 && idea.tags.some(tag => 
    userInterests.includes(tag)
  );

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    
    return date.toLocaleDateString();
  };

  const handleRecall = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    setShowDeleteConfirm(true);
  };

  const confirmRecall = () => {
    recallIdea(idea);
    setShowDeleteConfirm(false);
  };

  const handleFindInspiration = (e: React.MouseEvent) => {
    e.stopPropagation();
    findMatchesForIdea(idea);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(idea.id);
  };

  return (
    <>
      {/* Wrapper for gradient border effect */}
      <div className={`relative rounded-lg ${
        hasMatchingTag 
          ? 'p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse' 
          : ''
      }`}>
        <div 
          className={`group relative bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300 ${
            idea.match_score && idea.match_score > 0
              ? 'border-yellow-300 ring-1 ring-yellow-200 hover:ring-yellow-300'
              : hasMatchingTag
                ? 'border-transparent'
                : 'border-gray-200'
          }`}
          onClick={() => setActiveIdea(idea)}
        >
        {/* Recommended Badge */}
        {idea.match_score && idea.match_score > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <span className="inline-block">✨</span>
            <span>推荐</span>
          </div>
        )}
        {/* Recall Button (Visible on Hover for Author) */}
        {isAuthor && (
          <button
            onClick={handleRecall}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            title="撤回灵感"
          >
            <FiTrash2 size={16} />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-xs">
                {idea.authors[0].name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-700 font-medium">
                  {idea.authors[0].name}
                </span>
                {idea.authors.length > 1 && (
                  <span className="text-gray-500">
                    +{idea.authors.length - 1}
                  </span>
                )}
                <span className="text-gray-400">({idea.authors[0].role})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <FiClock size={12} />
                <span>{formatRelativeTime(idea.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-800 mb-2 pr-8">
          {idea.title}
        </h3>

        {/* Content */}
        <div className="mb-2">
          <div className="text-gray-600 mb-1 line-clamp-2 prose prose-sm max-w-none">
            <MarkdownRenderer content={idea.content} />
          </div>
          {idea.content.length > 150 && (
            <p className="text-blue-600 text-sm hover:underline">
              阅读更多...
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {idea.tags.map((tag, index) => (
            <span
              key={index}
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
            >
              <FiTag size={10} />
              <span>{tag}</span>
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                idea.liked_by_user 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {idea.liked_by_user ? (
                <FaHeart size={14} />
              ) : (
                <FiHeart size={14} />
              )}
              <span>{idea.likes_count} 点赞</span>
            </button>
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <FiMessageCircle size={14} />
              <span>{idea.comments_count} 评论</span>
            </button>
            
            {/* 投资按钮 */}
            {!isAuthor && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const amount = prompt('投资多少 Spark Coins？');
                  if (amount && !isNaN(Number(amount))) {
                    const success = await useAppStore.getState().investInIdea(idea.id, Number(amount));
                    if (success) {
                      // 更新ideas以触发重新渲染
                      useAppStore.getState().fetchIdeas();
                    }
                  }
                }}
                className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-full transition-colors"
              >
                <span>💰</span>
                <span>投资</span>
              </button>
            )}
          </div>
          
           {/* Find Inspiration Button (Only for Author) */}
          {isAuthor && (
            <>
              <button
                onClick={handleFindInspiration}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <span>✨</span>
                <span>寻找灵感</span>
              </button>
              
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (aiAnalyzing) return;
                  
                  setAiAnalyzing(true);
                  try {
                    const result = await runAutoReviewer(idea.content);
                    setAiResult(result);
                    
                    // 将AI分析作为评论添加
                    await addComment(idea.id, result, 'AI Research Assistant');
                    
                    useAppStore.getState().showToast('AI分析完成！', 'success');
                  } catch (error) {
                    console.error('AI analysis error:', error);
                    useAppStore.getState().showToast('AI分析失败，请检查API密钥', 'error');
                  } finally {
                    setAiAnalyzing(false);
                  }
                }}
                disabled={aiAnalyzing}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  aiAnalyzing 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                }`}
              >
                <span>🤖</span>
                <span>{aiAnalyzing ? '分析中...' : 'AI分析'}</span>
              </button>
            </>
          )}
        </div>
      </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl transform transition-all scale-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认撤回？</h3>
            <p className="text-gray-500 mb-6">
              撤回后，这条灵感将从列表中删除，内容会回到输入框供你重新编辑。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={confirmRecall}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                确定撤回
              </button>
            </div>
          </div>
        </div>
      )}
      

    </>
  );
};

export default IdeaCard;
