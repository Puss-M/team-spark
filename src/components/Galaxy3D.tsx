'use client';
import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '../store/useAppStore';

// 动态导入 ForceGraph2D 避免 SSR 问题
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  idea: any;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const Galaxy3D: React.FC = () => {
  const { ideas, setActiveView, setActiveIdea } = useAppStore();
  const fgRef = useRef<any>();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 生成图数据
  const graphData: GraphData = useMemo(() => {
    const nodes: GraphNode[] = ideas.map((idea) => {
      // 根据热度计算节点大小
      const popularity = (idea.likes_count || 0) + (idea.comments_count || 0);
      const size = Math.max(3, Math.min(15, 3 + popularity));

      // Obsidian 风格的柔和配色
      const tagColors: Record<string, string> = {
        '技术': '#7c3aed',   // 紫色
        '商业': '#10b981',   // 翠绿色
        '设计': '#f59e0b',   // 琥珀色
        '产品': '#3b82f6',   // 蓝色
        '研究': '#ec4899',   // 粉色
        '艺术': '#8b5cf6',   // 淡紫色
        '教育': '#14b8a6',   // 青色
        '其他': '#6b7280',   // 灰色
      };
      
      const mainTag = idea.tags?.[0] || '其他';
      const color = tagColors[mainTag] || '#6b7280';

      return {
        id: idea.id,
        name: idea.title,
        val: size,
        color,
        idea,
      };
    });

    // 生成连接（基于标签相似度）
    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const idea1 = ideas[i];
        const idea2 = ideas[j];
        
        const commonTags = idea1.tags.filter((tag: string) => 
          idea2.tags.includes(tag)
        ).length;

        if (commonTags > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: commonTags,
          });
        }
      }
    }

    return { nodes, links };
  }, [ideas]);

  // 节点点击事件
  const handleNodeClick = useCallback((node: any) => {
    console.log('Clicked node:', node.name);
    setActiveIdea(node.idea);
    setActiveView('feed');
  }, [setActiveIdea, setActiveView]);

  // 节点悬停事件
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  // 自定义节点渲染
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    const nodeRadius = Math.sqrt(node.val) * 2;
    
    // 绘制节点外圈（悬停效果）
    if (hoveredNode?.id === node.id) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = node.color + '40';
      ctx.fill();
    }

    // 绘制节点
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // 绘制节点边框
    ctx.strokeStyle = hoveredNode?.id === node.id ? '#ffffff' : node.color;
    ctx.lineWidth = hoveredNode?.id === node.id ? 2 / globalScale : 1 / globalScale;
    ctx.stroke();

    // 绘制文字标签
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(label, node.x, node.y + nodeRadius + fontSize);
  }, [hoveredNode]);

  // 自定义链接渲染（粒子效果）
  const linkCanvasObjectMode = useCallback(() => 'after', []);
  
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;
    
    // 如果节点还没有坐标，跳过渲染
    if (typeof start !== 'object' || typeof end !== 'object') return;

    // 绘制连线
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = hoveredNode?.id === start.id || hoveredNode?.id === end.id 
      ? '#6366f180' 
      : '#d1d5db60';
    ctx.lineWidth = link.value * 0.5;
    ctx.stroke();
  }, [hoveredNode]);

  // 缩放控制
  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.2, 400);
    }
  };

  const handleCenterView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  };

  // 初始化视图
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(1000, 100);
      }, 500);
    }
  }, [graphData]);

  return (
    <div className="w-full h-screen relative" style={{ backgroundColor: '#fafafa' }}>
      {/* 返回按钮 */}
      <button
        onClick={() => setActiveView('feed')}
        className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/90 backdrop-blur-md text-gray-700 rounded-lg hover:bg-white transition-all font-medium border border-gray-200 shadow-lg"
      >
        ← 返回
      </button>

      {/* 标题 */}
      <div className="absolute top-6 right-6 z-10 text-right">
        <h1 className="text-2xl font-semibold text-gray-800">
          🌐 知识图谱
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {ideas.length} 个想法 · {graphData.links.length} 个连接
        </p>
      </div>

      {/* 缩放控制 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <button
          onClick={handleZoomOut}
          className="px-3 py-2 bg-white/90 backdrop-blur-md text-gray-700 rounded-lg hover:bg-white transition-all border border-gray-200 shadow-lg"
          title="缩小"
        >
          −
        </button>
        <button
          onClick={handleCenterView}
          className="px-3 py-2 bg-white/90 backdrop-blur-md text-gray-700 rounded-lg hover:bg-white transition-all border border-gray-200 shadow-lg"
          title="居中"
        >
          ⊙
        </button>
        <button
          onClick={handleZoomIn}
          className="px-3 py-2 bg-white/90 backdrop-blur-md text-gray-700 rounded-lg hover:bg-white transition-all border border-gray-200 shadow-lg"
          title="放大"
        >
          +
        </button>
      </div>

      {/* 图谱 */}
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeVal="val"
        nodeCanvasObject={nodeCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        linkCanvasObjectMode={linkCanvasObjectMode}
        linkCanvasObject={linkCanvasObject}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.006}
        backgroundColor="#fafafa"
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTime={3000}
        d3VelocityDecay={0.3}
      />

      {/* 图例 */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-md rounded-lg p-4 border border-gray-200 shadow-lg">
        <h3 className="text-gray-700 font-semibold mb-3 text-sm">分类标签</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7c3aed' }}></div>
            <span className="text-gray-600">技术</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-gray-600">商业</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-gray-600">设计</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-gray-600">产品</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ec4899' }}></div>
            <span className="text-gray-600">研究</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#14b8a6' }}></div>
            <span className="text-gray-600">教育</span>
          </div>
        </div>
      </div>

      {/* 悬停信息提示 */}
      {hoveredNode && (
        <div className="absolute bottom-6 right-6 z-10 bg-white/95 backdrop-blur-md rounded-lg p-4 border border-gray-200 shadow-lg max-w-sm">
          <h4 className="text-gray-800 font-semibold mb-1">{hoveredNode.name}</h4>
          <p className="text-gray-500 text-sm mb-2">
            {hoveredNode.idea.tags?.join(' · ')}
          </p>
          <p className="text-gray-700 text-sm line-clamp-3">
            {hoveredNode.idea.content}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>❤️ {hoveredNode.idea.likes_count || 0}</span>
            <span>💬 {hoveredNode.idea.comments_count || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Galaxy3D;
