'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { FiCalendar, FiUser, FiThumbsUp, FiExternalLink, FiUpload, FiClock } from 'react-icons/fi';

interface PaperNomination {
  id: string;
  title: string;
  authors: string;
  paper_url: string;
  nominated_by: string;
  votes: number;
  tags: string[];
  abstract: string;
  created_at: string;
  is_scheduled: boolean;
}

interface ReadingSession {
  id: string;
  paper_id: string;
  presenter_name: string;
  scheduled_date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  slides_url?: string;
  notes?: string;
  recording_url?: string;
  paper?: PaperNomination;
}

const JournalClub: React.FC = () => {
  const { username, showToast } = useAppStore();
  const [nominations, setNominations] = useState<PaperNomination[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadNominations(), loadSessions()]);
    setLoading(false);
  };

  const loadNominations = async () => {
    const { data, error } = await supabase
      .from('paper_nominations')
      .select('*')
      .order('votes', { ascending: false });
    
    if (!error && data) {
      setNominations(data);
    }
  };

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('*, paper:paper_nominations(*)')
      .order('scheduled_date', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setSessions(data as any);
    }
  };

  const handleVote = async (paperId: string) => {
    const { data, error } = await supabase.rpc('vote_for_paper', {
      p_paper_id: paperId,
      p_user_name: username
    });

    if (error) {
      showToast('投票失败', 'error');
    } else {
      showToast('投票成功！', 'success');
      loadNominations();
    }
  };

  const handleScheduleNext = async () => {
    // Schedule for next Wednesday
    const nextWed = getNextWednesday();
    
    const { data, error } = await supabase.rpc('schedule_next_session', {
      p_scheduled_date: nextWed.toISOString().split('T')[0]
    });

    if (error || !data.success) {
      showToast(data?.message || '排期失败', 'error');
    } else {
      showToast(`已安排 ${data.presenter} 在下周三主讲`, 'success');
      loadData();
    }
  };

  const getNextWednesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWed = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + daysUntilWed);
    return nextWed;
  };

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const unnominatedPapers = nominations.filter(n => !n.is_scheduled);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl">📖</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">论文阅读排期表</h1>
              <p className="text-gray-600 mt-1">Journal Club Manager</p>
            </div>
          </div>

          <button
            onClick={() => setShowNominateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + 提名论文
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-gray-700">
            💡 <span className="font-semibold">自动化组会管理</span>：提名论文 → 投票 → 自动排期 → 资料归档
          </p>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📅 即将进行</h2>
          <button
            onClick={handleScheduleNext}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            自动排期下周
          </button>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500">暂无安排</p>
            <p className="text-sm text-gray-400 mt-1">点击"自动排期"开始安排</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map(session => (
              <div key={session.id} className="bg-white rounded-lg p-6 border border-indigo-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {session.paper?.title || '论文标题'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {session.paper?.authors}
                    </p>
                  </div>
                  {session.paper?.paper_url && (
                    <a
                      href={session.paper.paper_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FiExternalLink size={20} />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <FiUser />
                    <span>主讲：{session.presenter_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiCalendar />
                    <span>{new Date(session.scheduled_date).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voting Pool */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🗳️ 投票池</h2>
        {unnominatedPapers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500">暂无待选论文</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unnominatedPapers.map(paper => (
              <div key={paper.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800 flex-1">{paper.title}</h3>
                  <a
                    href={paper.paper_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 ml-2"
                  >
                    <FiExternalLink size={16} />
                  </a>
                </div>
                <p className="text-xs text-gray-600 mb-3">{paper.authors}</p>
                
                {paper.tags && paper.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {paper.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    提名：{paper.nominated_by}
                  </span>
                  <button
                    onClick={() => handleVote(paper.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded font-medium text-sm"
                  >
                    <FiThumbsUp size={14} />
                    <span>{paper.votes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Sessions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ 历史归档</h2>
        {completedSessions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500">暂无历史记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedSessions.map(session => (
              <div key={session.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{session.paper?.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>主讲：{session.presenter_name}</span>
                      <span>{new Date(session.scheduled_date).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  {session.slides_url && (
                    <a
                      href={session.slides_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-medium"
                    >
                      查看资料
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nominate Modal - TODO: Implement */}
      {showNominateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">提名论文</h3>
            <p className="text-gray-600">功能开发中...</p>
            <button
              onClick={() => setShowNominateModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalClub;
