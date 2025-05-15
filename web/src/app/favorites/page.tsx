'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ClipboardGrid from '@/components/clipboard/ClipboardGrid';
import EditModal from '@/components/clipboard/EditModal';
import { ClipboardItem, SaveClipboardRequest } from '@/types/clipboard';
import { clipboardService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<ClipboardItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClipboardItem | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12; // 默认页大小
  
  const { showToast } = useToast();

  // 获取收藏的剪贴板项目
  const fetchFavorites = async (page = 1, loadMore = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else if (loadMore) {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await clipboardService.getFavorites(page, pageSize);
      if (response.success && response.data) {
        let items: ClipboardItem[] = [];
        let currentPageValue = page;
        let totalPagesValue = 1;
        
        if (Array.isArray(response.data)) {
          // 数组格式
          items = response.data;
          currentPageValue = page;
          totalPagesValue = 1;
        } else if ('items' in response.data) {
          // 对象格式
          items = response.data.items;
          currentPageValue = response.data.page;
          totalPagesValue = response.data.totalPages;
        }
        
        if (page === 1 || !loadMore) {
          // 首次加载或刷新
          setFavoriteItems(items || []);
        } else {
          // 加载更多时避免ID重复
          const existingIds = new Set(favoriteItems.map(item => item.id));
          const uniqueNewItems = items.filter(item => !existingIds.has(item.id));
          
          setFavoriteItems(prevItems => [...prevItems, ...uniqueNewItems]);
        }
        
        setCurrentPage(currentPageValue);
        setTotalPages(totalPagesValue);
        setHasMore(currentPageValue < totalPagesValue);
      } else {
        showToast(response.message || '获取收藏失败', 'error');
      }
    } catch (error) {
      showToast('获取收藏失败', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  // 加载更多数据
  const loadMoreData = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchFavorites(currentPage + 1, true);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchFavorites();
  }, []);

  // 处理复制操作
  const handleCopy = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.content)
      .then(() => showToast('已复制到剪贴板', 'success'))
      .catch(() => showToast('复制失败', 'error'));
  };

  // 打开编辑模态窗
  const handleEdit = (item: ClipboardItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // 处理删除操作
  const handleDelete = async (item: ClipboardItem) => {
    if (!window.confirm('确定要删除这个收藏项目吗？')) {
      return;
    }
    
    try {
      const response = await clipboardService.deleteClipboard(item.id);
      if (response.success) {
        // 更新列表
        setFavoriteItems(prevItems => prevItems.filter(i => i.id !== item.id));
        showToast('删除成功', 'success');
      } else {
        showToast(response.message || '删除失败', 'error');
      }
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = async (item: ClipboardItem) => {
    try {
      const response = await clipboardService.toggleFavorite(item.id, !item.isFavorite);
      if (response.success) {
        // 如果取消收藏，则从收藏列表中移除
        if (item.isFavorite) {
          setFavoriteItems(prevItems => prevItems.filter(i => i.id !== item.id));
          showToast('已取消收藏', 'success');
        } else {
          // 这里理论上不应该出现，因为收藏页面只显示已收藏的项目
          await fetchFavorites();
          showToast('已添加到收藏', 'success');
        }
      } else {
        showToast(response.message || '切换收藏状态失败', 'error');
      }
    } catch (error) {
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
        setFavoriteItems(prevItems => 
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
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-lg font-medium">收藏夹</h1>
        <p className="text-sm text-gray-500">在这里查看您收藏的所有剪贴板项目</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : (
            <ClipboardGrid 
              items={favoriteItems}
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