'use client';

import React, { useState, useEffect } from 'react';
import { IdeaWithAuthors } from '../types';

interface GroupCreationDialogProps {
  matchedIdeas: IdeaWithAuthors[];
  sourceIdea: {
    title: string;
    content: string;
    tags: string[];
};
  onConfirm: (groupName: string) => void;
  onCancel: () => void;
}

const GroupCreationDialog: React.FC<GroupCreationDialogProps> = ({
  matchedIdeas,
  sourceIdea,
  onConfirm,
  onCancel
}) => {
  const [groupName, setGroupName] = useState('');
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  // Auto-generate group name on mount
  useEffect(() => {
    generateGroupName();
  }, []);

  const generateGroupName = async () => {
    setIsGeneratingName(true);
    try {
      const response = await fetch('/api/generate-group-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchedIdeas: [
            { title: sourceIdea.title, content: sourceIdea.content },
            ...matchedIdeas.map(idea => ({ title: idea.title, content: idea.content }))
          ]
        })
      });

      if (!response.ok) throw new Error('生成失败');

      const { groupName: generatedName } = await response.json();
      setGroupName(generatedName);
    } catch (error) {
      console.error('Group name generation error:', error);
      setGroupName('创意小组');
    } finally {
      setIsGeneratingName(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🎉 发现相似灵感！
          </h2>
          <p className="text-gray-600">
            找到 <span className="font-bold text-blue-600">{matchedIdeas.length}</span> 个与你的灵感相似的想法，要创建小组一起讨论吗？
          </p>
        </div>

        {/* Matched Ideas List */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-gray-700 mb-3">匹配的灵感：</h3>
          {matchedIdeas.map((idea, index) => (
            <div
              key={idea.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800">{idea.title}</h4>
                <span className="text-xs text-gray-500">
                  by {idea.authors[0]?.name || '匿名'}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{idea.content}</p>
              {idea.tags && idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {idea.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Group Name Input */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            小组名称
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="创意小组"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGeneratingName}
            />
            <button
              type="button"
              onClick={generateGroupName}
              disabled={isGeneratingName}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isGeneratingName ? '⏳' : '🔄'} 重新生成
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
          >
            暂不创建
          </button>
          <button
            type="button"
            onClick={() => onConfirm(groupName)}
            disabled={!groupName.trim() || isGeneratingName}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建小组
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCreationDialog;
