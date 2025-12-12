'use client';
import React, { useState, useEffect } from 'react';
import { placeBet, getIdeaInvestments, getUserInvestmentOnIdea } from '../services/economyService';
import { Investment } from '../types';
import { useAppStore } from '../store/useAppStore';

interface InvestmentPanelProps {
  ideaId: string;
  ideaAuthor: string;
}

const InvestmentPanel: React.FC<InvestmentPanelProps> = ({ ideaId, ideaAuthor }) => {
  const { username, showToast } = useAppStore();
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [userInvestment, setUserInvestment] = useState<number>(0);
  const [totalInvested, setTotalInvested] = useState<number>(0);

  useEffect(() => {
    loadInvestments();
  }, [ideaId]);

  const loadInvestments = async () => {
    const data = await getIdeaInvestments(ideaId);
    setInvestments(data);
    
    // 计算总投资额
    const total = data.reduce((sum, inv) => sum + inv.amount, 0);
    setTotalInvested(total);

    // 获取当前用户投资额
    if (username) {
      const userInv = await getUserInvestmentOnIdea(username, ideaId);
      setUserInvestment(userInv);
    }
  };

  const handleInvest = async () => {
    if (!username) {
      showToast('请先登录', 'error');
      return;
    }

    if (amount <= 0) {
      showToast('投资金额必须大于0', 'error');
      return;
    }

    setLoading(true);
    const result = await placeBet(ideaId, amount, username);
    
    if (result.success) {
      showToast(`投资成功！剩余: ${result.new_balance} 金币`, 'success');
      setAmount(10);
      loadInvestments();
    } else {
      showToast(result.message || '投资失败', 'error');
    }
    
    setLoading(false);
  };

  const investorCount = new Set(investments.map(inv => inv.user_name)).size;

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-blue-900">💎 想法估值</h4>
          <p className="text-xs text-blue-600 mt-0.5">
            {investorCount} 位投资者 · 总投资 {totalInvested} 金币
          </p>
        </div>
      </div>

      {/* 用户已投资 */}
      {userInvestment > 0 && (
        <div className="mb-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
          📊 您已投资: {userInvestment} 金币
        </div>
      )}

      {/* 投资输入 */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1"
          max="100"
          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="投资金额"
        />
        <button
          onClick={handleInvest}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '投资中...' : '投资'}
        </button>
      </div>

      <p className="mt-2 text-xs text-blue-600">
        💡 项目实现后可获得 <span className="font-bold">200%</span> 回报
      </p>

      {/* 投资者列表 (可选展示) */}
      {investments.length > 0 && investments.length <= 5 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-700 font-medium mb-1">最近投资:</p>
          <div className="space-y-1">
            {investments.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex justify-between text-xs text-blue-600">
                <span>{inv.user_name}</span>
                <span>{inv.amount} 金币</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentPanel;
