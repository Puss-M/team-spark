'use client';
import React from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiTrendingUp, FiUsers, FiPlus } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';

const Navigation: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedGroup,
    setSelectedGroup,
  } = useAppStore();

  const groups = [
    { id: 'hot', name: '热门', icon: <FiTrendingUp className="mr-2" /> },
    { id: 'my-groups', name: '我的小组', icon: <FiUsers className="mr-2" /> },
    { id: 'create-group', name: '创建小组', icon: <FiPlus className="mr-2" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">T</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Team Spark</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索创意、标签或团队成员..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Navigation */}
      <nav className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">浏览</span>
        </div>

        {/* Group Items */}
        <div className="space-y-1">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGroup === group.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {group.icon}
              {group.name}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">排序方式</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'latest'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              最新想法
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'popular'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              热门
            </button>
          </div>
        </div>

        {/* User's Groups */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">我的小组</span>
          </div>
          <div className="space-y-1">
            <button className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              # 产品设计组
            </button>
            <button className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              # 市场营销制暴
            </button>
            <button className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              # 技术探索
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
