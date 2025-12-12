'use client';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { FiX } from 'react-icons/fi';

interface ArchiveFailureModalProps {
  ideaId: string;
  ideaTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ArchiveFailureModal: React.FC<ArchiveFailureModalProps> = ({
  ideaId,
  ideaTitle,
  onClose,
  onSuccess,
}) => {
  const { username, showToast } = useAppStore();
  const [failureReason, setFailureReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const failureCategories = [
    { label: '数据问题', examples: '数据量不够、数据有噪声、数据集有毒' },
    { label: '资源限制', examples: '显存溢出、计算时间太长、成本过高' },
    { label: '理论缺陷', examples: '推导错误、假设不成立、方法不适用' },
    { label: '实验失败', examples: '效果不如预期、无法复现、结果不稳定' },
    { label: '其他原因', examples: '时间不够、优先级改变、发现更好方案' },
  ];

  const handleSubmit = async () => {
    if (failureReason.trim().length < 20) {
      showToast('请详细描述失败原因（至少20字）', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('archive_as_failed', {
        p_idea_id: ideaId,
        p_user_name: username,
        p_failure_reason: failureReason,
      });

      if (error) {
        console.error('Archive failed error:', error);
        showToast('归档失败：' + error.message, 'error');
      } else if (data?.success) {
        showToast(`🎉 ${data.message || '获得100金币奖励'}`, 'success');
        onSuccess();
        onClose();
      } else {
        showToast(data?.message || '归档失败', 'error');
      }
    } catch (err) {
      console.error('Archive error:', err);
      showToast('归档失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">🪦 归档为失败</h2>
              <p className="text-gray-200 text-sm">分享失败经验，帮助团队避坑</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="bg-yellow-500 text-gray-900 rounded-lg p-3 border border-yellow-400">
            <p className="text-sm font-semibold">
              💰 双倍奖励：分享失败可获得 <span className="text-lg font-bold">100金币</span>！
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-1">归档想法：</h3>
            <p className="text-gray-600">{ideaTitle}</p>
          </div>

          {/* Failure Categories */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">💡 常见失败原因（参考）：</h4>
            <div className="grid grid-cols-1 gap-2">
              {failureCategories.map((cat, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="font-medium text-gray-800 text-sm mb-1">{cat.label}</div>
                  <div className="text-xs text-gray-500">{cat.examples}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ❌ 为什么失败？（至少20字）
            </label>
            <textarea
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="详细描述失败的原因、遇到的问题、尝试过的方法等...&#10;&#10;例如：&#10;- 使用XX数据集发现有严重噪声，导致模型训练不稳定&#10;- 理论推导时发现XX假设在实际场景中不成立&#10;- 实验显存需求超过32GB，现有设备无法运行"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
              rows={8}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${failureReason.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {failureReason.length} / 20 字
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              ⚠️ 归档为失败后，这个想法将移入失败博物馆，供团队参考学习。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || failureReason.trim().length < 20}
            className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-800 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {submitting ? '归档中...' : '🪦 归档失败 (+100金币)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveFailureModal;
