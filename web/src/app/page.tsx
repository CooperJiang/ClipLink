'use client';

import React, { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CurrentClipboard from '@/components/clipboard/CurrentClipboard';
import TabBar, { ClipboardFilterType } from '@/components/clipboard/TabBar';
import ClipboardGrid from '@/components/clipboard/ClipboardGrid';
import EditModal from '@/components/clipboard/EditModal';
import PreviewModal from '@/components/clipboard/PreviewModal';
import { ClipboardItem, SaveClipboardRequest } from '@/types/clipboard';
import ChannelModal from '@/components/clipboard/ChannelModal';

// 从索引文件导入所有钩子
import { 
  useClipboardPermission, 
  useClipboardData, 
  useClipboardSync, 
  useChannelState 
} from '@/hooks';

export default function Home() {
  // 通道状态管理
  const {
    isChannelModalOpen,
    handleCloseChannelModal,
    isChannelVerified,
  } = useChannelState();

  // 剪贴板权限管理
  const {
    hasClipboardPermission,
    syncEnabled,
    isIOSDevice,
    requestClipboardPermission,
  } = useClipboardPermission();

  // 剪贴板数据管理
  const {
    currentClipboard,
    clipboardItems,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchClipboardData,
    fetchTabData,
    loadMoreData,
    handleSaveClipboardContent,
    handleCopy,
    handleEdit: editItem,
    handleDelete,
    handleToggleFavorite,
    handleSave,
    handleSaveManualInput,
  } = useClipboardData({
    pageSize: 12,
    isChannelVerified
  });

  // 剪贴板同步
  useClipboardSync({
    hasClipboardPermission,
    isIOSDevice,
    isChannelVerified,
    onContentRead: handleSaveClipboardContent
  });

  // 本地状态管理
  const [activeTab, setActiveTab] = useState<ClipboardFilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClipboardItem | undefined>();
  
  // 添加预览状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ClipboardItem | undefined>();
  
  // 初始化标记，避免重复请求
  const isInitialTabRenderRef = useRef<boolean>(true);

  // 处理编辑按钮点击
  const handleEdit = (item?: ClipboardItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // 处理预览按钮点击
  const handlePreview = (item: ClipboardItem) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  // 处理Tab变化时的数据加载
  const handleTabChange = (tab: ClipboardFilterType) => {
    setActiveTab(tab);
    
    // 不再需要初始加载检查，直接请求数据
    // 使用fetchTabData加载特定Tab的数据
    fetchTabData(tab);
  };

  return (
    <MainLayout>
      <CurrentClipboard 
        clipboard={currentClipboard}
        onCopy={() => {
          if (currentClipboard) {
            handleCopy(currentClipboard);
          }
        }}
        onEdit={() => {
          if (currentClipboard) {
            handleEdit(currentClipboard);
          }
        }}
        onRefresh={() => fetchClipboardData()}
        syncEnabled={syncEnabled}
        hasPermission={hasClipboardPermission}
        onRequestPermission={requestClipboardPermission}
        onSaveManualInput={handleSaveManualInput}
        isIOSDevice={isIOSDevice}
      />
      
      <TabBar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onFilterClick={() => {}}
        onSortClick={() => {}}
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : (
            <ClipboardGrid 
              items={clipboardItems}
              onCopy={handleCopy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onPreview={handlePreview}
              hasMore={hasMore}
              onLoadMore={() => loadMoreData(activeTab)}
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

      {/* 预览模态框 */}
      <PreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewItem(undefined);
        }}
        item={previewItem}
      />

      {/* 通道模态框 */}
      <ChannelModal 
        isOpen={isChannelModalOpen} 
        onClose={handleCloseChannelModal} 
        forceOpen={!isChannelVerified}
      />
    </MainLayout>
  );
}
