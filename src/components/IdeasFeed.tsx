'use client';
import React from 'react';
import IdeaCard from './IdeaCard';
import { useAppStore } from '../store/useAppStore';

const IdeasFeed: React.FC = () => {
  const { ideas } = useAppStore();

  // Mock data for ideas (to be replaced with real data from Supabase)
  const mockIdeas = [
    {
      id: '1',
      author_id: ['1'],
      title: '关于Q3用户增长的新路径思考',
      content: '我们应该重点关注存量用户的激活，结合新功能推出一系列运营活动...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: true,
      tags: ['#增长黑客', '#UI优化'],
      comments_count: 5,
      likes_count: 10,
      embedding: Array(384).fill(0.1),
      authors: [
        {
          id: '1',
          name: '李明',
          email: 'liming@example.com',
          role: '产品经理',
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: '2',
      author_id: ['1'],
      title: '关于Q3用户增长的新路径思考',
      content: '我们应该重点关注存量用户的激活，结合新功能推出一系列运营活动...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: true,
      tags: ['#增长黑客', '#UI优化'],
      comments_count: 5,
      likes_count: 10,
      embedding: Array(384).fill(0.1),
      authors: [
        {
          id: '1',
          name: '李明',
          email: 'liming@example.com',
          role: '产品经理',
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: '3',
      author_id: ['1'],
      title: '关于Q3用户增长的新路径思考',
      content: '我们应该重点关注存量用户的激活，结合新功能推出一系列运营活动...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: true,
      tags: ['#增长黑客', '#UI优化'],
      comments_count: 5,
      likes_count: 10,
      embedding: Array(384).fill(0.1),
      authors: [
        {
          id: '1',
          name: '李明',
          email: 'liming@example.com',
          role: '产品经理',
          created_at: new Date().toISOString(),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">灵感流</h2>
      
      {mockIdeas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
};

export default IdeasFeed;
