import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { clipboardService } from '@/services/api';
import { ClipboardItem, ClipboardType, SaveClipboardRequest } from '@/types/clipboard';
import { ClipboardFilterType } from '@/components/clipboard/TabBar';
import { detectClipboardType } from '@/utils/clipboardTypeDetector';
import { getClipboardTypeName } from '@/utils/clipboardTypeDetector';

interface UseClipboardDataProps {
  pageSize?: number;
  isChannelVerified: boolean;
}

interface UseClipboardDataReturn {
  currentClipboard: ClipboardItem | undefined;
  clipboardItems: ClipboardItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  fetchClipboardData: () => Promise<void>;
  fetchTabData: (tab: ClipboardFilterType) => Promise<void>;
  loadMoreData: (activeTab: ClipboardFilterType) => Promise<void>;
  handleSaveClipboardContent: (content: string) => Promise<boolean>;
  handleCopy: (item?: ClipboardItem) => void;
  handleEdit: (item?: ClipboardItem) => void;
  handleDelete: (item: ClipboardItem) => Promise<void>;
  handleToggleFavorite: (item: ClipboardItem) => Promise<void>;
  handleSave: (data: SaveClipboardRequest) => Promise<boolean>;
  handleRefresh: () => Promise<void>;
  handleSaveManualInput: (content: string, type?: ClipboardType, isManualInput?: boolean) => Promise<boolean>;
  setClipboardItems: React.Dispatch<React.SetStateAction<ClipboardItem[]>>;
  setCurrentClipboard: React.Dispatch<React.SetStateAction<ClipboardItem | undefined>>;
}

