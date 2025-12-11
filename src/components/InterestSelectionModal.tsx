'use client';
import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

interface InterestSelectionModalProps {
  onComplete: (interests: string[]) => void;
  onSkip: () => void;
}

// 预设标签列表（包含金融类标签）
const PRESET_TAGS = [
  '技术', '设计', 'AI', '产品', '市场',
  '创业', '管理', '数据', 'UX/UI', '前端',
  '后端', '移动开发', '增长', '运营', '内容',
  '金融', '投资', 'Web3', '量化', 'FinTech'
];

const InterestSelectionModal: React.FC<InterestSelectionModalProps> = ({ onComplete, onSkip }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  console.log('🎨 InterestSelectionModal is rendering!');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleComplete = () => {
    if (selectedTags.length >= 3) {
      onComplete(selectedTags);
    }
  };

  const canComplete = selectedTags.length >= 3 && selectedTags.length <= 5;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">✨</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">选择你的兴趣领域</h2>
          <p className="text-gray-500">
            请选择 <span className="font-semibold text-gray-700">3-5</span> 个你感兴趣的标签
          </p>
          <p className="text-sm text-gray-400 mt-1">
            我们将为你推荐相关内容
          </p>
        </div>

        {/* Tags Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {PRESET_TAGS.map((tag, index) => {
            const isSelected = selectedTags.includes(tag);
            const selectionIndex = selectedTags.indexOf(tag);
            
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={!isSelected && selectedTags.length >= 5}
                className={`
                  relative px-4 py-3 rounded-xl font-medium text-sm
                  transition-all duration-300 transform
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-purple-400' 
                    : selectedTags.length >= 5
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105 hover:shadow-md'
                  }
                `}
              >
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                    <FiCheck className="text-purple-600" size={12} />
                  </span>
                )}
                {tag}
              </button>
            );
          })}
        </div>

        {/* Selected Count */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <span className="text-sm text-gray-600">
              已选择: <span className={`font-bold ${canComplete ? 'text-purple-600' : 'text-gray-800'}`}>
                {selectedTags.length}
              </span> / 5
            </span>
            {selectedTags.length < 3 && (
              <span className="text-xs text-orange-500">
                (至少选择3个)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            跳过
          </button>
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className={`
              flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300
              ${canComplete
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {canComplete ? '开始探索 🚀' : '请选择更多标签'}
          </button>
        </div>

        {/* Selected Tags Preview */}
        {selectedTags.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">你选择的标签：</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white text-sm font-medium text-purple-600 rounded-full shadow-sm border border-purple-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestSelectionModal;
