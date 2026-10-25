# Team Spark

[![CI](https://github.com/Puss-M/team-spark/actions/workflows/ci.yml/badge.svg)](https://github.com/Puss-M/team-spark/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=nextdotjs)](package.json)

想法火花平台 —— 记下每一个念头，让 AI 找到它和同伴想法的共鸣。

## 它做什么

- 💡 **想法流（Ideas Feed）**：团队成员随手记录想法，按标签过滤浏览
- 🧲 **语义匹配（Match Ideas）**：输入新想法时，基于语义向量提示"和谁的旧想法相近"，让同类念头相互吸引成簇
- 🔔 **RAG 提醒**：写想法时自动检索相关历史内容，避免重复造轮子

## 技术栈

Next.js 16 (App Router) · TypeScript · Supabase (SSR 认证 + 数据库) · `@xenova/transformers`（浏览器本地 embedding）· Zustand · Tailwind CSS

## 快速开始

```bash
npm install
cp .env.local.example .env.local   # Supabase 地址与 Key
npm run dev
```

## 相关项目

- [digital-garden-mvp](https://github.com/Puss-M/digital-garden-mvp)：个人版语义花园（UMAP 图谱可视化）
- [team-lab](https://github.com/Puss-M/team-lab)：Swift Coding Club 社区站点

## License

[MIT](LICENSE)
