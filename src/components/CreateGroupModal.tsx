'use client';
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface CreateGroupModalProps {
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSocialGroup } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const success = await createSocialGroup(name, description);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">创建新小组</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              小组名称
            </label>
            <input
              type="text"
              required
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：产品设计组"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              简介 (可选)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单介绍一下这个小组..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '创建中...' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
