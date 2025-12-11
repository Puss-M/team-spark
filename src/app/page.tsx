'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import IdeasFeed from '../components/IdeasFeed';
import IdeaInput from '../components/IdeaInput';
import MatchIdeasModal from '../components/MatchIdeasModal';
import MobileBottomNav from '../components/MobileBottomNav';
import GroupChatView from '../components/GroupChatView';
import CommunityBoard from '../components/CommunityBoard';
import GalaxyView from '../components/GalaxyView';
import { useAppStore } from '../store/useAppStore';

const Home: React.FC = () => {
  const { isLoggedIn, login, username, activeView, activeSocialGroupId } = useAppStore();
  const [mobileTab, setMobileTab] = useState<'feed' | 'community' | 'post' | 'profile' | 'galaxy'>('feed');
  const router = useRouter();

  // Initialize app state from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username');
      const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (storedUsername && storedIsLoggedIn) {
        login(storedUsername);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }
  }, [login, router]);

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return null; // Router will handle redirect
  }

  return (
    <>
      {/* Desktop Layout (md and up) */}
      <div className="hidden md:flex h-screen bg-gray-50">
        {/* Navigation and Filtering */}
        <div className="w-64 h-full border-r border-gray-200">
          <Navigation />
        </div>
        
        {/* Idea Feed or Group Chat */}
        <div className="flex-1 h-full overflow-y-auto relative">
          {/* Welcome Section */}
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Hello, {username}. Ready to capture ideas?</h1>
          </div>
          
          {activeSocialGroupId ? <GroupChatView /> : 
           activeView === 'community' ? <CommunityBoard /> : 
           activeView === 'galaxy' ? <GalaxyView /> : 
           <IdeasFeed />}
        </div>
        
        {/* Idea Input (Hidden in Galaxy View for immersion) */}
        {activeView !== 'galaxy' && (
          <div className="w-96 h-full border-l border-gray-200">
            <IdeaInput />
          </div>
        )}
        
        {/* Match Ideas Modal */}
        <MatchIdeasModal />
      </div>

      {/* Mobile Layout (below md) */}
      <div className="md:hidden flex flex-col h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">Team Spark</h1>
            </div>
            <div className="text-sm text-gray-600">User: {username}</div>
          </div>
        </div>

        {/* Mobile Content Area */}
        <div className="flex-1 overflow-y-auto pb-16">
          {/* Welcome Section */}
          <div className="p-4 bg-white border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">Hello, {username}!</h1>
            <p className="text-gray-600 mt-1">Ready to capture ideas?</p>
          </div>
          
          {mobileTab === 'feed' && <IdeasFeed />}
          {mobileTab === 'community' && <CommunityBoard />}
          {mobileTab === 'galaxy' && <GalaxyView />}
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
