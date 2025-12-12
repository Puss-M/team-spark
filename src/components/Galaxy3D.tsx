'use client';
import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '../store/useAppStore';
import * as THREE from 'three';

// 动态导入 ForceGraph3D 避免 SSR 问题
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
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
  const { ideas, setActiveView } = useAppStore();
  const fgRef = useRef<any>();

  // 生成图数据
  const graphData: GraphData = useMemo(() => {
    const nodes: GraphNode[] = ideas.map((idea) => {
      // 根据热度计算节点大小
      const popularity = (idea.likes_count || 0) + (idea.comments_count || 0);
      const size = Math.max(5, Math.min(30, 5 + popularity * 2));

      // 根据标签选择颜色
      const tagColors: Record<string, string> = {
        '技术': '#3b82f6', // 亮蓝色
        '商业': '#22c55e', // 鲜绿色 (Restored)
        '设计': '#a855f7', // 鲜紫色 (Restored)
        '产品': '#f97316', // 鲜橙色 (Restored)
        '研究': '#ef4444', // 鲜红色
        '艺术': '#ec4899', // 粉红色
        '教育': '#14b8a6', // 青色
        '其他': '#64748b', // 灰蓝色
      };
      
      const mainTag = idea.tags?.[0] || '其他';
      const color = tagColors[mainTag] || '#64748b';

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
  }, []);

  // 创建粒子背景
  useEffect(() => {
    if (!fgRef.current) return;

    const scene = fgRef.current.scene();
    
    // 恢复深色背景
    scene.background = new THREE.Color(0x000010); // 深夜蓝黑 (Slightly blue-ish dark)
    
    // 添加星空背景
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8,
    });
// ... (rest is creating stars)


    // 生成随机星星位置
    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

  }, []);

  return (
    <div className="w-full h-screen bg-black relative">
      {/* 返回按钮 */}
      <button
        onClick={() => setActiveView('feed')}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all font-medium border border-white/10"
      >
        ← 返回
      </button>

      {/* 标题 */}
      <div className="absolute top-4 right-4 z-10 text-right">
        <h1 className="text-3xl font-bold text-white/90">
          🌌 Idea Galaxy
        </h1>
        <p className="text-white/60 text-sm">
          {ideas.length} ideas in the universe
        </p>
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="val"
        nodeOpacity={0.95}
        onNodeClick={handleNodeClick}
        linkColor={() => 'rgba(100,100,255,0.3)'}
        linkWidth={2}
        linkOpacity={0.4}
        backgroundColor="rgba(0,0,0,0)"
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-2">分类标签</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white/80">技术</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white/80">商业</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-white/80">设计</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-white/80">产品</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Galaxy3D;
