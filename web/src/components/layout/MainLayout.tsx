import React, { ReactNode, useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ChannelDetailModal from '@/components/clipboard/ChannelDetailModal';
import HelpModal from './HelpModal';
import SettingsModal from '@/components/modals/SettingsModal';
import { useRouter, usePathname } from 'next/navigation';
import { useChannel } from '@/contexts/ChannelContext';
import { useClipboardData } from '@/hooks/useClipboardData';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // 添加状态控制各弹窗显示
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { channelId, isChannelVerified } = useChannel();
  const { handleSaveManualInput } = useClipboardData({ isChannelVerified });
  
  // 检查是否在首页
  const isHomePage = pathname === '/';
  
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

  // 监听来自Sidebar的设置事件
  useEffect(() => {
    const handleSettingsEvent = () => {
      setIsSettingsModalOpen(true);
    };

    window.addEventListener('open-settings', handleSettingsEvent);

    return () => {
      window.removeEventListener('open-settings', handleSettingsEvent);
    };
  }, []);

  // 处理新建内容
  const handleAddContent = () => {
    // 触发自定义事件，通知首页打开添加内容模态框
    const event = new Event('add-content-click');
    window.dispatchEvent(event);
  };

  // 处理打开设置
  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  // 处理打开数据通道
  const handleOpenChannel = () => {
    setIsChannelModalOpen(true);
  };

  // 处理打开帮助
  const handleOpenHelp = () => {
    setIsHelpModalOpen(true);
  };

  return (
    <div className="bg-neutral-50 dark:bg-gradient-dark h-screen flex flex-col overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* 优化的顶部导航栏设计 */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white/95 dark:bg-dark-surface-primary/95 backdrop-blur-md border-b border-neutral-200 dark:border-dark-border-primary shadow-sm dark:shadow-dark-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 text-white shadow-sm hover:shadow-md dark:shadow-glow-brand transition-all duration-300 cursor-pointer glow-on-hover">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary font-display">ClipLink</h1>
            <span className="text-xs text-neutral-500 dark:text-dark-text-tertiary font-medium">跨设备智能剪贴板</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 只在首页显示手动添加按钮 */}
          {isHomePage && (
            <button 
              onClick={handleAddContent}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
              title="手动添加内容"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
          
          <ThemeToggle />
          
          <button 
            onClick={handleOpenSettings}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surface-hover text-neutral-600 dark:text-dark-text-tertiary hover:text-neutral-800 dark:hover:text-dark-text-secondary transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-dark-border-secondary"
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button 
            onClick={handleOpenHelp}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surface-hover text-neutral-600 dark:text-dark-text-tertiary hover:text-neutral-800 dark:hover:text-dark-text-secondary transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-dark-border-secondary" 
            title="帮助"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <button 
            onClick={handleOpenChannel}
            className={`flex items-center glass-effect rounded-lg px-3 py-2 text-sm font-medium transition-all border shadow-sm hover:shadow-md ${
              isChannelVerified 
                ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-300 border-success-300 dark:border-success-800/30 hover:bg-success-200 dark:hover:bg-success-900/30 shadow-glow-success' 
                : 'bg-neutral-50/80 dark:bg-dark-surface-secondary/80 text-neutral-700 dark:text-dark-text-secondary border-neutral-200 dark:border-dark-border-secondary hover:bg-neutral-100/80 dark:hover:bg-dark-surface-hover/80'
            }`}
            title={isChannelVerified ? "已连接通道" : "未连接通道"}
          >
            <div className="flex items-center">
              {isChannelVerified && (
                <span className="h-2 w-2 bg-success-500 dark:bg-success-400 rounded-full mr-1.5 animate-pulse shadow-glow-success"></span>
              )}
              <span className="mr-1.5">{isChannelVerified ? '已连接' : '未连接'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden dark:text-dark-text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
      <MobileNav />
      {/* Footer在这里作为一个独立的元素，使用绝对定位 */}
      <Footer />
      
      {/* 添加各种模态弹窗 */}
      {isChannelModalOpen && (
        <ChannelDetailModal 
          isOpen={isChannelModalOpen} 
          onClose={() => setIsChannelModalOpen(false)} 
          channelId={channelId || ""} 
        />
      )}
      
      {/* 帮助弹窗 */}
      {isHelpModalOpen && (
        <HelpModal 
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      )}
      
      {/* 设置弹窗 */}
      {isSettingsModalOpen && (
        <SettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
} 