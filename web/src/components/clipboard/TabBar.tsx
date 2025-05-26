import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faFilter, 
  faArrowDownShortWide,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { ClipboardType } from '@/types/clipboard';

// 调整类型定义，与ClipboardType更好地对应
export type ClipboardFilterType = 'all' | ClipboardType | 'favorite' | 'search';

interface TabBarProps {
  activeTab: ClipboardFilterType;
  onTabChange: (tab: ClipboardFilterType) => void;
  onFilterClick: () => void;
  onSortClick: () => void;
}

export default function TabBar({ 
  activeTab, 
  onTabChange, 
  onFilterClick, 
  onSortClick 
}: TabBarProps) {
  // 定义标签页数据
  const tabs = [
    {
      value: 'all',
      label: '全部',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
    },
    {
      value: 'text',
      label: '文本',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
    },
    {
      value: 'link',
      label: '链接',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
    },
    {
      value: 'code',
      label: '代码',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
    },
    {
      value: 'password',
      label: '密码',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
    },
    {
      value: 'favorite',
      label: '收藏',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
    }
  ];

  return (
    <div className="glass-effect bg-white/80 dark:bg-dark-surface-primary/80 backdrop-blur-xl border border-white/20 dark:border-dark-border-primary/30 rounded-xl shadow-lg dark:shadow-dark-md mb-2.5 overflow-hidden">
      <div className="flex items-center justify-between p-1.5">
        <div className="flex items-center space-x-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative flex items-center py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.value 
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 text-white shadow-md dark:shadow-glow-brand' 
                  : 'text-neutral-600 dark:text-dark-text-tertiary hover:text-neutral-800 dark:hover:text-dark-text-secondary hover:bg-white/50 dark:hover:bg-dark-surface-hover/50'
              }`}
              onClick={() => onTabChange(tab.value as ClipboardFilterType)}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-0.5">
          <button
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-dark-surface-hover/50 text-neutral-500 dark:text-dark-text-tertiary transition-all duration-200 hover:scale-105"
            title="筛选"
            onClick={onFilterClick}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          
          <button 
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-dark-surface-hover/50 text-neutral-500 dark:text-dark-text-tertiary transition-all duration-200 hover:scale-105"
            title="排序"
            onClick={onSortClick}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string | React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

function TabButton({ label, isActive, onClick, className = '' }: TabButtonProps) {
  return (
    <button 
      className={`px-2 md:px-4 py-3 border-b-2 whitespace-nowrap ${
        isActive 
          ? 'border-brand-500 text-brand-700 dark:text-brand-400 font-medium' 
          : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
      } text-sm ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
} 