export const useClipboardData = ({
  pageSize = 12,
  isChannelVerified
}: UseClipboardDataProps): UseClipboardDataReturn => {
  const [currentClipboard, setCurrentClipboard] = useState<ClipboardItem | undefined>();
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const { showToast } = useToast();
  
  const fetchClipboardData = useCallback(async () => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      const [latestRes, historyRes] = await Promise.all([
        clipboardService.getLatestClipboard(),
        clipboardService.getClipboardHistory(1, pageSize)
      ]);
      
      if (latestRes.success && latestRes.data) {
        setCurrentClipboard(latestRes.data);
      }
      
      if (historyRes.success && historyRes.data) {
        let items: ClipboardItem[] = [];
        let pageValue = 1;
        let pagesValue = 1;
        
        if (Array.isArray(historyRes.data)) {
          items = historyRes.data;
          pageValue = 1;
          pagesValue = 1;
        } else if ('items' in historyRes.data) {
          items = historyRes.data.items;
          pageValue = historyRes.data.page;
          pagesValue = historyRes.data.totalPages;
        }
        
        setClipboardItems(items);
        setCurrentPage(pageValue);
        setTotalPages(pagesValue);
        setHasMore(pageValue < pagesValue);
      }
    } catch (error) {
      showToast('获取数据失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, pageSize, isChannelVerified]);
  
  const loadMoreData = useCallback(async (activeTab: ClipboardFilterType) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    if (currentPage >= totalPages || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      let response;
      if (activeTab === 'favorite') {
        response = await clipboardService.getFavorites(nextPage, pageSize);
      } else if (activeTab === 'all') {
        response = await clipboardService.getClipboardHistory(nextPage, pageSize);
      } else {
        response = await clipboardService.getClipboardHistory(
          nextPage, 
          pageSize, 
          activeTab as ClipboardType
        );
      }
      
      if (response.success && response.data) {
        const existingIds = new Set(clipboardItems.map(item => item.id));
        
        if ('items' in response.data) {
          const { items, page, totalPages: pages } = response.data;
          
          const uniqueNewItems = items.filter(item => !existingIds.has(item.id));
          
          setClipboardItems(prevItems => [...prevItems, ...uniqueNewItems]);
          setCurrentPage(page);
          setTotalPages(pages);
          setHasMore(page < pages);
        } else if (Array.isArray(response.data)) {
          const uniqueFilteredItems = response.data.filter(item => !existingIds.has(item.id));
          
          setClipboardItems(prevItems => [...prevItems, ...uniqueFilteredItems]);
          setCurrentPage(nextPage);
          setHasMore(false);
        }
      }
    } catch (error) {
      showToast('加载更多数据失败', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, totalPages, isLoadingMore, showToast, clipboardItems, pageSize, isChannelVerified]);
  
  const handleSaveClipboardContent = useCallback(async (content: string) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return false;
    }
    
    try {
      if (!content || content.trim() === '') {
        return false;
      }
      
      const isDuplicate = clipboardItems.some(item => 
        item.content === content || 
        (item.content && content && 
         item.content.trim() === content.trim())
      );
      
      if (isDuplicate) {
        showToast('内容已存在于历史记录中', 'info');
        return false;
      }
      
      const detectedType = detectClipboardType(content);
      
      const response = await clipboardService.saveClipboard({
        content: content,
        type: detectedType
      });
      
      if (!response || !response.success) {
        const errorMsg = response?.error || response?.message || '未知错误';
        showToast(`保存失败: ${errorMsg}`, 'error');
        return false;
      }
      
      if (response.data) {
        const rawData = response.data as any;
        const clipboardItem: ClipboardItem = {
          id: rawData.id || 'temp-' + Date.now(),
          content: rawData.content || content,
          type: rawData.type || ClipboardType.TEXT,
          title: rawData.title || '',
          isFavorite: rawData.favorite || rawData.isFavorite || false,
          created_at: rawData.created_at || new Date().toISOString(),
          createdAt: rawData.created_at || new Date().toISOString(),
          updatedAt: rawData.updated_at || new Date().toISOString()
        };
        
        setCurrentClipboard(clipboardItem);
        setClipboardItems(prev => [clipboardItem, ...prev]);
      } else {
        const tempItem: ClipboardItem = {
          id: 'temp-' + Date.now(),
          content: content,
          type: ClipboardType.TEXT,
          title: '',
          isFavorite: false,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCurrentClipboard(tempItem);
        setClipboardItems(prev => [tempItem, ...prev]);
      }
      
      showToast('新内容已同步', 'success');
      return true;
    } catch (error) {
      showToast('保存失败，请重试', 'error');
      return false;
    }
  }, [showToast, clipboardItems, isChannelVerified]);
  
  const handleCopy = useCallback((item?: ClipboardItem) => {
    if (!item) return;
    
    navigator.clipboard.writeText(item.content)
      .then(() => showToast('已复制到剪贴板', 'success'))
      .catch(err => {
        showToast('复制失败', 'error');
      });
  }, [showToast]);
  
  const handleEdit = useCallback((item?: ClipboardItem) => {
    return item;
  }, []);
  
  const handleDelete = useCallback(async (item: ClipboardItem) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      // @ts-expect-error 全局定义
      if (window.__clipboardSync?.recordUserEdit) {
        // @ts-expect-error 全局定义
        window.__clipboardSync.recordUserEdit();
      }
      
      const response = await clipboardService.deleteClipboard(item.id);
      if (response.success) {
        setClipboardItems(prevItems => prevItems.filter(i => i.id !== item.id));
        
        if (currentClipboard && currentClipboard.id === item.id) {
          const latestRes = await clipboardService.getLatestClipboard();
          if (latestRes.success && latestRes.data) {
            setCurrentClipboard(latestRes.data);
          } else {
            setCurrentClipboard(undefined);
          }
        }
        
        showToast('删除成功', 'success');
      } else {
        showToast(response.message || '删除失败', 'error');
      }
    } catch (error) {
      showToast('删除失败', 'error');
    }
  }, [currentClipboard, showToast, isChannelVerified]);
  
  const handleToggleFavorite = useCallback(async (item: ClipboardItem) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      const response = await clipboardService.toggleFavorite(item.id, !item.isFavorite);
      if (response.success && response.data) {
        setClipboardItems(prevItems => 
          prevItems.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i)
        );
        
        if (currentClipboard && currentClipboard.id === item.id) {
          setCurrentClipboard({ ...currentClipboard, isFavorite: !currentClipboard.isFavorite });
        }
        
        showToast(item.isFavorite ? '已取消收藏' : '已添加到收藏', 'success');
      } else {
        showToast(response.message || '操作失败', 'error');
      }
    } catch (error) {
      showToast('操作失败', 'error');
    }
  }, [currentClipboard, showToast, isChannelVerified]);
  
  const handleSave = useCallback(async (data: SaveClipboardRequest): Promise<boolean> => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return false;
    }
    
    if (!data.id) {
      showToast('缺少项目ID', 'error');
      return false;
    }
    
    try {
      // @ts-expect-error 全局定义
      if (window.__clipboardSync?.recordUserEdit) {
        // @ts-expect-error 全局定义
        window.__clipboardSync.recordUserEdit();
      }
      
      const response = await clipboardService.updateClipboard(data.id, data);
      
      if (response.success && response.data) {
        setClipboardItems(prevItems => 
          prevItems.map(item => item.id === data.id ? response.data! : item)
        );
        
        if (currentClipboard && currentClipboard.id === data.id) {
          setCurrentClipboard(response.data);
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
  }, [currentClipboard, showToast, isChannelVerified]);
  
  const handleRefresh = useCallback(async () => {
    await fetchClipboardData();
  }, [fetchClipboardData]);
  
  const handleSaveManualInput = useCallback(async (
    content: string, 
    type?: ClipboardType, 
    isManualInput: boolean = true
  ): Promise<boolean> => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return false;
    }
    
    // @ts-expect-error 全局定义
    if (window.__clipboardSync?.recordUserEdit) {
      // @ts-expect-error 全局定义
      window.__clipboardSync.recordUserEdit();
    }
    
      const contentType = type || detectClipboardType(content);
      
    if (contentType !== ClipboardType.TEXT && !type) {
      showToast(`检测到${getClipboardTypeName(contentType)}内容`, 'info');
      }
      
    if (!isManualInput) {
      const isDuplicate = clipboardItems.some(item => 
        item.content === content || 
        (item.content && content && 
         item.content.trim() === content.trim())
      );
      
      if (isDuplicate) {
        showToast('内容已存在于历史记录中', 'info');
        return false;
      }
    }
    
    try {
      const response = await clipboardService.saveClipboard({
        content,
        type: contentType
      });
      
      if (response.success && response.data) {
        const clipboardItem: ClipboardItem = response.data;
        
        setCurrentClipboard(clipboardItem);
        setClipboardItems(prev => [clipboardItem, ...prev]);
        
        return true;
      } else {
        showToast(response.message || '保存失败', 'error');
        return false;
      }
    } catch (error) {
      showToast('保存失败，请重试', 'error');
      return false;
    }
  }, [showToast, clipboardItems, isChannelVerified]);
  
  const fetchTabData = useCallback(async (tab: ClipboardFilterType) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      let response;
      
      if (tab === 'favorite') {
        response = await clipboardService.getFavorites(1, pageSize);
      } else if (tab === 'all') {
        response = await clipboardService.getClipboardHistory(1, pageSize);
      } else {
        response = await clipboardService.getClipboardHistory(
          1, 
          pageSize, 
          tab as ClipboardType
        );
      }
      
      if (response.success && response.data) {
        let items: ClipboardItem[] = [];
        let pageValue = 1;
        let pagesValue = 1;
        
        if (Array.isArray(response.data)) {
          items = response.data;
          pageValue = 1;
          pagesValue = 1;
        } else if ('items' in response.data) {
          items = response.data.items;
          pageValue = response.data.page;
          pagesValue = response.data.totalPages;
        }
        
        setClipboardItems(items);
        setCurrentPage(pageValue);
        setTotalPages(pagesValue);
        setHasMore(pageValue < pagesValue);
      }
    } catch (error) {
      showToast('获取数据失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, pageSize, isChannelVerified]);
  
  useEffect(() => {
    if (isChannelVerified) {
      fetchClipboardData();
    }
  }, [fetchClipboardData, isChannelVerified]);
  
  return {
    currentClipboard,
    clipboardItems,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    totalPages,
    fetchClipboardData,
    fetchTabData,
    loadMoreData,
    handleSaveClipboardContent,
    handleCopy,
    handleEdit,
    handleDelete,
    handleToggleFavorite,
    handleSave,
    handleRefresh,
    handleSaveManualInput,
    setClipboardItems,
    setCurrentClipboard
  };
}; 