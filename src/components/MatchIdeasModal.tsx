'use client';
import React from 'react';
import { FiX, FiMessageCircle } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';
import IdeaCard from './IdeaCard';

const MatchIdeasModal: React.FC = () => {
  const { matchIdeas, showMatchModal, setShowMatchModal, currentMatchSourceIdea } = useAppStore();

  if (!showMatchModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentMatchSourceIdea ? `为 "${currentMatchSourceIdea.title}" 找到的灵感` : '建议讨论'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              我们发现了{matchIdeas.length}个相似的想法，建议你与作者进行讨论
            </p>
          </div>
          <button
            onClick={() => setShowMatchModal(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX className="text-gray-500" />
          </button>
        </div>

        {/* Similar Ideas */}
        <div className="p-6">
          <div className="space-y-4">
            {matchIdeas.map((match, index) => (
              <div key={match.idea.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {match.idea.authors[0].name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {match.idea.authors[0].name}
                      </div>
                      <div className="text-xs text-gray-500">
                        相似度: {(match.similarity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                    <FiMessageCircle size={14} />
                    发起讨论
                  </button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {match.idea.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {match.idea.content}
                  </p>
                  
                  {match.idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {match.idea.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={() => setShowMatchModal(false)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            稍后再说
          </button>
          <button
            onClick={() => {
              // Implement action to start discussion
              setShowMatchModal(false);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            立即讨论
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchIdeasModal;
