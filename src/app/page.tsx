import React from 'react';
import Navigation from '../components/Navigation';
import IdeasFeed from '../components/IdeasFeed';
import IdeaInput from '../components/IdeaInput';
import MatchIdeasModal from '../components/MatchIdeasModal';

const Home: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Navigation and Filtering */}
      <div className="w-64 h-full border-r border-gray-200">
        <Navigation />
      </div>
      
      {/* Idea Feed */}
      <div className="flex-1 h-full overflow-y-auto">
        <IdeasFeed />
      </div>
      
      {/* Idea Input and RAG Reminder */}
      <div className="w-96 h-full border-l border-gray-200">
        <IdeaInput />
      </div>
      
      {/* Match Ideas Modal */}
      <MatchIdeasModal />
    </div>
  );
};

export default Home;
