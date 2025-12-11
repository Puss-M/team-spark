'use client';
import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '../store/useAppStore';
import { IdeaWithAuthors } from '../types';
import { FiMinimize2, FiMaximize2 } from 'react-icons/fi';

// Dynamically import ForceGraph3D with no SSR
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white">正在加载星系...</div>
});

const GalaxyView: React.FC = () => {
  const { ideas, fetchIdeas } = useAppStore();
  const [highlightNode, setHighlightNode] = useState<any>(null);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Transform ideas into graph data
  const graphData = useMemo(() => {
    const publicIdeas = ideas.filter(i => i.is_public);
    
    // Helper: 计算灵感年龄（天数）
    const getDaysOld = (createdAt: string) => {
      const now = new Date();
      const created = new Date(createdAt);
      return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    };
    
    // Helper: 根据生命周期返回颜色
    const getNodeColor = (idea: IdeaWithAuthors) => {
      const daysOld = getDaysOld(idea.created_at);
      const hotness = (idea.likes_count || 0) + (idea.comments_count || 0) * 2;
      
      // 红巨星：高热度（>10互动）
      if (hotness > 10) return '#ef4444'; // red-500
      
      // 新星：<3天
      if (daysOld < 3) return '#60a5fa'; // blue-400
      
      // 白矮星：>7天且低互动
      if (daysOld > 7 && hotness < 3) return '#9ca3af'; // gray-400
      
      // 恒星：正常状态
      return '#fbbf24'; // amber-400
    };
    
    // Helper: 计算节点大小
    const getNodeSize = (idea: IdeaWithAuthors) => {
      const daysOld = getDaysOld(idea.created_at);
      const hotness = (idea.likes_count || 0) * 2 + (idea.comments_count || 0) * 3;
      
      // 基础大小
      let size = 8;
      
      // 红巨星：1.5倍大
      if (hotness > 10) size = 15;
      // 新星：正常大小 + 闪烁
      else if (daysOld < 3) size = 10;
      // 白矮星：0.6倍小
      else if (daysOld > 7 && hotness < 3) size = 5;
      // 恒星：正常
      else size = 8 + hotness * 0.5;
      
      return size;
    };
    
    const nodes = publicIdeas.map(idea => ({
      id: idea.id,
      name: idea.title || idea.content.substring(0, 20) + '...',
      val: getNodeSize(idea),
      color: getNodeColor(idea),
      group: idea.tags && idea.tags.length > 0 ? idea.tags[0] : 'untagged',
      fullContent: idea.content,
      author: idea.authors?.[0]?.name || 'Unknown',
      daysOld: getDaysOld(idea.created_at),
      hotness: (idea.likes_count || 0) + (idea.comments_count || 0) * 2
    }));

    const links: { source: string; target: string }[] = [];
    
    // Create links based on shared tags
    for (let i = 0; i < publicIdeas.length; i++) {
      for (let j = i + 1; j < publicIdeas.length; j++) {
        const ideaA = publicIdeas[i];
        const ideaB = publicIdeas[j];
        
        // Find intersection of tags
        const tagsA = ideaA.tags || [];
        const tagsB = ideaB.tags || [];
        const sharedTags = tagsA.filter(tag => tagsB.includes(tag));

        if (sharedTags.length > 0) {
          links.push({
            source: ideaA.id,
            target: ideaB.id
          });
        }
      }
    }

    return { nodes, links };
  }, [ideas]);

  return (
    <div className="flex-1 relative bg-gray-50 overflow-hidden h-full">
      <div className="absolute top-4 left-4 z-10 bg-white/80 p-4 rounded-lg backdrop-blur-sm border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          灵感星系
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {graphData.nodes.length} 个灵感节点 · {graphData.links.length} 条引力连接
        </p>
      </div>

      <ForceGraph3D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node: any) => node.color} // 使用自定义颜色
        nodeResolution={16}
        linkDirectionalParticles={2} // 增加粒子数量
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.008} // 稍快的粒子
        backgroundColor="#f9fafb" // gray-50
        nodeOpacity={0.9}
        
        // Link styling
        linkColor={() => '#cbd5e1'} // slate-300
        linkOpacity={0.4} // 稍微增加透明度
        linkWidth={1.5}
        
        // Node styling
        nodeThreeObjectExtend={true} 
        
        // Interaction
        onNodeHover={(node) => {
          setHighlightNode(node);
          document.body.style.cursor = node ? 'pointer' : 'default';
        }}
        onNodeClick={(node: any) => {
          // 显示节点详情
          const statusEmoji = node.hotness > 10 ? '🔴 红巨星' : 
                            node.daysOld < 3 ? '🌟 新星' :
                            node.daysOld > 7 && node.hotness < 3 ? '⚪ 白矮星' : '⭐ 恒星';
          
          alert(`${statusEmoji}\n\n${node.name}\n\n${node.fullContent}\n\nBy: ${node.author}\n年龄: ${node.daysOld}天 | 热度: ${node.hotness}`);
        }}
      />
      
      {/* Tooltip / Info Panel */}
      {highlightNode && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none md:left-auto md:right-4 md:w-80">
           <div className="bg-white/90 text-gray-800 p-4 rounded-xl border border-gray-200 backdrop-blur-md shadow-xl">
             <h3 className="font-bold text-lg mb-1 text-gray-900">{highlightNode.name}</h3>
             <p className="text-gray-600 text-sm line-clamp-3 mb-2">{highlightNode.fullContent}</p>
             <div className="flex items-center justify-between text-xs text-gray-500">
               <span>@{highlightNode.author}</span>
               <span className="bg-gray-100 px-2 py-0.5 rounded-full">#{highlightNode.group}</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GalaxyView;
