'use client';
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IdeaWithAuthors } from '../types';
import { FiChevronLeft, FiChevronRight, FiX, FiMaximize, FiCalendar, FiUsers, FiTrendingUp } from 'react-icons/fi';
import MarkdownRenderer from './MarkdownRenderer';

const SeminarMode: React.FC = () => {
  const { ideas, fetchIdeas } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [weeklyIdeas, setWeeklyIdeas] = useState<IdeaWithAuthors[]>([]);
  const [groupedSlides, setGroupedSlides] = useState<IdeaWithAuthors[][]>([]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Filter ideas from this week
  useEffect(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekIdeas = ideas.filter(idea => {
      const createdAt = new Date(idea.created_at);
      return createdAt >= oneWeekAgo;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setWeeklyIdeas(thisWeekIdeas);
    
    // Group ideas intelligently
    const grouped = groupIdeasByLength(thisWeekIdeas);
    setGroupedSlides(grouped);
  }, [ideas]);

  // Smart grouping: short ideas together, long ideas alone
  const groupIdeasByLength = (ideas: IdeaWithAuthors[]): IdeaWithAuthors[][] => {
    const groups: IdeaWithAuthors[][] = [];
    let currentGroup: IdeaWithAuthors[] = [];
    const SHORT_THRESHOLD = 400; // characters
    const MAX_PER_SLIDE = 2;

    ideas.forEach(idea => {
      const contentLength = idea.content.length;
      const isShort = contentLength < SHORT_THRESHOLD;

      if (isShort && currentGroup.length < MAX_PER_SLIDE) {
        // Add to current group if it's short and group not full
        currentGroup.push(idea);
      } else {
        // Save current group if not empty
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
        
        // Long idea gets its own slide, or start new group
        if (isShort) {
          currentGroup.push(idea);
        } else {
          groups.push([idea]);
        }
      }
    });

    // Don't forget remaining group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight' && currentSlide < groupedSlides.length) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === 'Escape') {
        setIsFullScreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullScreen(!isFullScreen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, groupedSlides.length, isFullScreen]);

  const totalSlides = groupedSlides.length + 1; // +1 for intro slide

  // Calculate weekly stats
  const weeklyStats = {
    totalIdeas: weeklyIdeas.length,
    totalAuthors: new Set(weeklyIdeas.flatMap(i => i.author_id)).size,
    totalLikes: weeklyIdeas.reduce((sum, i) => sum + (i.likes_count || 0), 0),
    totalComments: weeklyIdeas.reduce((sum, i) => sum + (i.comments_count || 0), 0),
    topTags: getTopTags(weeklyIdeas, 5),
  };

  function getTopTags(ideas: IdeaWithAuthors[], limit: number) {
    const tagCounts: { [tag: string]: number } = {};
    ideas.forEach(idea => {
      idea.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  const renderIntroSlide = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-12">
      <h1 className="text-6xl font-bold mb-6 animate-fade-in">
        🚀 每周灵感大巡礼
      </h1>
      <p className="text-2xl mb-12 opacity-90">Team Spark Weekly Review</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{weeklyStats.totalIdeas}</div>
          <div className="text-lg opacity-80">新想法</div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{weeklyStats.totalAuthors}</div>
          <div className="text-lg opacity-80">贡献者</div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{weeklyStats.totalLikes}</div>
          <div className="text-lg opacity-80">点赞</div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{weeklyStats.totalComments}</div>
          <div className="text-lg opacity-80">讨论</div>
        </div>
      </div>

      {weeklyStats.topTags.length > 0 && (
        <div className="text-center">
          <p className="text-xl mb-4 opacity-80">本周热门话题</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {weeklyStats.topTags.map(tag => (
              <span key={tag} className="px-4 py-2 bg-white/20 rounded-full text-lg backdrop-blur">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-12 text-lg opacity-70">按 → 或点击右箭头开始浏览</p>
    </div>
  );

  const renderIdeaSlide = (idea: IdeaWithAuthors, index: number) => (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Left Column - Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {idea.authors[0].name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{idea.authors[0].name}</h3>
              <p className="text-xs text-gray-500">
                {new Date(idea.created_at).toLocaleDateString('zh-CN')} · 想法 #{index + 1}/{weeklyIdeas.length}
              </p>
            </div>
          </div>
          
          {/* Compact Stats */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1 text-red-500">
              <span className="text-lg">❤️</span>
              <span className="font-bold">{idea.likes_count}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-500">
              <span className="text-lg">💬</span>
              <span className="font-bold">{idea.comments_count}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{idea.title}</h2>
        
        {/* Tags - Compact */}
        {idea.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {idea.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <MarkdownRenderer content={idea.content} />
        </div>
      </div>

      {/* Right Column - Metadata & Context */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto flex flex-col gap-4">
        {/* Status Cards */}
        <div className="space-y-2">
          {idea.status === 'project' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🚀</span>
                <span className="font-bold text-green-800 text-sm">已立项</span>
              </div>
              <p className="text-xs text-green-600">这个想法已经转化为实际项目</p>
            </div>
          )}
          
          {idea.is_bounty && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💰</span>
                <span className="font-bold text-orange-800 text-sm">悬赏中</span>
              </div>
              <p className="text-xs text-orange-600 mb-1">奖金: {idea.bounty_amount} 金币</p>
              <p className="text-xs text-orange-500">征集最佳解决方案</p>
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h4 className="font-semibold text-gray-700 text-sm mb-2">📊 互动统计</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">点赞数</span>
              <span className="font-bold text-red-500">{idea.likes_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">评论数</span>
              <span className="font-bold text-blue-500">{idea.comments_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">热度</span>
              <span className="font-bold text-purple-500">
                {(idea.likes_count || 0) + (idea.comments_count || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Time Info */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="font-semibold text-blue-700 text-sm mb-2">🕒 时间信息</h4>
          <div className="space-y-1 text-xs text-blue-600">
            <div>创建: {new Date(idea.created_at).toLocaleString('zh-CN')}</div>
            <div className="text-blue-500">
              {Math.floor((Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60 * 24))} 天前
            </div>
          </div>
        </div>

        {/* Quick Actions Suggestion */}
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <h4 className="font-semibold text-purple-700 text-sm mb-2">💡 讨论要点</h4>
          <ul className="space-y-1 text-xs text-purple-600 list-disc list-inside">
            <li>可行性分析</li>
            <li>需要的资源</li>
            <li>潜在挑战</li>
            <li>后续计划</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-50' : 'relative'} bg-gray-100`}>
      <div className={`${isFullScreen ? 'h-screen' : 'min-h-screen'} flex flex-col`}>
        {/* Top Controls */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FiCalendar size={20} />
            <span className="font-semibold">组会模式</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-300">
              幻灯片 {currentSlide + 1} / {totalSlides}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title={isFullScreen ? '退出全屏 (F)' : '全屏 (F)'}
            >
              <FiMaximize size={18} />
            </button>
            {isFullScreen && (
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="退出 (ESC)"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Main Slide Area */}
        <div className="flex-1 relative bg-white shadow-2xl overflow-hidden">
          {currentSlide === 0 ? (
            renderIntroSlide()
          ) : (
            <div className="h-full overflow-y-auto">
              {groupedSlides[currentSlide - 1]?.map((idea, idx) => (
                <div key={idea.id} className={idx > 0 ? 'border-t-4 border-gray-200' : ''}>
                  {renderIdeaSlide(idea, weeklyIdeas.indexOf(idea))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronLeft />
            <span>上一个</span>
          </button>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentSlide ? 'bg-white w-8' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>下一个</span>
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Keyboard Hints */}
      {!isFullScreen && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          <div className="font-semibold mb-2">键盘快捷键</div>
          <div className="space-y-1 text-gray-300">
            <div>← → 切换幻灯片</div>
            <div>F 全屏模式</div>
            <div>ESC 退出全屏</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeminarMode;
