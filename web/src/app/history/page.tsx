'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ClipboardGrid from '@/components/clipboard/ClipboardGrid';
import EditModal from '@/components/clipboard/EditModal';
import { ClipboardItem, SaveClipboardRequest, ClipboardType } from '@/types/clipboard';
import { clipboardService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<ClipboardItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClipboardItem | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12;
  
  // 添加一个ref，用于标记是否已初始化
  const isInitializedRef = useRef<boolean>(false);

  // 获取剪贴板历史记录
  const fetchHistory = useCallback(async (page = 1, type?: ClipboardType) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await clipboardService.getClipboardHistory(page, pageSize, type);
      
      if (response.success && response.data) {
        let items: ClipboardItem[] = [];
        let currentPageValue = page;
        let pagesValue = 1;
        
        if (Array.isArray(response.data)) {
          // 数组格式
          items = response.data;
          currentPageValue = page;
          pagesValue = 1;
        } else if ('items' in response.data) {
          // 对象格式
          items = response.data.items;
          currentPageValue = response.data.page;
          pagesValue = response.data.totalPages;
        }
        
        if (page === 1) {
          // 首次加载或刷新
          setHistoryItems(items);
        } else {
          // 加载更多时确保不存在重复ID
          setHistoryItems(prevItems => {
            const existingIds = new Set(prevItems.map(item => item.id));
            const uniqueNewItems = items.filter(item => !existingIds.has(item.id));
            return [...prevItems, ...uniqueNewItems];
          });
        }
        
        setCurrentPage(currentPageValue);
        setTotalPages(pagesValue);
        setHasMore(currentPageValue < pagesValue);
      } else {
        showToast(response.message || '获取历史记录失败', 'error');
      }
    } catch (error) {
      showToast('获取历史记录失败', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [showToast, pageSize]); // 移除historyItems依赖

  // 加载更多数据
  const loadMoreData = useCallback(() => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchHistory(currentPage + 1);
    }
  }, [currentPage, totalPages, isLoadingMore, fetchHistory]);

  // 刷新数据
  const refreshData = useCallback(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  // 初始化加载
  useEffect(() => {
    // 只在初次渲染时加载数据
    if (!isInitializedRef.current) {
      fetchHistory(1);
      isInitializedRef.current = true;
    }
  }, [fetchHistory]);

  // 处理复制操作
  const handleCopy = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.content)
      .then(() => showToast('已复制到剪贴板', 'success'))
      .catch(() => {
        showToast('复制失败', 'error');
      });
  };

  // 打开编辑模态窗
  const handleEdit = (item: ClipboardItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // 处理删除操作
  const handleDelete = async (item: ClipboardItem) => {
    if (!window.confirm('确定要删除这个历史记录吗？')) {
      return;
    }
    
    try {
      const response = await clipboardService.deleteClipboard(item.id);
      if (response.success) {
        // 更新列表
        setHistoryItems(prevItems => prevItems.filter(i => i.id !== item.id));
        showToast('删除成功', 'success');
      } else {
        showToast(response.message || '删除失败', 'error');
      }
    } catch {
      showToast('删除失败', 'error');
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = async (item: ClipboardItem) => {
    try {
      const response = await clipboardService.toggleFavorite(item.id, !item.isFavorite);
      if (response.success && response.data) {
        // 更新列表中的项目
        setHistoryItems(prevItems => 
          prevItems.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i)
        );
        showToast(item.isFavorite ? '已取消收藏' : '已添加到收藏', 'success');
      } else {
        showToast(response.message || '切换收藏状态失败', 'error');
      }
    } catch {
      showToast('切换收藏状态失败', 'error');
    }
  };

  // 保存编辑
  const handleSave = async (data: SaveClipboardRequest) => {
    if (!editingItem) return;
    
    try {
      const response = await clipboardService.updateClipboard(editingItem.id, data);
      if (response.success && response.data) {
        // 更新列表中的项目
        setHistoryItems(prevItems => 
          prevItems.map(i => i.id === editingItem.id ? response.data! : i)
        );
        showToast('保存成功', 'success');
      } else {
        showToast(response.message || '保存失败', 'error');
      }
    } catch (error) {
      showToast('保存失败', 'error');
      throw error;
    }
  };

  return (
    <MainLayout>
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-medium">历史记录</h1>
          <p className="text-sm text-gray-500">查看您的剪贴板历史记录</p>
        </div>
        <button 
          onClick={refreshData}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          刷新
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : (
            <ClipboardGrid 
              items={historyItems}
              onCopy={handleCopy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              hasMore={hasMore}
              onLoadMore={loadMoreData}
              isLoadingMore={isLoadingMore}
            />
          )}
        </div>
      </div>
      
      <EditModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSave}
        initialData={editingItem}
      />
    </MainLayout>
  );
} 