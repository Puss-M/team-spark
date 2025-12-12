'use client';
import React, { useCallback, useRef, useEffect } from 'react';
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

  const graphData: GraphData = React.useMemo(() => {
    const nodes: GraphNode[] = ideas.map((idea) => {
      const popularity = (idea.likes_count || 0) + (idea.comments_count || 0);
      const size = Math.max(8, Math.min(35, 8 + popularity * 2.5));

      // 鲜艳的彩色星球
      const tagColors: Record<string, string> = {
        '技术': '#2563eb', // 深蓝
        '商业': '#16a34a', // 鲜绿
        '设计': '#9333ea', // 紫罗兰
        '产品': '#ea580c', // 深橙
        '研究': '#dc2626', // 深红
        '艺术': '#db2777', // 品红
        '教育': '#0891b2', // 青色
        '其他': '#6366f1', // 靛蓝
      };
      
      const mainTag = idea.tags?.[0] || '其他';
      const color = tagColors[mainTag] || '#8b5cf6';

      return {
        id: idea.id,
        name: idea.title,
        val: size,
        color,
        idea,
      };
    });

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

  const handleNodeClick = useCallback((node: any) => {
    console.log('Clicked node:', node.name);
  }, []);

  // 创建明亮背景
  useEffect(() => {
    if (!fgRef.current) return;

    const scene = fgRef.current.scene();
    
    // 天空渐变球
    const skyGeo = new THREE.SphereGeometry(1500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4f9dde) },
        bottomColor: { value: new THREE.Color(0xe0f4ff) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h * 0.5 + 0.5, 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // 彩色漂浮粒子
    const particlesGeo = new THREE.BufferGeometry();
    const particlesMat = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const positions = [];
    const colors = [];
    const palette = [
      new THREE.Color(0xff6b9d),
      new THREE.Color(0x4facfe),
      new THREE.Color(0x43e97b),
      new THREE.Color(0xfeca57),
      new THREE.Color(0xc471ed),
    ];

    for (let i = 0; i < 4000; i++) {
      const x = (Math.random() - 0.5) * 1000;
      const y = (Math.random() - 0.5) * 1000;
      const z = (Math.random() - 0.5) * 1000;
      positions.push(x, y, z);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors.push(color.r, color.g, color.b);
    }

    particlesGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // 明亮光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-200 relative overflow-hidden">
      {/* 返回按钮 */}
      <button
        onClick={() => setActiveView('feed')}
        className="absolute top-4 left-4 z-10 px-5 py-2.5 bg-white/90 backdrop-blur-sm text-gray-800 rounded-xl hover:bg-white shadow-xl transition-all font-semibold border border-white/50"
      >
        ← 返回
      </button>

      {/* 标题 */}
      <div className="absolute top-4 right-4 z-10 text-right">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
          🌈 Idea Galaxy
        </h1>
        <p className="text-gray-700 text-sm font-semibold mt-1">
          {ideas.length} colorful ideas
        </p>
      </div>

      {/* 3D 图 */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="val"
        nodeOpacity={0.95}
        onNodeClick={handleNodeClick}
        linkColor={() => 'rgba(100,100,255,0.35)'}
        linkWidth={2.5}
        linkOpacity={0.5}
        backgroundColor="rgba(0,0,0,0)"
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />

      {/* 图例 */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border-2 border-white/60">
        <h3 className="text-gray-800 font-bold mb-3 text-base flex items-center gap-2">
          🎨 分类标签
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 shadow-lg ring-2 ring-blue-200"></div>
            <span className="text-gray-700 font-semibold">技术</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-600 shadow-lg ring-2 ring-green-200"></div>
            <span className="text-gray-700 font-semibold">商业</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-purple-600 shadow-lg ring-2 ring-purple-200"></div>
            <span className="text-gray-700 font-semibold">设计</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-orange-600 shadow-lg ring-2 ring-orange-200"></div>
            <span className="text-gray-700 font-semibold">产品</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-600 shadow-lg ring-2 ring-red-200"></div>
            <span className="text-gray-700 font-semibold">研究</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Galaxy3D;
