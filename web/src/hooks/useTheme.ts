import { useState, useEffect } from 'react';
import { ThemeMode, settingsManager } from '@/utils/settings';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 应用主题到DOM
  const applyTheme = (themeMode: ThemeMode) => {
    if (typeof window === 'undefined') return;
    
    let shouldUseDark = false;
    
    if (themeMode === 'system') {
      // 跟随系统偏好
      shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      shouldUseDark = themeMode === 'dark';
    }
    
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsDarkMode(shouldUseDark);
  };

  // 初始化主题
  useEffect(() => {
    if (!isMounted) return;
    
    const currentTheme = settingsManager.getSetting('theme');
    setTheme(currentTheme);
    applyTheme(currentTheme);

    // 监听系统主题变化（仅在跟随系统时）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (settingsManager.getSetting('theme') === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // 监听设置变化
    const handleSettingsChange = () => {
      const newTheme = settingsManager.getSetting('theme');
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    settingsManager.addListener(handleSettingsChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      settingsManager.removeListener(handleSettingsChange);
    };
  }, [isMounted]);

  // 切换主题
  const setThemeMode = (newTheme: ThemeMode) => {
    settingsManager.setSetting('theme', newTheme);
  };

  // 快速切换亮/暗模式
  const toggleTheme = () => {
    const currentTheme = settingsManager.getSetting('theme');
    let newTheme: ThemeMode;
    
    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'light';
    } else {
      // 如果是system，根据当前实际显示切换
      newTheme = isDarkMode ? 'light' : 'dark';
    }
    
    setThemeMode(newTheme);
  };

  return {
    theme,
    isDarkMode,
    isMounted,
    setTheme: setThemeMode,
    toggleTheme,
  };
} 