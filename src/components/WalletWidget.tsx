'use client';
import React, { useEffect, useState } from 'react';
import { getUserWallet } from '../services/economyService';
import { UserWallet } from '../types';

interface WalletWidgetProps {
  userName: string;
  onOpenHistory?: () => void;
}

const WalletWidget: React.FC<WalletWidgetProps> = ({ userName, onOpenHistory }) => {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, [userName]);

  const loadWallet = async () => {
    setLoading(true);
    const data = await getUserWallet(userName);
    setWallet(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
        <span className="text-sm text-amber-600">加载中...</span>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 cursor-pointer hover:shadow-md transition-all group"
      onClick={onOpenHistory}
      title="点击查看交易历史"
    >
      {/* 金币图标 */}
      <div className="text-xl">🪙</div>

      {/* 余额显示 */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-amber-800">
          {wallet.balance}
        </span>
        <span className="text-xs text-amber-600 group-hover:text-amber-700">
          金币
        </span>
      </div>

      {/* 统计数据提示 */}
      <div className="hidden md:flex flex-col text-xs text-gray-500 border-l border-amber-200 pl-2 ml-1">
        <span className="text-green-600">+{wallet.total_earned}</span>
        <span className="text-blue-600">-{wallet.total_invested}</span>
      </div>
    </div>
  );
};

export default WalletWidget;
