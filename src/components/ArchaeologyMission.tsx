'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IdeaWithAuthors } from '../types';
import { FiX, FiMessageCircle } from 'react-icons/fi';
import MarkdownRenderer from './MarkdownRenderer';
import { supabase } from '../lib/supabase';

const ArchaeologyMission: React.FC = () => {
  const { ideas, fetchIdeas, username, addComment, showToast } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithAuthors | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    checkTodayCompletion();
  }, [username]);

  // Check if user already completed archaeology today
  const checkTodayCompletion = () => {
    const lastCompletion = localStorage.getItem(`archaeology_${username}`);
    if (lastCompletion) {
      const lastDate = new Date(lastCompletion);
      const today = new Date();
      if (lastDate.toDateString() === today.toDateString()) {
        setCompletedToday(true);
        return;
      }
    }
    setCompletedToday(false);
  };

  // Pick a random old idea (30+ days old, low engagement)
  const pickOldIdea = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldIdeas = ideas.filter(idea => {
      const createdAt = new Date(idea.created_at);
      const isOld = createdAt < thirtyDaysAgo;
      const lowEngagement = (idea.likes_count || 0) + (idea.comments_count || 0) < 5;
      return isOld && lowEngagement;
    });

    if (oldIdeas.length === 0) {
      // Fallback: any idea older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fallbackIdeas = ideas.filter(i => new Date(i.created_at) < sevenDaysAgo);
      if (fallbackIdeas.length > 0) {
        return fallbackIdeas[Math.floor(Math.random() * fallbackIdeas.length)];
      }
      return null;
    }

    return oldIdeas[Math.floor(Math.random() * oldIdeas.length)];
  };

  const handleStartMission = () => {
    if (!username) {
      showToast('请先登录', 'error');
      return;
    }

    if (completedToday) {
      showToast('今天已完成考古任务！明天再来吧', 'info');
      return;
    }

    const idea = pickOldIdea();
    if (!idea) {
      showToast('暂时没有适合考古的想法', 'info');
      return;
    }

    setSelectedIdea(idea);
    setShowModal(true);
  };

  const handleSubmitComment = async () => {
    if (!selectedIdea || !username) return;

    if (comment.trim().length < 10) {
      showToast('评论至少需要10个字哦', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Add comment
      await addComment(selectedIdea.id, comment);

      // Award coins via RPC
      const { data, error } = await supabase.rpc('award_archaeology_coins', {
        p_user_name: username,
        p_amount: 50,
        p_idea_id: selectedIdea.id
      });

      if (error) {
        console.error('Award coins error:', error);
        showToast('评论成功，但金币奖励失败', 'error');
      } else {
        showToast('🎉 考古成功！获得50金币奖励', 'success');
        
        // Mark as completed today
        localStorage.setItem(`archaeology_${username}`, new Date().toISOString());
        setCompletedToday(true);
      }

      // Close modal
      setShowModal(false);
      setComment('');
      setSelectedIdea(null);
      
      // Refresh ideas
      fetchIdeas();
    } catch (err) {
      console.error('Submit comment error:', err);
      showToast('提交失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const daysAgo = selectedIdea 
    ? Math.floor((Date.now() - new Date(selectedIdea.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      {/* Mission Button */}
      <button
        onClick={handleStartMission}
        disabled={completedToday}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          completedToday
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
        }`}
      >
        <span className="text-xl">⛏️</span>
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold">
            {completedToday ? '✅ 今日已完成' : '每日考古'}
          </span>
          <span className="text-xs opacity-90">
            {completedToday ? '明天再来' : '+50金币'}
          </span>
        </div>
      </button>

      {/* Archaeology Modal */}
      {showModal && selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">⛏️ 灵感考古任务</h2>
                  <p className="text-amber-100">发现了一个 {daysAgo} 天前的旧想法</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setComment('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-lg p-3 border border-white/30">
                <p className="text-sm">💡 留下至少10字的建设性评论，即可获得 <span className="font-bold text-yellow-200">50金币</span> 奖励！</p>
              </div>
            </div>

            {/* Idea Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {selectedIdea.authors[0].name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedIdea.authors[0].name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedIdea.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedIdea.title}</h3>
                
                {selectedIdea.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {selectedIdea.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-gray-700">
                  <MarkdownRenderer content={selectedIdea.content} />
                </div>
              </div>

              {/* Comment Input */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiMessageCircle className="inline mr-1" />
                  你的考古发现 (至少10字)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="分享你对这个想法的看法、建议或延伸思考..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-sm ${comment.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                    {comment.length} / 10 字
                  </span>
                  <button
                    onClick={handleSubmitComment}
                    disabled={submitting || comment.trim().length < 10}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? '提交中...' : '🪙 挖掘完成 (+50)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArchaeologyMission;
