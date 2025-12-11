import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiClock, FiTag, FiTrash2, FiHeart, FiSend } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';
import MarkdownRenderer from './MarkdownRenderer';

const IdeaDetailModal: React.FC = () => {
  const { 
    activeIdea, 
    setActiveIdea, 
    toggleLike, 
    username, 
    comments, 
    fetchComments, 
    addComment, 
    deleteComment 
  } = useAppStore();
  
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (activeIdea) {
      fetchComments(activeIdea.id);
    }
  }, [activeIdea?.id, fetchComments]);

  if (!activeIdea) return null;

  const handleClose = () => setActiveIdea(null);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(activeIdea.id);
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    setIsSubmittingComment(true);
    await addComment(activeIdea.id, commentContent);
    setCommentContent('');
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('确定要删除这条评论吗？')) {
      await deleteComment(commentId, activeIdea.id);
    }
  };

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

  const ideaComments = comments[activeIdea.id] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out transform scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-lg">
                {activeIdea.authors[0].name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-gray-900 font-medium">
                  {activeIdea.authors[0].name}
                </span>
                {activeIdea.authors.length > 1 && (
                  <span className="text-gray-500">
                    +{activeIdea.authors.length - 1}
                  </span>
                )}
                <span className="text-gray-500">({activeIdea.authors[0].role})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <FiClock size={12} />
                <span>{formatRelativeTime(activeIdea.created_at)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {activeIdea.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {activeIdea.tags.map((tag, index) => (
            <span
              key={index}
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full"
            >
              <FiTag size={10} />
              <span>{tag}</span>
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="text-gray-700 leading-relaxed text-lg prose prose-lg max-w-none">
            <MarkdownRenderer content={activeIdea.content} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mb-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition-colors ${
              activeIdea.liked_by_user
                ? 'text-red-400 hover:text-red-500'
                : 'text-gray-400 hover:text-red-400'
            }`}
          >
            {activeIdea.liked_by_user ? (
              <FaHeart size={16} />
            ) : (
              <FiHeart size={16} />
            )}
            <span>{activeIdea.likes_count} 点赞</span>
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <FiMessageCircle size={16} />
            <span>{activeIdea.comments_count} 评论</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiMessageCircle />
            评论 ({ideaComments.length})
          </h4>

          {/* Comment Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder={username ? "写下你的想法..." : "请先登录" }
              className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              disabled={!username || isSubmittingComment}
            />
            <button
              onClick={handleAddComment}
              disabled={!username || !commentContent.trim() || isSubmittingComment}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSend size={16} />
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {ideaComments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">
                暂无评论，快来抢沙发吧~
              </p>
            ) : (
              ideaComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group/comment">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-gray-500 text-xs font-medium">
                      {comment.user_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {comment.content}
                    </p>
                  </div>
                  {/* Delete button (only for comment author) */}
                  {username === comment.user_name && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailModal;
