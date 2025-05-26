'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 初始化主题
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    // 检查系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // 检查本地存储
    const storedTheme = localStorage.getItem('theme');
    
    const shouldUseDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, [isMounted]);

  // 切换主题
  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const newTheme = isDarkMode ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    setIsDarkMode(!isDarkMode);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
      aria-label="切换主题"
    >
      {isDarkMode ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
} 