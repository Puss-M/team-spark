import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface BettingModalProps {
  ideaId: string;
  ideaTitle: string;
  onClose: () => void;
}

export function BettingModal({ ideaId, ideaTitle, onClose }: BettingModalProps) {
  const [amount, setAmount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const { investInIdea } = useAppStore();

  const handleInvest = async () => {
    setIsLoading(true);
    try {
      const success = await investInIdea(ideaId, amount);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Investment failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">投资灵感</h3>
          <p className="text-sm text-gray-500 line-clamp-1">"{ideaTitle}"</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
          <div className="flex justify-between text-amber-900 text-sm mb-2">
            <span>投资金额</span>
            <span className="font-bold">预期回报 (200%)</span>
          </div>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setAmount(Math.max(10, amount - 10))}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-amber-600 hover:bg-amber-100 transition-colors"
            >
              -
            </button>
            <div className="text-center">
              <span className="text-3xl font-bold text-amber-600">{amount}</span>
              <span className="text-xs text-amber-500 block">Spark Coins</span>
            </div>
            <button 
              onClick={() => setAmount(amount + 10)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-amber-600 hover:bg-amber-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleInvest} 
            disabled={isLoading}
            className={`w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span>处理中...</span>
            ) : (
              <>
                <span>🚀</span>
                <span>确认投资</span>
              </>
            )}
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
          >
            再想想
          </button>
        </div>
      </div>
    </div>
  );
}
