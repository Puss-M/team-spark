'use client';
import React, { useEffect, useState } from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiTrendingUp, FiUsers, FiPlus, FiLogOut } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';

const Navigation: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedGroup,
    setSelectedGroup,
    groups,
    fetchGroups,
    author,
    logout,
  } = useAppStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const menuItems = [
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
      <nav className="space-y-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">浏览</span>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedGroup(item.id)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGroup === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.name}
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
            <span className="text-xs text-gray-400">({groups.length})</span>
          </div>
          <div className="space-y-1">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-2">暂无小组</p>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGroup === group.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={group.description}
                >
                  <span className="truncate"># {group.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </nav>
      
      {/* User Profile Section */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {author.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{author}</p>
              <p className="text-xs text-gray-400">已登录</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="退出登录"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认退出登录？</h3>
            <p className="text-gray-500 mb-6">
              退出后需要重新输入名字才能继续使用。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                }}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FiLogOut size={16} />
                确定退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;
