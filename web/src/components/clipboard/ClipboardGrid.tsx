import React, { useEffect, useRef } from 'react';
import ClipboardItemCard from './ClipboardItem';
import { ClipboardItem } from '@/types/clipboard';

// 添加getContentPreview函数定义
const getContentPreview = (content: string, maxLength: number = 30): string => {
  if (!content) return '';
  
  // 移除多余空格和换行符
  const trimmedContent = content.trim().replace(/\s+/g, ' ');
  
  if (trimmedContent.length <= maxLength) {
    return trimmedContent;
  }
  
  return `${trimmedContent.substring(0, maxLength)}...`;
};

// 格式化日期时间，确保添加秒数显示
const formatDateTime = (date: Date | string | number | undefined): string => {
  if (!date) return ''; 
  
  try {
    const dateObj = new Date(date);
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '';
  }
};

interface ClipboardGridProps {
  items: ClipboardItem[];
  onCopy: (item: ClipboardItem) => void;
  onEdit: (item?: ClipboardItem) => void;
  onDelete: (item: ClipboardItem) => void;
  onToggleFavorite: (item: ClipboardItem) => void;
  onPreview: (item: ClipboardItem) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export default function ClipboardGrid({ 
  items = [],
  onCopy, 
  onEdit, 
  onDelete, 
  onToggleFavorite,
  onPreview,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false
}: ClipboardGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 使用IntersectionObserver实现滚动加载更多
  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // 当监听的元素进入视口时
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, onLoadMore, isLoadingMore]);
  
  // 检查items是否为undefined或null，如果是则使用空数组
  // 去除重复ID的项目
  const uniqueItems = Array.isArray(items) 
    ? items.reduce<ClipboardItem[]>((acc, current) => {
        const isDuplicate = acc.find(item => item.id === current.id);
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, [])
    : [];
  
  if (uniqueItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="glass-effect bg-white/60 dark:bg-dark-surface-primary/60 backdrop-blur-md rounded-2xl p-6 mb-4 shadow-lg dark:shadow-dark-lg border border-white/30 dark:border-dark-border-primary/30">
          <svg className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-neutral-800 dark:text-dark-text-primary mb-2">暂无剪贴板历史</h3>
        <p className="text-neutral-600 dark:text-dark-text-tertiary text-center max-w-md mb-4 text-sm leading-relaxed">
          您的剪贴板历史记录将显示在这里。复制任何内容或点击右上角&ldquo;+&rdquo;按钮来创建第一条记录。
        </p>
        <button 
          className="inline-flex items-center px-4 py-2 glass-effect bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 text-white text-sm font-medium rounded-lg shadow-lg dark:shadow-glow-brand hover:shadow-xl hover:scale-105 transition-all duration-200 glow-on-hover"
          onClick={() => onEdit(undefined)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加新内容
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full pb-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-7 gap-2.5">
        {uniqueItems.map(item => (
          <div 
            key={item.id}
            className={`group relative glass-effect bg-white/80 dark:bg-dark-surface-primary/80 backdrop-blur-md rounded-xl border border-white/30 dark:border-dark-border-primary/30 shadow-md hover:shadow-lg dark:shadow-dark-md dark:hover:shadow-dark-lg transition-all duration-300 overflow-hidden flex flex-col hover:scale-[1.02] glow-on-hover h-40 ${
              item.type === 'code' ? 'hover:shadow-amber-200/50 dark:hover:shadow-glow-warning' :
              item.type === 'link' ? 'hover:shadow-blue-200/50 dark:hover:shadow-glow-accent' :
              item.type === 'password' ? 'hover:shadow-red-200/50 dark:hover:shadow-glow-error' :
              'hover:shadow-brand-200/50 dark:hover:shadow-glow-brand'
            }`}
          >
            {/* 卡片内容 */}
            <div 
              className="flex-1 p-3 cursor-pointer flex flex-col"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(item);
              }}
            >
              {/* 类型标识和标题 */}
              <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
                <div className="flex items-center">
                  <span 
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-medium mr-2 shadow-sm ${
                      item.type === 'code' ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                      item.type === 'link' ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white' :
                      item.type === 'password' ? 'bg-gradient-to-br from-red-400 to-red-500 text-white' :
                      'bg-gradient-to-br from-neutral-400 to-neutral-500 text-white'
                    }`}
                  >
                    {item.type === 'code' ? '<>' : 
                     item.type === 'link' ? '🔗' :
                     item.type === 'password' ? '🔒' : 'Aa'}
                  </span>
                  <span className="text-xs font-medium text-neutral-800 dark:text-dark-text-primary truncate max-w-[120px]">
                    {item.title || getContentPreview(item.content, 20)}
                  </span>
                </div>
                
                <button 
                  className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-dark-surface-hover/60 text-neutral-500 dark:text-dark-text-muted hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-200 hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item);
                  }}
                  title={item.isFavorite ? "取消收藏" : "收藏"}
                >
                  {item.isFavorite ? (
                    <svg className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 内容预览 - 固定高度，可滚动 */}
              <div className="flex-1 overflow-hidden">
                <div className={`h-14 overflow-y-auto text-xs break-words text-neutral-700 dark:text-dark-text-secondary leading-relaxed custom-scrollbar ${
                  item.type === 'code' ? 'font-mono text-xs glass-effect bg-white/40 dark:bg-dark-surface-secondary/40 p-2 rounded-lg border border-white/20 dark:border-dark-border-secondary/20' : ''
                }`}>
                  {item.type === 'password' 
                    ? '••••••••••••••••' 
                    : item.content}
                </div>
              </div>
            </div>
            
            {/* 底部操作按钮和时间 - 固定在底部 */}
            <div className="glass-effect bg-white/60 dark:bg-dark-surface-secondary/60 border-t border-white/20 dark:border-dark-border-primary/20 p-2.5 flex justify-between items-center flex-shrink-0">
              {/* 时间 */}
              <div className="flex items-center text-xs text-neutral-500 dark:text-dark-text-muted">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDateTime(item.createdAt || item.created_at)}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex space-x-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(item);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-dark-surface-hover/60 text-neutral-600 dark:text-dark-text-tertiary hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-200 hover:scale-105"
                  title="复制"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-dark-surface-hover/60 text-neutral-600 dark:text-dark-text-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
                  title="编辑"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-900/30 text-neutral-600 dark:text-dark-text-tertiary hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-105"
                  title="删除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-4 mb-3 flex justify-center" ref={loadMoreRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onLoadMore) onLoadMore();
            }}
            className={`inline-flex items-center px-5 py-2.5 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all duration-200 ${
              isLoadingMore 
                ? 'bg-neutral-200 text-neutral-600 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 cursor-not-allowed'
                : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700/80 hover:shadow-md'
            }`}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <div className="relative w-4 h-4 mr-2">
                  <div className="absolute top-0 left-0 w-full h-full border-2 border-neutral-300 dark:border-neutral-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-2 border-brand-600 dark:border-brand-400 rounded-full animate-spin border-t-transparent dark:border-t-transparent"></div>
                </div>
                加载中...
              </>
            ) : (
              <>
                <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                加载更多
              </>
            )}
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-500 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-1">无相关剪贴板内容</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4 max-w-sm">
            您可以通过手动添加或等待系统自动同步来获取剪贴板数据
          </p>
        </div>
      )}
    </div>
  );
} 