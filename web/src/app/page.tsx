'use client';

import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CurrentClipboard from '@/components/clipboard/CurrentClipboard';
import ClipboardGrid from '@/components/clipboard/ClipboardGrid';
import EditModal from '@/components/clipboard/EditModal';
import PreviewModal from '@/components/clipboard/PreviewModal';
import SearchBar from '@/components/clipboard/SearchBar';
import { ClipboardItem, SaveClipboardRequest, ClipboardType } from '@/types/clipboard';
import ChannelDetailModal from '@/components/clipboard/ChannelDetailModal';
import AddContentModal from '@/components/modals/AddContentModal';
import { clipboardService } from '@/services/api';
import TabBar, { ClipboardFilterType } from '@/components/clipboard/TabBar';

import { 
  useClipboardPermission, 
  useClipboardData, 
  useChannelState,
  useClipboardFilter
} from '@/hooks';

export default function Home() {
  // 通道状态管理
  const {
    isChannelModalOpen,
    handleCloseChannelModal,
    isChannelVerified,
    channelId
  } = useChannelState();

  // 剪贴板权限管理
  const {
    hasClipboardPermission,
    syncEnabled,
    isIOSDevice,
    requestClipboardPermission,
  } = useClipboardPermission();

  // 添加数据加载标记 ref
  const initialDataLoadedRef = useRef(false);

  // TabBar 状态管理
  const [activeTab, setActiveTab] = useState<ClipboardFilterType>('all');
  const [filteredItems, setFilteredItems] = useState<ClipboardItem[]>([]);
  
  // 搜索状态管理
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<ClipboardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);
  
  // 剪贴板数据管理
  const {
    currentClipboard,
    clipboardItems,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchClipboardData,
    loadMoreData,
    handleSaveClipboardContent,
    handleCopy,
    handleEdit: originalHandleEdit,
    handleDelete: originalHandleDelete,
    handleToggleFavorite,
    handleSave: originalHandleSave,
    handleSaveManualInput: originalHandleSaveManualInput,
    setClipboardItems,
    setCurrentClipboard
  } = useClipboardData({
    pageSize: 12,
    isChannelVerified
  });

  // 确保总是有当前剪贴板内容
  const ensureCurrentClipboard = clipboardItems.length > 0 ? 
    (currentClipboard || clipboardItems[0]) : undefined;

  // 剪贴板过滤管理
  const {
    syncClipboard,
    handleDeletedContent,
    handleFilteredContent,
    trackProcessedContent,
    processedContents,
    deletedContents
  } = useClipboardFilter({
    hasClipboardPermission,
    isIOSDevice,
    isChannelVerified,
    onSaveContent: handleSaveClipboardContent,
    debug: false
  });

  // 本地UI状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClipboardItem | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ClipboardItem | undefined>();
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  
  useEffect(() => {
    if (isChannelVerified && !initialDataLoadedRef.current) {
      initialDataLoadedRef.current = true;
      
      fetchClipboardData();
    }
  }, [isChannelVerified, fetchClipboardData]);

  useEffect(() => {
    if (!currentClipboard && clipboardItems.length > 0) {
      setCurrentClipboard(clipboardItems[0]);
    }
  }, [clipboardItems, currentClipboard, setCurrentClipboard]);

  useEffect(() => {
    if (isChannelVerified) {
      const lastUpdateTimeRef = { current: 0 };
      
      const handleClipboardUpdate = async () => {
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 500) {
          return;
        }
        lastUpdateTimeRef.current = now;
        
        try {
          const response = await clipboardService.getCurrentClipboard();
          if (response.success && response.data) {
            if (!currentClipboard || 
                currentClipboard.id !== response.data.id || 
                currentClipboard.content !== response.data.content) {
              
              setCurrentClipboard(response.data);
              
              setClipboardItems(prevItems => {
                const exists = prevItems.some(item => item.id === response.data!.id);
                if (!exists) {
                  return [response.data!, ...prevItems];
                }
                return prevItems;
              });
            }
          }
        } catch (error) {
          console.error('获取更新的剪贴板内容失败:', error);
        }
      };
      
      window.addEventListener('clipboard-updated', handleClipboardUpdate);
      
      return () => {
        window.removeEventListener('clipboard-updated', handleClipboardUpdate);
      };
    }
  }, [isChannelVerified, setCurrentClipboard, setClipboardItems, currentClipboard]);

  useEffect(() => {
    if (clipboardItems.length > 0) {
      clipboardItems.forEach(item => {
        if (item.content) {
          trackProcessedContent(item.content);
        }
      });
    }
  }, [clipboardItems, trackProcessedContent]);

  useEffect(() => {
    const handleAddContentClick = () => {
      setIsAddContentModalOpen(true);
    };
    
    // 添加事件监听
    window.addEventListener('add-content-click', handleAddContentClick);
    
    // 清理函数
    return () => {
      window.removeEventListener('add-content-click', handleAddContentClick);
    };
  }, []);

  const handleDelete = async (item: ClipboardItem) => {
    if (item.content) {
      handleDeletedContent(item.content);
    }
    
    await originalHandleDelete(item);
  };
  
  const handleSave = async (data: SaveClipboardRequest): Promise<boolean> => {
    // 区分编辑现有项目和创建新项目
    if (data.id) {
      // 编辑现有项目 - 使用hook中的handleSave函数
      return await originalHandleSave(data);
    } else {
      // 创建新项目 - 自己处理
      
      if (data.content) {
        try {
          const filtered = await handleFilteredContent(data.content);
          if (!filtered) {
            return false;
          }
        } catch (error) {
          return false;
        }
      }
      
      try {
        const { id, ...saveData } = data;
        const result = await clipboardService.saveClipboard(saveData);
        
        if (result.success && result.data) {
          setClipboardItems(prev => [result.data!, ...prev]);
          setCurrentClipboard(result.data);
          
          if (data.content) {
            trackProcessedContent(data.content);
          }
          window.dispatchEvent(new Event('clipboard-updated'));
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
  };
  
  const handleSaveManualInput = async (
    content: string, 
    type?: ClipboardType, 
    isManualInput?: boolean
  ) => {
    const filtered = await handleFilteredContent(content);
    if (!filtered) return false;
    const result = await originalHandleSaveManualInput(content, type, isManualInput);
    if (result && content) {
      trackProcessedContent(content);
      window.dispatchEvent(new Event('clipboard-updated'));
    }
    return result;
  };
  
  const handleEdit = (item?: ClipboardItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handlePreview = (item: ClipboardItem) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  const handleRefresh = () => {
    fetchClipboardData();
    syncClipboard(true);
  };

  // 过滤剪贴板项目
  useEffect(() => {
    // 如果是搜索模式，使用搜索结果
    if (activeTab === 'search') {
      setFilteredItems(searchResults);
      return;
    }

    if (!clipboardItems || clipboardItems.length === 0) {
      setFilteredItems([]);
      return;
    }

    let filtered: ClipboardItem[] = [...clipboardItems];

    // 根据标签类型过滤
    if (activeTab !== 'all') {
      if (activeTab === 'favorite') {
        // 过滤收藏项
        filtered = filtered.filter(item => item.isFavorite);
      } else {
        // 过滤特定类型的项目
        filtered = filtered.filter(item => item.type === activeTab);
      }
    }

    setFilteredItems(filtered);
  }, [clipboardItems, activeTab, searchResults]);

  // 处理TabBar选项卡变更
  const handleTabChange = (tab: ClipboardFilterType) => {
    // 如果切换到非搜索标签，清除搜索状态
    if (tab !== 'search' && activeTab === 'search') {
      setSearchKeyword('');
      setSearchResults([]);
      setSearchTotal(0);
      setSearchPage(1);
      setHasMoreSearch(false);
    }
    
    setActiveTab(tab);
    // 过滤逻辑已移到上方的 useEffect 中
  };

  // 处理筛选按钮点击
  const handleFilterClick = () => {
    console.log('Filter clicked');
  };

  // 处理排序按钮点击
  const handleSortClick = () => {
    console.log('Sort clicked');
  };

  // 包装loadMoreData函数，传递当前activeTab
  const handleLoadMore = () => {
    if (activeTab === 'search' && searchKeyword) {
      loadMoreSearchResults();
    } else {
      loadMoreData(activeTab);
    }
  };

  // 处理搜索
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    setIsSearching(true);
    setActiveTab('search');
    setSearchPage(1);
    
    try {
      const response = await clipboardService.searchClipboard(keyword, 1, 12);
      if (response.success && response.data) {
        setSearchResults(response.data!.items);
        setSearchTotal(response.data!.total);
        setHasMoreSearch(response.data!.page < response.data!.totalPages);
      } else {
        setSearchResults([]);
        setSearchTotal(0);
        setHasMoreSearch(false);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
      setSearchTotal(0);
      setHasMoreSearch(false);
    } finally {
      setIsSearching(false);
    }
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchKeyword('');
    setSearchResults([]);
    setSearchTotal(0);
    setSearchPage(1);
    setHasMoreSearch(false);
    setActiveTab('all');
  };

  // 加载更多搜索结果
  const loadMoreSearchResults = async () => {
    if (!searchKeyword || !hasMoreSearch || isSearching) return;
    
    setIsSearching(true);
    const nextPage = searchPage + 1;
    
    try {
      const response = await clipboardService.searchClipboard(searchKeyword, nextPage, 12);
      if (response.success && response.data) {
        setSearchResults(prev => [...prev, ...response.data!.items]);
        setSearchPage(nextPage);
        setHasMoreSearch(nextPage < response.data!.totalPages);
      }
    } catch (error) {
      console.error('加载更多搜索结果失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <MainLayout>      
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gradient-dark overflow-hidden">
        {/* 固定的当前剪贴板区域 */}
        <div className="flex-shrink-0 px-3 pt-1.5">
          <CurrentClipboard 
            clipboard={ensureCurrentClipboard}
            onCopy={() => {
              if (ensureCurrentClipboard) handleCopy(ensureCurrentClipboard);
            }}
            onEdit={() => {
              if (ensureCurrentClipboard) handleEdit(ensureCurrentClipboard);
            }}
            onRefresh={handleRefresh}
            syncEnabled={syncEnabled}
            hasPermission={hasClipboardPermission}
            onRequestPermission={requestClipboardPermission}
            onSaveManualInput={handleSaveManualInput}
            isIOSDevice={isIOSDevice}
          />
        </div>
        
        {/* 搜索栏区域 */}
        <div className="flex-shrink-0 px-3 mb-2">
          <SearchBar 
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isSearching={isSearching}
          />
        </div>
        
        {/* 固定的TabBar区域 */}
        <div className="flex-shrink-0 px-3">
          <TabBar 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            onFilterClick={handleFilterClick}
            onSortClick={handleSortClick}
          />
        </div>
        
        {/* 可滚动的内容区域 - 仅ClipboardGrid */}
        <div className="flex-1 overflow-auto px-3 pb-1.5">
          <ClipboardGrid 
            items={filteredItems}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onPreview={handlePreview}
            hasMore={activeTab === 'search' ? hasMoreSearch : hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore || isSearching}
          />
        </div>
      </div>
      
      {/* 添加AddContentModal模态框 */}
      <AddContentModal 
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
        onSave={async (content, type, title, isFavorite) => {
          // 使用handleSave函数，包含收藏状态
          const saveData = {
            content,
            type: type || ClipboardType.TEXT,
            title,
            isFavorite
          };
          
          const result = await handleSave(saveData);
          if (result) {
            // 关闭模态框
            setIsAddContentModalOpen(false);
            // 注意：不需要再次刷新数据，handleSave已经更新了状态
          }
        }}
      />
      
      {/* 模态框组件 */}
      <EditModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSave}
        onSaveSuccess={(savedItem) => {
          // 如果是编辑现有项目
          if (savedItem.id && clipboardItems.some(item => item.id === savedItem.id)) {
            setClipboardItems(prevItems => 
              prevItems.map(item => item.id === savedItem.id ? savedItem : item)
            );
            
            // 如果当前剪贴板是被编辑的项目，也更新它
            if (currentClipboard && currentClipboard.id === savedItem.id) {
              setCurrentClipboard(savedItem);
            }
          } 
          // 如果是新建项目
          else {
            setClipboardItems(prev => [savedItem, ...prev]);
            setCurrentClipboard(savedItem);
          }
          
          // 如果有内容，记录为已处理
          if (savedItem.content) {
            trackProcessedContent(savedItem.content);
          }
        }}
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

      <ChannelDetailModal 
        isOpen={isChannelModalOpen} 
        onClose={handleCloseChannelModal} 
        channelId={channelId || ''}
      />
    </MainLayout>
  );
}
