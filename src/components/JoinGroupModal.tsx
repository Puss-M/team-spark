'use client';
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface JoinGroupModalProps {
  onClose: () => void;
}

const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinSocialGroup } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    const result = await joinSocialGroup(inviteCode.trim());
    setIsSubmitting(false);

    if (result.success) {
      alert('加入成功！');
      onClose();
    } else {
      alert('加入失败：' + result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">加入小组</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邀请码
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest text-lg uppercase"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="请输入6位邀请码"
            />
            <p className="text-xs text-gray-500 mt-2">
              向组长索要邀请码，输入后即可加入已有的讨论组。
            </p>
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
              disabled={isSubmitting || !inviteCode.trim()}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '加入中...' : '确认加入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;
