import React, { useEffect, useRef } from 'react';
import ClipboardItemCard from './ClipboardItem';
import { ClipboardItem } from '@/types/clipboard';

interface ClipboardGridProps {
  items: ClipboardItem[];
  onCopy: (item: ClipboardItem) => void;
  onEdit: (item: ClipboardItem) => void;
  onDelete: (item: ClipboardItem) => void;
  onToggleFavorite: (item: ClipboardItem) => void;
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
      <div className="flex items-center justify-center h-40 text-gray-400">
        暂无剪贴板项目
      </div>
    );
  }
  
  return (
    <div className="w-full pb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {uniqueItems.map(item => (
          <ClipboardItemCard
            key={item.id}
            item={item}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-6 mb-2 flex justify-center" ref={loadMoreRef}>
          {isLoadingMore ? (
            <div className="text-gray-400 py-2">加载中...</div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              加载更多
            </button>
          )}
        </div>
      )}
    </div>
  );
} 