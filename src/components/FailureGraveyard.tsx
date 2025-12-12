'use client';
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IdeaWithAuthors } from '../types';
import IdeaCard from './IdeaCard';

const FailureGraveyard: React.FC = () => {
  const { ideas, fetchIdeas } = useAppStore();
  const [failedIdeas, setFailedIdeas] = useState<IdeaWithAuthors[]>([]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  useEffect(() => {
    // Filter failed ideas
    const failed = ideas.filter(idea => (idea as any).is_failed === true);
    setFailedIdeas(failed);
  }, [ideas]);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">🪦</span>
          <div>
            <h1 className="text-3xl font-bold text-white">失败博物馆</h1>
            <p className="text-gray-400 mt-1">The Graveyard of Failed Ideas</p>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-300 mb-2">
            💡 <span className="font-semibold">记录失败比记录成功更重要</span>
          </p>
          <p className="text-sm text-gray-400">
            这里收录了团队验证过"行不通"的想法。避免重复踩坑，节省宝贵时间。
            分享失败经验可获得 <span className="text-yellow-400 font-bold">双倍金币奖励</span>！
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-3xl font-bold text-red-400">{failedIdeas.length}</div>
          <div className="text-sm text-gray-400 mt-1">失败案例</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-3xl font-bold text-yellow-400">
            {new Set(failedIdeas.flatMap(i => i.author_id)).size}
          </div>
          <div className="text-sm text-gray-400 mt-1">贡献者</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-3xl font-bold text-green-400">
            {failedIdeas.length * 100}
          </div>
          <div className="text-sm text-gray-400 mt-1">奖励金币</div>
        </div>
      </div>

      {/* Failed Ideas List */}
      {failedIdeas.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl border border-dashed border-gray-700">
          <span className="text-6xl mb-4 block">🌟</span>
          <p className="text-gray-400 mb-2">还没有失败案例</p>
          <p className="text-sm text-gray-500">勇敢尝试，分享失败经验可获得双倍奖励！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {failedIdeas.map((idea) => (
            <div key={idea.id} className="relative">
              {/* Failure Badge */}
              <div className="absolute -top-2 -left-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                ❌ 已验证失败
              </div>
              
              {/* Idea Card with Dark Theme */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <IdeaCard idea={idea} />
                
                {/* Failure Reason */}
                {(idea as any).failure_reason && (
                  <div className="p-4 bg-red-900/20 border-t border-red-900/30">
                    <h4 className="text-sm font-semibold text-red-300 mb-2">
                      💀 失败原因：
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {(idea as any).failure_reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      归档于: {new Date((idea as any).failed_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FailureGraveyard;
