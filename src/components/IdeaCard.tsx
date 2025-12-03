'use client';
import React from 'react';
import { FiMessageCircle, FiTag, FiClock, FiUser } from 'react-icons/fi';
import { IdeaWithAuthors } from '../types';

interface IdeaCardProps {
  idea: IdeaWithAuthors;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
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
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <FiMessageCircle size={18} />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {idea.title}
      </h3>

      {/* Content */}
      <p className="text-gray-600 mb-3 line-clamp-3">
        {idea.content}
      </p>

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
  );
};

export default IdeaCard;
