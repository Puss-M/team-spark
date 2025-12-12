'use client';
import React, { useEffect, useState } from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiTrendingUp, FiUsers, FiPlus, FiLogOut, FiMessageSquare, FiGrid, FiGlobe } from 'react-icons/fi';
import { useAppStore } from '../store/useAppStore';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import WalletWidget from './WalletWidget';

const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedGroup,
    setSelectedGroup,
    socialGroups,
    fetchUserSocialGroups,
    activeSocialGroupId,
    setActiveSocialGroupId,
    username,
    logout,
    userBalance,
  } = useAppStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    fetchUserSocialGroups();
  }, [fetchUserSocialGroups, username]);

  const menuItems = [
    { 
      id: 'feed', 
      name: '我的灵感', 
      icon: <FiUsers className="mr-2" />, 
      action: () => {
        setActiveView('feed');
        setActiveSocialGroupId(null);
      }
    },
    { 
      id: 'community', 
      name: '实验室广场', 
      icon: <FiGrid className="mr-2" />, 
      action: () => {
        setActiveView('community');
        setActiveSocialGroupId(null);
      }
    },
    { 
      id: 'galaxy', 
      name: '灵感星系', 
      icon: <FiGlobe className="mr-2" />, 
      action: () => {
        setActiveView('galaxy');
        setActiveSocialGroupId(null);
      }
    },
    { 
      id: 'seminar', 
      name: '📊 组会模式', 
      icon: <FiTrendingUp className="mr-2" />, 
      action: () => {
        window.location.href = '/seminar';
      }
    },
    { 
      id: 'leaderboard', 
      name: '🏆 排行榜', 
      icon: <FiTrendingUp className="mr-2" />, 
      action: () => {
        window.location.href = '/leaderboard';
      }
    },
    { 
      id: 'graveyard', 
      name: '🪦 失败博物馆', 
      icon: <FiTrendingUp className="mr-2" />, 
      action: () => {
        window.location.href = '/graveyard';
      }
    },
    { 
      id: 'journal', 
      name: '📖 论文排期', 
      icon: <FiTrendingUp className="mr-2" />, 
      action: () => {
        window.location.href = '/journal';
      }
    },
    { 
      id: 'create-group', 
      name: '创建小组', 
      icon: <FiPlus className="mr-2" />, 
      action: () => setShowCreateGroup(true) 
    },
    { 
      id: 'join-group', 
      name: '加入小组', 
      icon: <FiUsers className="mr-2" />, 
      action: () => setShowJoinGroup(true) 
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 p-4">
      {/* Logo and Search... code until Main Navigation */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
  <img 
    src="/logo.jpg" 
    alt="spark.lab logo" 
    className="w-12 h-12 object-contain rounded"
  />
  <div>
    <h1 className="text-xl font-bold text-blue-600">
      spark<span className="text-red-600">.lab</span>
    </h1>
    <p className="text-xs text-gray-500">igniting ideas</p>
  </div>
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
              onClick={() => {
                if (item.action) {
                  item.action();
                }
              }}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                (activeView as string) === item.id && !activeSocialGroupId
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

        {/* User's Social Groups */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">我的小组</span>
            <span className="text-xs text-gray-400">({socialGroups.length})</span>
          </div>
          <div className="space-y-1">
            {socialGroups.length === 0 ? (
              <div className="text-center py-4 px-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">还未加入任何小组</p>
                <button 
                  onClick={() => setShowJoinGroup(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  输入邀请码加入
                </button>
              </div>
            ) : (
              socialGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveSocialGroupId(group.id)}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSocialGroupId === group.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={group.description}
                >
                  <FiMessageSquare className="mr-2" size={14} />
                  <span className="truncate">{group.name}</span>
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
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-800 font-medium text-sm">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">User: {username}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Logout"
          >
            <FiLogOut size={16} />
          </button>
        </div>
        
        {/* Wallet Widget */}
        <div className="mt-2">
          <WalletWidget userName={username} />
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-500 mb-6">
              You will need to log in again to continue using the application.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                }}
                className="px-4 py-2 text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FiLogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showJoinGroup && <JoinGroupModal onClose={() => setShowJoinGroup(false)} />}
    </div>
  );
};

export default Navigation;
