'use client';
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import IdeasFeed from '../components/IdeasFeed';
import IdeaInput from '../components/IdeaInput';
import MatchIdeasModal from '../components/MatchIdeasModal';
import LoginModal from '../components/LoginModal';
import MobileBottomNav from '../components/MobileBottomNav';
import { useAppStore } from '../store/useAppStore';

const Home: React.FC = () => {
  const { isLoggedIn, login, setAuthor } = useAppStore();
  const [mobileTab, setMobileTab] = useState<'feed' | 'post' | 'profile'>('feed');

  // Initialize app state from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuthor = localStorage.getItem('author');
      const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (storedAuthor && storedIsLoggedIn) {
        login(storedAuthor);
      }
    }
  }, [login]);

  return (
    <>
      {!isLoggedIn && <LoginModal onLogin={login} />}
      
      {/* Desktop Layout (md and up) */}
      <div className="hidden md:flex h-screen bg-gray-50">
        {/* Navigation and Filtering */}
        <div className="w-64 h-full border-r border-gray-200">
          <Navigation />
        </div>
        
        {/* Idea Feed */}
        <div className="flex-1 h-full overflow-y-auto">
          <IdeasFeed />
        </div>
        
        {/* Idea Input */}
        <div className="w-96 h-full border-l border-gray-200">
          <IdeaInput />
        </div>
        
        {/* Match Ideas Modal */}
        <MatchIdeasModal />
      </div>

      {/* Mobile Layout (below md) */}
      <div className="md:hidden flex flex-col h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Team Spark</h1>
          </div>
        </div>

        {/* Mobile Content Area */}
        <div className="flex-1 overflow-y-auto pb-16">
          {mobileTab === 'feed' && <IdeasFeed />}
          {mobileTab === 'post' && (
            <div className="p-4">
              <IdeaInput />
            </div>
          )}
          {mobileTab === 'profile' && (
            <div className="p-4">
              <Navigation />
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
        
        {/* Match Ideas Modal */}
        <MatchIdeasModal />
      </div>
    </>
  );
};

export default Home;
