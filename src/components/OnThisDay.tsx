'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import { IdeaWithAuthors } from '../types';

const OnThisDay: React.FC = () => {
  const { username } = useAppStore();
  const [memories, setMemories] = useState<IdeaWithAuthors[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (username) {
      loadMemories();
    }
  }, [username]);

  const loadMemories = async () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate(); // 1-31

    // Query ideas where month and day match, but year is different
    const { data, error } = await supabase
      .from('ideas')
      .select('*, authors:users!ideas_author_id_users_id_fkey(*)')
      .contains('author_id', [username])
      .neq('created_at', `${today.getFullYear()}-%`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Filter in JavaScript for month/day match
      const filtered = data.filter(idea => {
        const date = new Date(idea.created_at);
        return date.getMonth() + 1 === currentMonth && date.getDate() === currentDay;
      });

      setMemories(filtered as any);
    }

    setLoading(false);
  };

  // Check if dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem('onThisDayDismissed');
    const today = new Date().toDateString();
    if (dismissedDate === today) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem('onThisDayDismissed', today);
    setDismissed(true);
  };

  if (loading || dismissed || memories.length === 0) {
    return null;
  }

  const getYearsAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return today.getFullYear() - date.getFullYear();
  };

  const getRandomMemory = () => {
    return memories[Math.floor(Math.random() * memories.length)];
  };

  const memory = getRandomMemory();
  const yearsAgo = getYearsAgo(memory.created_at);

  return (
    <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-lg shadow-lg overflow-hidden mb-6">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                           radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur">
                <FiCalendar size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">📅 那年今日</h3>
                <p className="text-white/80 text-sm">On This Day</p>
              </div>
            </div>

            {/* Memory Content */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <FiClock className="text-yellow-200" />
                <span className="text-yellow-200 font-bold">
                  {yearsAgo === 1 ? '1年前' : `${yearsAgo}年前`}的今天
                </span>
              </div>

              <p className="text-lg leading-relaxed mb-3">
                你{yearsAgo === 1 ? '' : '曾'}写下了这个想法：
              </p>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                <h4 className="font-bold text-xl mb-2">{memory.title}</h4>
                <p className="text-white/90 line-clamp-3">{memory.content}</p>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-white/70">
                <span>{new Date(memory.created_at).toLocaleDateString('zh-CN')}</span>
                {memory.likes_count > 0 && <span>❤️ {memory.likes_count}</span>}
                {memory.comments_count > 0 && <span>💬 {memory.comments_count}</span>}
              </div>
            </div>

            {memories.length > 1 && (
              <p className="text-sm text-white/70 mt-3">
                💡 还有 {memories.length - 1} 个回忆来自今天
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-full transition-colors ml-4"
            title="今日不再显示"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Inspirational message */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-center text-white/90 italic">
            "时光荏苒，初心不变。回首过往，你已走了很远。" 
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnThisDay;
