'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FiActivity, FiDollarSign, FiHelpCircle, FiMoon } from 'react-icons/fi';

type LeaderboardCategory = 'active' | 'wolf' | 'debugger' | 'owl';

interface LeaderEntry {
  user_name: string;
  rank: number;
  value: number;
  label: string;
}

const MultiLeaderboard: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('active');
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [activeCategory]);

  const loadLeaderboard = async () => {
    setLoading(true);
    let results: any[] = [];

    try {
      switch (activeCategory) {
        case 'active':
          const { data: activeData } = await supabase.rpc('get_most_active', { p_limit: 10 });
          results = activeData?.map((item: any) => ({
            user_name: item.user_name,
            rank: item.rank,
            value: item.idea_count,
            label: `${item.idea_count} 个想法`
          })) || [];
          break;
        
        case 'wolf':
          const { data: walletData } = await supabase
            .from('user_wallets')
            .select('user_name, balance, total_earned')
            .order('total_earned', { ascending: false })
            .limit(10);
          results = walletData?.map((item, index) => ({
            user_name: item.user_name,
            rank: index + 1,
            value: item.total_earned,
            label: `${item.total_earned} 金币`
          })) || [];
          break;
        
        case 'debugger':
          const { data: debugData } = await supabase.rpc('get_debuggers', { p_limit: 10 });
          results = debugData?.map((item: any) => ({
            user_name: item.user_name,
            rank: item.rank,
            value: item.helpful_comments,
            label: `${item.helpful_comments} 条评论`
          })) || [];
          break;
        
        case 'owl':
          const { data: owlData } = await supabase.rpc('get_night_owls', { p_limit: 10 });
          results = owlData?.map((item: any) => ({
            user_name: item.user_name,
            rank: item.rank,
            value: item.avg_hour,
            label: `平均 ${Math.round(item.avg_hour)}:00`
          })) || [];
          break;
      }
      
      setData(results);
    } catch (error) {
      console.error('Load leaderboard error:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { 
      id: 'active' as LeaderboardCategory, 
      name: '🔥 Most Active', 
      desc: '最活跃',
      icon: <FiActivity />,
      color: 'red'
    },
    { 
      id: 'wolf' as LeaderboardCategory, 
      name: '💰 Wall Street Wolf', 
      desc: '最富有',
      icon: <FiDollarSign />,
      color: 'green'
    },
    { 
      id: 'debugger' as LeaderboardCategory, 
      name: '🛠️ The Debugger', 
      desc: '最热心',
      icon: <FiHelpCircle />,
      color: 'blue'
    },
    { 
      id: 'owl' as LeaderboardCategory, 
      name: '🌙 Night Owl', 
      desc: '夜猫子',
      icon: <FiMoon />,
      color: 'purple'
    },
  ];

  const getCrown = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">⚔️ 实验室琅琊榜</h1>
        <p className="text-gray-600">多维度能力雷达 · 每周更新</p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeCategory === cat.id
                ? `border-${cat.color}-500 bg-${cat.color}-50 shadow-lg`
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{cat.name.split(' ')[0]}</div>
            <div className={`font-semibold ${activeCategory === cat.id ? `text-${cat.color}-700` : 'text-gray-800'}`}>
              {cat.name.split(' ').slice(1).join(' ')}
            </div>
            <div className="text-xs text-gray-500 mt-1">{cat.desc}</div>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className={`p-4 bg-gradient-to-r from-${currentCategory?.color}-500 to-${currentCategory?.color}-600 text-white`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {currentCategory?.icon}
            {currentCategory?.name}
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              暂无数据
            </div>
          ) : (
            data.map((entry)=> (
              <div
                key={entry.user_name}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank with Crown */}
                  <div className="w-16 text-center relative">
                    {getCrown(entry.rank) && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">
                        {getCrown(entry.rank)}
                      </span>
                    )}
                    <span className={`text-2xl font-bold ${
                      entry.rank <= 3 ? 'text-yellow-600' : 'text-gray-400'
                    } mt-4 block`}>
                      #{entry.rank}
                    </span>
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {entry.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{entry.user_name}</p>
                      <p className="text-xs text-gray-500">{entry.label}</p>
                    </div>
                  </div>
                </div>

                {/* Value Badge */}
                <div className={`px-4 py-2 rounded-full font-bold text-${currentCategory?.color}-700 bg-${currentCategory?.color}-100 border border-${currentCategory?.color}-200`}>
                  {typeof entry.value === 'number' && entry.value % 1 !== 0 
                    ? entry.value.toFixed(1) 
                    : entry.value}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Refresh Note */}
      <div className="mt-4 text-center text-sm text-gray-500">
        📅 数据基于最近7天 · 每周一更新
      </div>
    </div>
  );
};

export default MultiLeaderboard;
