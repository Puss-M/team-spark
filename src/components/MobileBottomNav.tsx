'use client';
import React from 'react';
import { FiHome, FiPlusCircle, FiUser } from 'react-icons/fi';

interface MobileBottomNavProps {
  activeTab: 'feed' | 'post' | 'profile';
  onTabChange: (tab: 'feed' | 'post' | 'profile') => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onTabChange('feed')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'feed'
              ? 'text-blue-600'
              : 'text-gray-400'
          }`}
        >
          <FiHome size={24} />
          <span className="text-xs mt-1">首页</span>
        </button>
        
        <button
          onClick={() => onTabChange('post')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'post'
              ? 'text-blue-600'
              : 'text-gray-400'
          }`}
        >
          <FiPlusCircle size={24} />
          <span className="text-xs mt-1">发布</span>
        </button>
        
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'profile'
              ? 'text-blue-600'
              : 'text-gray-400'
          }`}
        >
          <FiUser size={24} />
          <span className="text-xs mt-1">我的</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
