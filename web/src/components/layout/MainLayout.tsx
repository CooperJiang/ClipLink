import React, { ReactNode, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // 添加CSS变量设置视口高度
  useEffect(() => {
    // 设置CSS变量，用于设置准确的视口高度
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // 初始设置
    setViewportHeight();
    
    // 监听窗口大小变化
    window.addEventListener('resize', setViewportHeight);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
} 