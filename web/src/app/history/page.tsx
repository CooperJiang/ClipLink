'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ClipboardGrid from '@/components/clipboard/ClipboardGrid';
import EditModal from '@/components/clipboard/EditModal';
import PreviewModal from '@/components/clipboard/PreviewModal';
import SearchBar from '@/components/clipboard/SearchBar';
import { ClipboardItem, SaveClipboardRequest, ClipboardType } from '@/types/clipboard';
import { clipboardService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<ClipboardItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClipboardItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClipboardItem | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ClipboardItem | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12;
  
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<ClipboardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);
  
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
  }, [showToast, pageSize]);

  // 搜索剪贴板项目
  const searchClipboard = useCallback(async (keyword: string, page = 1) => {
    if (page === 1) {
      setIsSearching(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await clipboardService.searchClipboard(keyword, page, pageSize);
      
      if (response.success && response.data) {
        const items = response.data.items;
        
        if (page === 1) {
          setSearchResults(items);
        } else {
          setSearchResults(prevItems => {
            const existingIds = new Set(prevItems.map(item => item.id));
            const uniqueNewItems = items.filter(item => !existingIds.has(item.id));
            return [...prevItems, ...uniqueNewItems];
          });
        }
        
        setSearchPage(response.data.page);
        setSearchTotalPages(response.data.totalPages);
        setHasMoreSearch(response.data.page < response.data.totalPages);
      } else {
        if (page === 1) {
          setSearchResults([]);
          setSearchTotalPages(1);
          setHasMoreSearch(false);
        }
        showToast(response.message || '搜索失败', 'error');
      }
    } catch (error) {
      if (page === 1) {
        setSearchResults([]);
        setSearchTotalPages(1);
        setHasMoreSearch(false);
      }
      showToast('搜索失败', 'error');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, [showToast, pageSize]);

  // 加载更多数据
  const loadMoreData = useCallback(() => {
    if (isSearchMode) {
      // 搜索模式下加载更多搜索结果
      if (searchPage < searchTotalPages && !isLoadingMore && searchKeyword) {
        searchClipboard(searchKeyword, searchPage + 1);
      }
    } else {
      // 普通模式下加载更多历史记录
      if (currentPage < totalPages && !isLoadingMore) {
        fetchHistory(currentPage + 1);
      }
    }
  }, [isSearchMode, searchPage, searchTotalPages, isLoadingMore, searchKeyword, searchClipboard, currentPage, totalPages, fetchHistory]);

  // 刷新数据
  const refreshData = useCallback(() => {
    if (isSearchMode && searchKeyword) {
      searchClipboard(searchKeyword, 1);
    } else {
      fetchHistory(1);
    }
  }, [isSearchMode, searchKeyword, searchClipboard, fetchHistory]);

  // 处理搜索
  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword);
    setIsSearchMode(true);
    await searchClipboard(keyword, 1);
  }, [searchClipboard]);

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setSearchKeyword('');
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchPage(1);
    setSearchTotalPages(1);
    setHasMoreSearch(false);
  }, []);

  // 更新过滤后的项目
  useEffect(() => {
    if (isSearchMode) {
      setFilteredItems(searchResults);
    } else {
      setFilteredItems(historyItems);
    }
  }, [isSearchMode, searchResults, historyItems]);

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
  const handleEdit = (item?: ClipboardItem) => {
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
        if (isSearchMode) {
          setSearchResults(prevItems => prevItems.filter(i => i.id !== item.id));
        }
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
        const updateItem = (items: ClipboardItem[]) => 
          items.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i);
        
        setHistoryItems(updateItem);
        if (isSearchMode) {
          setSearchResults(updateItem);
        }
        showToast(item.isFavorite ? '已取消收藏' : '已添加到收藏', 'success');
      } else {
        showToast(response.message || '切换收藏状态失败', 'error');
      }
    } catch {
      showToast('切换收藏状态失败', 'error');
    }
  };

  // 保存编辑
  const handleSave = async (data: SaveClipboardRequest): Promise<boolean> => {
    if (!editingItem) return false;
    
    try {
      const response = await clipboardService.updateClipboard(editingItem.id, data);
      if (response.success && response.data) {
        // 更新列表中的项目
        const updateItem = (items: ClipboardItem[]) => 
          items.map(i => i.id === editingItem.id ? response.data! : i);
        
        setHistoryItems(updateItem);
        if (isSearchMode) {
          setSearchResults(updateItem);
        }
        showToast('保存成功', 'success');
        return true;
      } else {
        showToast(response.message || '保存失败', 'error');
        return false;
      }
    } catch (error) {
      showToast('保存失败', 'error');
      return false;
    }
  };

  // 处理预览按钮点击
  const handlePreview = (item: ClipboardItem) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  return (
    <MainLayout>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">历史记录</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isSearchMode ? `搜索 "${searchKeyword}" 的结果` : '查看您的剪贴板历史记录'}
            </p>
          </div>
          <button 
            onClick={refreshData}
            className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 text-sm transition-colors"
          >
            刷新
          </button>
        </div>
        
        {/* 搜索栏 */}
        <div className="max-w-md">
          <SearchBar 
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isSearching={isSearching}
            placeholder="搜索历史记录..."
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="h-full overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-gray-400 dark:text-gray-500">加载中...</span>
            </div>
          ) : (
            <ClipboardGrid 
              items={filteredItems}
              onCopy={handleCopy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onPreview={handlePreview}
              hasMore={isSearchMode ? hasMoreSearch : hasMore}
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
      
      <PreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewItem(undefined);
        }}
        item={previewItem}
      />
    </MainLayout>
  );
} 