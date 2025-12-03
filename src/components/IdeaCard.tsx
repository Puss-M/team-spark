'use client';
import React, { useState } from 'react';
import { FiMessageCircle, FiTag, FiClock, FiUser, FiTrash2 } from 'react-icons/fi';
import { IdeaWithAuthors } from '../types';
import { useAppStore } from '../store/useAppStore';

interface IdeaCardProps {
  idea: IdeaWithAuthors;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { recallIdea, user, author } = useAppStore();
  
  // Check if current user is the author
  const isAuthor = idea.authors.some(a => a.name === author);

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

  return (
    <>
      <div 
        className="group relative bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
        onClick={() => setIsExpanded(true)}
      >
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
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {idea.authors[0].name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm">
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
          {/* Comment icon moved to footer or kept here if needed, but trash icon is top-right now */}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 pr-8">
          {idea.title}
        </h3>

        {/* Content */}
        <div className="mb-3">
          <p className="text-gray-600 mb-1 line-clamp-3">
            {idea.content}
          </p>
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
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <FiMessageCircle size={14} />
              <span>{idea.comments_count} 评论</span>
            </button>
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
      
      {/* Expanded Modal */}
      {isExpanded && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {idea.authors[0].name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium">
                      {idea.authors[0].name}
                    </span>
                    {idea.authors.length > 1 && (
                      <span className="text-gray-400">
                        +{idea.authors.length - 1}
                      </span>
                    )}
                    <span className="text-gray-400">({idea.authors[0].role})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <FiClock size={12} />
                    <span>{formatRelativeTime(idea.created_at)}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4">
              {idea.title}
            </h3>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {idea.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded-full"
                >
                  <FiTag size={10} />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {idea.content}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
              <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                <FiMessageCircle size={16} />
                <span>{idea.comments_count} 评论</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IdeaCard;
