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
  handleSave: (data: SaveClipboardRequest) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleSaveManualInput: (content: string, type?: ClipboardType) => Promise<boolean>;
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
  
  // 获取最新剪贴板和历史记录
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
          // 数组格式
          items = historyRes.data;
          pageValue = 1;
          pagesValue = 1;
        } else if ('items' in historyRes.data) {
          // 对象格式 
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
  
  // 加载更多数据
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
        // 收藏夹分页
        response = await clipboardService.getFavorites(nextPage, pageSize);
      } else if (activeTab === 'all') {
        // 全部内容
        response = await clipboardService.getClipboardHistory(nextPage, pageSize);
      } else {
        // 按类型筛选
        response = await clipboardService.getClipboardHistory(
          nextPage, 
          pageSize, 
          activeTab as ClipboardType
        );
      }
      
      if (response.success && response.data) {
        // 防止ID重复
        const existingIds = new Set(clipboardItems.map(item => item.id));
        
        if ('items' in response.data) {
          // 新的分页格式
          const { items, page, totalPages: pages } = response.data;
          
          // 过滤已存在的项目
          const uniqueNewItems = items.filter(item => !existingIds.has(item.id));
          
          setClipboardItems(prevItems => [...prevItems, ...uniqueNewItems]);
          setCurrentPage(page);
          setTotalPages(pages);
          setHasMore(page < pages);
        } else if (Array.isArray(response.data)) {
          // 旧格式兼容
          // 过滤已存在的项目
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
  
  // 保存剪贴板内容
  const handleSaveClipboardContent = useCallback(async (content: string) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return false;
    }
    
    try {
      // 无论如何，当内容为空时，跳过保存
      if (!content || content.trim() === '') {
        return false;
      }
      
      // 检查是否重复 - 这部分从工具函数中导入
      const isDuplicate = clipboardItems.some(item => 
        item.content === content || 
        (item.content && content && 
         item.content.trim() === content.trim())
      );
      
      if (isDuplicate) {
        showToast('内容已存在于历史记录中', 'info');
        return false;
      }
      
      // 自动检测内容类型
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
      
      // 确保响应中有data字段
      if (response.data) {
        // 将返回的数据转换为前端使用的格式
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
        // 如果没有返回data，创建一个临时项目
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
  
  // 处理复制操作
  const handleCopy = useCallback((item?: ClipboardItem) => {
    if (!item) return;
    
    navigator.clipboard.writeText(item.content)
      .then(() => showToast('已复制到剪贴板', 'success'))
      .catch(err => {
        showToast('复制失败', 'error');
      });
  }, [showToast]);
  
  // 打开编辑模态窗
  const handleEdit = useCallback((item?: ClipboardItem) => {
    // 这个函数只返回被编辑的项目，不包含状态逻辑
    // 实际的模态窗操作会在主组件中处理
    return item;
  }, []);
  
  // 处理删除操作
  const handleDelete = useCallback(async (item: ClipboardItem) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      const response = await clipboardService.deleteClipboard(item.id);
      if (response.success) {
        // 更新列表
        setClipboardItems(prevItems => prevItems.filter(i => i.id !== item.id));
        
        // 如果删除的是当前剪贴板项目，则更新当前剪贴板
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
  
  // 切换收藏状态
  const handleToggleFavorite = useCallback(async (item: ClipboardItem) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      const response = await clipboardService.toggleFavorite(item.id, !item.isFavorite);
      if (response.success && response.data) {
        // 更新列表中的项目
        setClipboardItems(prevItems => 
          prevItems.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i)
        );
        
        // 更新当前剪贴板（如果需要）
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
  
  // 处理保存编辑操作
  const handleSave = useCallback(async (data: SaveClipboardRequest): Promise<void> => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    if (!data.id) {
      showToast('缺少项目ID', 'error');
      return;
    }
    
    try {
      const response = await clipboardService.updateClipboard(data.id, data);
      
      if (response.success && response.data) {
        // 更新列表
        setClipboardItems(prevItems => 
          prevItems.map(item => item.id === data.id ? response.data! : item)
        );
        
        // 如果更新的是当前剪贴板项目，同步更新
        if (currentClipboard && currentClipboard.id === data.id) {
          setCurrentClipboard(response.data);
        }
        
        showToast('更新成功', 'success');
      } else {
        showToast(response.message || '更新失败', 'error');
      }
    } catch (error) {
      showToast('更新失败', 'error');
      throw error;
    }
  }, [currentClipboard, showToast, isChannelVerified]);
  
  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    await fetchClipboardData();
    showToast('数据已刷新', 'success');
  }, [fetchClipboardData, showToast]);
  
  // 处理手动输入的内容保存
  const handleSaveManualInput = useCallback(async (content: string, type?: ClipboardType) => {
    if (!content.trim()) {
      showToast('内容不能为空', 'error');
      return false;
    }
    
    try {
      // 自动检测内容类型，如果传入了类型则使用传入的类型
      const contentType = type || detectClipboardType(content);
      
      // 如果类型不是TEXT，显示检测到的类型
      if (!type && contentType !== ClipboardType.TEXT) {
        showToast(`检测到内容类型为: ${getClipboardTypeName(contentType)}`, 'info');
      }
      
      // 使用现有的保存函数处理内容
      return await handleSaveClipboardContent(content);
    } catch (error) {
      showToast('保存失败', 'error');
      return false;
    }
  }, [handleSaveClipboardContent, showToast]);
  
  // 添加新函数: 获取特定Tab的数据
  const fetchTabData = useCallback(async (tab: ClipboardFilterType) => {
    if (!isChannelVerified) {
      showToast('请先验证通道', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      
      let response;
      if (tab === 'favorite') {
        // 收藏夹数据
        response = await clipboardService.getFavorites(1, pageSize);
      } else if (tab === 'all') {
        // 全部内容
        response = await clipboardService.getClipboardHistory(1, pageSize);
      } else {
        // 按类型筛选
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
          // 数组格式
          items = response.data;
          pageValue = 1;
          pagesValue = 1;
        } else if ('items' in response.data) {
          // 对象格式 
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
  
  // 初始加载数据
  useEffect(() => {
    if (isChannelVerified) {
      fetchClipboardData();
    }
  }, [isChannelVerified, fetchClipboardData]);
  
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
    handleSaveManualInput
  };
}; 