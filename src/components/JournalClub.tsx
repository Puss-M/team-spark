'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { FiCalendar, FiUser, FiThumbsUp, FiExternalLink, FiUpload, FiClock, FiX } from 'react-icons/fi';

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
  const [submitting, setSubmitting] = useState(false);
  
  // Nomination form state
  const [nominationForm, setNominationForm] = useState({
    nominatorName: '',  // 新增：提名人姓名
    title: '',
    authors: '',
    paperUrl: '',
    abstract: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
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

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !nominationForm.tags.includes(tag)) {
      setNominationForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNominationForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmitNomination = async () => {
    if (!nominationForm.nominatorName.trim()) {
      showToast('请输入提名人姓名', 'error');
      return;
    }


    if (!nominationForm.title.trim()) {
      showToast('请输入论文标题', 'error');
      return;
    }

    if (!nominationForm.paperUrl.trim()) {
      showToast('请输入论文链接', 'error');
      return;
    }

    // Basic URL validation
    try {
      new URL(nominationForm.paperUrl);
    } catch {
      showToast('请输入有效的URL', 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('paper_nominations')
        .insert([{
          title: nominationForm.title.trim(),
          authors: nominationForm.authors.trim() || null,
          paper_url: nominationForm.paperUrl.trim(),
          nominated_by: nominationForm.nominatorName.trim(),
          tags: nominationForm.tags,
          abstract: nominationForm.abstract.trim() || null
        }])
        .select();

      if (error) {
        console.error('Nomination error:', error);
        showToast('提名失败: ' + error.message, 'error');
        alert('提交失败：' + error.message);
      } else {
        showToast('✅ 论文提名成功！', 'success');
        alert('✅ 论文提名成功！请刷新页面查看。');
        setShowNominateModal(false);
        setNominationForm({
          nominatorName: '',
          title: '',
          authors: '',
          paperUrl: '',
          abstract: '',
          tags: []
        });
        loadNominations();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      showToast('提交失败：' + String(err), 'error');
      alert('提交失败：' + String(err));
    } finally {
      setSubmitting(false);
    }
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

      {/* Nominate Modal */}
      {showNominateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">📝 提名论文</h3>
                <p className="text-sm text-gray-600 mt-1">推荐一篇值得团队阅读的论文</p>
              </div>
              <button
                onClick={() => {
                  setShowNominateModal(false);
                  setNominationForm({ nominatorName: '', title: '', authors: '', paperUrl: '', abstract: '', tags: [] });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Nominator Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  提名人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nominationForm.nominatorName}
                  onChange={(e) => setNominationForm(prev => ({ ...prev, nominatorName: e.target.value }))}
                  placeholder="例如：CinyaMa"
                  className="w-full px-4 py-3 border  border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  论文标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nominationForm.title}
                  onChange={(e) => setNominationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：Attention Is All You Need"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Authors */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  作者列表
                </label>
                <input
                  type="text"
                  value={nominationForm.authors}
                  onChange={(e) => setNominationForm(prev => ({ ...prev, authors: e.target.value }))}
                  placeholder="例如：Vaswani et al."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Paper URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  论文链接 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={nominationForm.paperUrl}
                  onChange={(e) => setNominationForm(prev => ({ ...prev, paperUrl: e.target.value }))}
                  placeholder="https://arxiv.org/abs/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">支持 arXiv, ACL Anthology, DOI 等任意链接</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="输入标签后按回车"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium"
                  >
                    添加
                  </button>
                </div>
                {nominationForm.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {nominationForm.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-indigo-900"
                        >
                          <FiX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Abstract */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  摘要/简介
                </label>
                <textarea
                  value={nominationForm.abstract}
                  onChange={(e) => setNominationForm(prev => ({ ...prev, abstract: e.target.value }))}
                  placeholder="简要描述这篇论文的主要内容和为什么值得阅读..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowNominateModal(false);
                  setNominationForm({ nominatorName: '', title: '', authors: '', paperUrl: '', abstract: '', tags: [] });
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleSubmitNomination}
                disabled={submitting || !nominationForm.title.trim() || !nominationForm.paperUrl.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? '提交中...' : '✅ 提交提名'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalClub;
