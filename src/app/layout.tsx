import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import ClientProvider from '../components/ClientProvider';

export const metadata: Metadata = {
  title: 'Team Spark - 团队灵感管理平台',
  description: '一个用于团队灵感管理、碰撞和协作的平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
