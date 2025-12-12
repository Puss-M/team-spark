'use client';
import React, { useState } from 'react';
import { postBounty, acceptBountySolution } from '../services/economyService';
import { Idea } from '../types';
import { useAppStore } from '../store/useAppStore';

interface BountyPanelProps {
  idea: Idea;
  onBountyPosted?: () => void;
}

const BountyPanel: React.FC<BountyPanelProps> = ({ idea, onBountyPosted }) => {
  const { username, showToast } = useAppStore();
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [winnerName, setWinnerName] = useState('');

  const isAuthor = idea.author_id.includes(username);
  const hasBounty = idea.is_bounty && idea.bounty_amount > 0;

  const handlePostBounty = async () => {
    if (!username) {
      showToast('请先登录', 'error');
      return;
    }

    if (amount <= 0) {
      showToast('悬赏金额必须大于0', 'error');
      return;
    }

    setLoading(true);
    const result = await postBounty(idea.id, amount, username);
    
    if (result.success) {
      showToast(`悬赏发布成功！`, 'success');
      setAmount(50);
      if (onBountyPosted) onBountyPosted();
    } else {
      showToast(result.message || '发布失败', 'error');
    }
    
    setLoading(false);
  };

  const handleAcceptSolution = async () => {
    if (!winnerName.trim()) {
      showToast('请输入获胜者用户名', 'error');
      return;
    }

    setLoading(true);
    const result = await acceptBountySolution(idea.id, winnerName);
    
    if (result.success) {
      showToast (`悬赏已发放给 ${winnerName}！`, 'success');
      setWinnerName('');
      if (onBountyPosted) onBountyPosted();
    } else {
      showToast(result.message || '发放失败', 'error');
    }
    
    setLoading(false);
  };

  if (hasBounty) {
    return (
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h4 className="text-sm font-semibold text-orange-900">悬赏任务</h4>
            <p className="text-xs text-orange-600">奖金: {idea.bounty_amount} 金币</p>
          </div>
        </div>

        {isAuthor && (
          <div className="space-y-2">
            <p className="text-xs text-orange-700">选择获胜者并发放奖金:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={winnerName}
                onChange={(e) => setWinnerName(e.target.value)}
                placeholder="获胜者用户名"
                className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleAcceptSolution}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? '处理中...' : '发放'}
              </button>
            </div>
          </div>
        )}

        {!isAuthor && (
          <p className="text-xs text-orange-600">
            💡 提供最佳方案即可获得悬赏奖金！
          </p>
        )}
      </div>
    );
  }

  if (isAuthor) {
    return (
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <h4 className="text-sm font-semibold text-orange-900 mb-3">🎯 发布悬赏</h4>
        <p className="text-xs text-orange-600 mb-3">
          征集最佳解决方案，获胜者将获得奖金
        </p>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="10"
            max="500"
            className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="悬赏金额"
          />
          <button
            onClick={handlePostBounty}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? '发布中...' : '发布悬赏'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BountyPanel;
