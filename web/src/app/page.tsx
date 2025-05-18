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
import { isIOS } from '@/utils/deviceDetection';
import AddClipboardModal from '@/components/clipboard/AddClipboardModal';

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

<<<<<<< HEAD
  // 添加toast
  const { showToast } = useToast();

  // 添加通道状态
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const { channelId, isChannelVerified, isLoading: isChannelLoading } = useChannel();

  // 添加手动输入模态框的状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 获取最新剪贴板和历史记录 - 使用useCallback提高性能
  const fetchClipboardData = useCallback(async () => {
    console.log('开始获取剪贴板数据...');
    
    try {
      setIsLoading(true);
      console.log('开始从服务器获取全部数据...');
      
      const [latestRes, historyRes] = await Promise.all([
        clipboardService.getLatestClipboard(),
        clipboardService.getClipboardHistory(1, pageSize)
      ]);
      
      console.log('最新剪贴板响应:', latestRes);
      console.log('历史记录响应:', historyRes);
      
      if (latestRes.success && latestRes.data) {
        setCurrentClipboard(latestRes.data);
        if (latestRes.data.content) {
          lastClipboardContentRef.current = latestRes.data.content;
        }
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
        
        console.log(`获取到 ${items.length} 条历史记录，总页数: ${pagesValue}`);
        
        setClipboardItems(items);
        setCurrentPage(pageValue);
        setTotalPages(pagesValue);
        setHasMore(pageValue < pagesValue);
      }
      
      // 标记初始化完成
      isInitializedRef.current = true;
    } catch (error) {
      console.error('获取所有数据失败:', error);
      showToast('获取数据失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, pageSize]);

  // 加载更多数据 - 现在支持按类型筛选
  const loadMoreData = useCallback(async () => {
    if (currentPage >= totalPages || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      let response;
      if (activeTab === 'favorite') {
        // 收藏夹分页 - 使用专门的API
        response = await clipboardService.getFavorites(nextPage, pageSize);
      } else if (activeTab === 'all') {
        // 全部内容 - 不指定类型
        response = await clipboardService.getClipboardHistory(nextPage, pageSize);
      } else {
        // 按类型筛选 - 传递类型参数
        response = await clipboardService.getClipboardHistory(
          nextPage, 
          pageSize, 
          activeTab as ClipboardType // 将选项卡类型转换为ClipboardType
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
  }, [activeTab, currentPage, totalPages, isLoadingMore, showToast, clipboardItems, pageSize]);

  // 保存剪贴板内容 - 单独函数，确保逻辑清晰
  const saveClipboardContent = useCallback(async (content: string) => {
    try {
      // 重复检测前，先尝试获取本地存储的数据
      // 优先使用完整的本地存储的数据进行检测，而不仅仅是当前显示的数据
      let itemsToCheck = clipboardItems;
      
      // 无论如何，当内容为空时，跳过保存
      if (!content || content.trim() === '') {
        return false;
      }
      
      // 检查是否重复
      const isDuplicate = isContentDuplicate(content, itemsToCheck);
      
      if (isDuplicate) {
        showToast('内容已存在于历史记录中', 'info');
        // 即使跳过保存，也要更新最后内容记录
        lastClipboardContentRef.current = content;
        return false;
      }
      
      const response = await clipboardService.saveClipboard({
        content: content,
        type: ClipboardType.TEXT
      });
      
      if (!response || !response.success) {
        const errorMsg = response?.error || response?.message || '未知错误';
        showToast(`保存失败: ${errorMsg}`, 'error');
        return false;
      }
      
      // 保存成功，记录内容
      lastClipboardContentRef.current = content;
      
      // 确保响应中有data字段
      if (response.data) {
        // 将返回的数据转换为前端使用的格式
        const rawData = response.data as any; // 使用 any 类型暂时绕过类型检查
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
  }, [showToast, clipboardItems]);

  // 读取剪贴板内容 - 添加时间防抖
  const readClipboardContent = useCallback(async (force = false) => {
    // 检查距离上次读取是否过短（1秒内不重复触发读取）
    const now = Date.now();
    const timeSinceLastRead = now - lastEventTimeRef.current;
    
    if (timeSinceLastRead < 1000 && !force) {
      return; // 短时间内重复触发，直接返回
    }
    
    // 更新最后事件时间
    lastEventTimeRef.current = now;
    
    // 如果同步锁激活，等待释放
    if (syncLockRef.current) {
      if (force) {
        setTimeout(() => readClipboardContent(true), 500);
      }
      return;
    }
    
    // 设置同步锁
    syncLockRef.current = true;
    
    try {
      // 读取剪贴板
      const text = await navigator.clipboard.readText();
      
      // 读取成功，说明权限正常，确保状态一致
      if (!hasClipboardPermission) {
        setHasClipboardPermission(true);
        setSyncEnabled(true);
      }
      
      // 更新最后读取时间
      lastReadTimeRef.current = now;
      
      // 内容为空则跳过
      if (!text || text.trim() === '') {
        return;
      }
      
      // 与上次内容相同则跳过
      if (text === lastClipboardContentRef.current) {
        return;
      }
      
      // 保存新内容
      await saveClipboardContent(text);
    } catch (error) {
      // 处理权限错误
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setHasClipboardPermission(false);
        setSyncEnabled(false);
        showToast('无法访问剪贴板，请重新授权', 'error');
      } else {
        showToast('读取剪贴板失败', 'error');
      }
    } finally {
      // 解除同步锁
      syncLockRef.current = false;
    }
  }, [hasClipboardPermission, syncEnabled, showToast]);

  // 修改请求剪贴板权限函数，针对iOS设备做特殊处理
  const requestClipboardPermission = useCallback(async () => {
    try {
      // 检查页面是否有焦点
      if (!document.hasFocus()) {
        showToast('请先点击页面，然后再请求权限', 'warning');
        return;
      }
      
      // 判断是否为iOS设备
      const isIOSDevice = isIOS();
      
      if (isIOSDevice) {
        // iOS设备上直接尝试读取，每次都需要用户交互
        try {
          const text = await navigator.clipboard.readText();
          
          // 如果成功读取，处理内容
          if (text && text.trim() !== '') {
            // 检查内容是否已存在
            if (text !== lastClipboardContentRef.current) {
              await saveClipboardContent(text);
            }
          }
          
          // 即使成功也不更新权限状态，每次都需要请求
          showToast('已成功读取剪贴板', 'success');
        } catch (iosError) {
          showToast('无法访问剪贴板，在iOS上需要每次手动点击获取', 'warning');
        }
      } else {
        // 非iOS设备，使用原有逻辑
        // 尝试读取剪贴板内容，这会触发权限请求
        await navigator.clipboard.readText();
        
        // 更新权限状态
        const permissionStatus = await navigator.permissions.query({
          name: 'clipboard-read' as PermissionName
        });
        
        setHasClipboardPermission(permissionStatus.state === 'granted');
        setSyncEnabled(permissionStatus.state === 'granted');
        
        if (permissionStatus.state === 'granted') {
          showToast('剪贴板权限已授予', 'success');
          // 权限授予后读取一次剪贴板
          readClipboardContent(true);
        } else {
          showToast('未能获得剪贴板权限', 'error');
        }
      }
    } catch (error) {
      setHasClipboardPermission(false);
      setSyncEnabled(false);
      showToast('无法获取剪贴板权限', 'error');
    }
  }, [readClipboardContent, showToast, saveClipboardContent, lastClipboardContentRef]);

  // 检查剪贴板权限 - 改进为直接尝试读取内容并添加iOS特殊处理
  const checkClipboardPermission = useCallback(async () => {
    try {
      // 判断是否为iOS设备
      const isIOSDevice = isIOS();
      
      if (isIOSDevice) {
        // iOS设备始终返回未授权，需要用户每次手动触发
        return false;
      }
      
      // 非iOS设备继续使用原有逻辑
      // 先尝试通过permissions API检查
      const permissionStatus = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName
      });
      
      const isGranted = permissionStatus.state === 'granted';
      
      // 如果权限未确定，尝试主动读取一次来确认
      if (permissionStatus.state === 'prompt') {
        try {
          // 尝试实际读取剪贴板内容
          await navigator.clipboard.readText();
          // 如果成功读取，说明有权限
          setHasClipboardPermission(true);
          setSyncEnabled(true);
          return true;
        } catch (readError) {
          // 读取失败，确认无权限
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          return false;
        }
      }
      
      // 设置权限状态
      setHasClipboardPermission(isGranted);
      setSyncEnabled(isGranted);
      
      // 监听权限变化
      permissionStatus.onchange = () => {
        const newIsGranted = permissionStatus.state === 'granted';
        setHasClipboardPermission(newIsGranted);
        setSyncEnabled(newIsGranted);
        
        if (newIsGranted && isInitializedRef.current) {
          // 权限变更为授予时读取一次
          readClipboardContent(true);
        }
      };
      
      return isGranted;
    } catch (error) {
      // 如果API不支持，直接尝试读取
      try {
        await navigator.clipboard.readText();
        // 读取成功说明有权限
        setHasClipboardPermission(true);
        setSyncEnabled(true);
        return true;
      } catch (readError) {
        setHasClipboardPermission(false);
        setSyncEnabled(false);
        return false;
      }
    }
  }, [readClipboardContent]);

  // 初始化加载 - 只在组件挂载时执行一次
  useEffect(() => {
    let isMounted = true;
    
    // 立即主动检查剪贴板权限，不等待初始化完成
    const immediatePermissionCheck = async () => {
      try {
        // 尝试直接读取剪贴板
        const text = await navigator.clipboard.readText();
        console.log('text', text);
        if (isMounted) {
          setHasClipboardPermission(true);
          setSyncEnabled(true);
        }
      } catch (error) {
        if (isMounted) {
          setHasClipboardPermission(false);
          setSyncEnabled(false);
        }
      }
    };
    
    // 尝试立即检查权限
    immediatePermissionCheck();
    
    // 一次性初始化函数
    const initialize = async () => {
      try {
        console.log('开始初始化应用...');
        
        // 首先检查通道状态，如果通道未验证，则不加载数据
        if (!isChannelVerified) {
          console.log('通道未验证，暂不加载数据');
          setIsLoading(false);
          return;
        }
        
        // 此处不再直接调用fetchClipboardData，而是通过另一个useEffect统一处理
        // 避免重复请求
        console.log('通道已验证，等待统一数据加载');
        
        if (!isMounted) return;
        
        // 然后检查权限
        const hasPermission = await checkClipboardPermission();
        console.log('权限检查结果:', hasPermission);
        
        if (!isMounted) return;
        
        // 确保状态已更新
        if (isMounted) {
          setSyncEnabled(hasPermission); // 明确设置同步开启状态
        }
        
        if (hasPermission && isMounted) {
          // 获取权限后等待一会儿，确保状态已更新
          setTimeout(() => {
            if (isMounted && isInitializedRef.current) {
              // 初始化时间戳
              lastEventTimeRef.current = Date.now();
              // 只在首次加载时读取一次剪贴板
              console.log('准备读取剪贴板内容...');
              readClipboardContent(true);
              // 标记首次加载完成
              isFirstLoadRef.current = false;
            }
          }, 100);
        } else {
          isFirstLoadRef.current = false;
        }
      } catch (error) {
        console.error('应用初始化失败:', error);
        if (isMounted) {
          showToast('应用初始化失败，请刷新页面', 'error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // 立即启动初始化过程
    initialize();
    
    // 当页面从隐藏变为可见时自动读取剪贴板
    const handleVisibilityChange = () => {
      // 页面变为可见时尝试读取
      if (document.visibilityState === 'visible') {
        // 检查是否短时间内重复触发
        const now = Date.now();
        if (now - lastEventTimeRef.current < 1000) {
          return; // 短时间内重复触发，跳过处理
        }
        
        // 先检查权限，无论状态如何都重新检查一次实际权限
        const recheckPermission = async () => {
          try {
            // 检查页面是否有焦点
            if (!document.hasFocus()) {
              return;
            }
            
            // 如果通道未验证，不执行剪贴板操作
            if (!isChannelVerified) {
              return;
            }
            
            // 尝试直接读取剪贴板
            const text = await navigator.clipboard.readText();
            // 权限正常，更新状态并读取内容
            if (isMounted) {
              if (!hasClipboardPermission) {
                setHasClipboardPermission(true);
                setSyncEnabled(true);
              }
              
              // 记录事件时间
              lastEventTimeRef.current = now;
              
              // 成功读取后准备处理内容
              if (text && text !== lastClipboardContentRef.current) {
                saveClipboardContent(text);
              }
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
              // 不立即更新状态，等待用户交互
            } else {
              if (isMounted) {
                setHasClipboardPermission(false);
                setSyncEnabled(false);
              }
            }
          }
        };
        
        // 延迟执行，确保页面完全可见
        setTimeout(() => {
          if (isMounted && isInitializedRef.current) {
            recheckPermission();
          }
        }, 300);
      }
    };
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 如果用户已授权，也可以考虑添加焦点事件监听
    const handleFocus = () => {
      if (isMounted && isInitializedRef.current) {
        // 如果通道未验证，不执行剪贴板操作
        if (!isChannelVerified) {
          return;
        }
        
        // 检查是否短时间内重复触发
        const now = Date.now();
        if (now - lastEventTimeRef.current < 1000) {
          return; // 短时间内重复触发，跳过处理
        }
        
        // 延迟一点执行，确保页面完全获得焦点
        setTimeout(() => {
          if (isMounted && document.hasFocus()) {
            // 记录最后事件时间
            lastEventTimeRef.current = now;
            // 只有在确认有焦点的情况下才尝试读取
            readClipboardContent(false); // 使用普通读取，不强制
          }
        }, 300);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isChannelVerified]); // 添加通道状态作为依赖项

  // 检查通道状态，如果没有通道ID或未验证，显示通道模态框，如果验证通过则加载数据
  useEffect(() => {
    if (!isChannelLoading) {
      if (!isChannelVerified) {
        setIsChannelModalOpen(true);
        // 清空现有数据，避免未登录状态下显示旧数据
        setClipboardItems([]);
        setCurrentClipboard(undefined);
        // 重置数据加载标记
        hasLoadedDataRef.current = false;
      } else {
        setIsChannelModalOpen(false);
        // 通道验证通过后，如果还没加载过数据，才加载数据
        if (!hasLoadedDataRef.current) {
          console.log('通道验证通过，开始统一加载数据');
          fetchClipboardData();
          hasLoadedDataRef.current = true;
          // 标记初始化完成
          isInitializedRef.current = true;
        }
      }
    }
  }, [isChannelLoading, isChannelVerified, fetchClipboardData]);

  // 处理关闭通道模态框
  const handleCloseChannelModal = () => {
    // 只有通道已验证才能关闭模态框
    if (isChannelVerified) {
      setIsChannelModalOpen(false);
    }
  };

  // Tab 切换时加载数据
  useEffect(() => {
    // 如果通道未验证，不加载数据
    if (!isChannelVerified) return;
    
    // 使用组件顶层定义的ref
    if (isInitialTabRenderRef.current) {
      isInitialTabRenderRef.current = false;
      // 初次渲染不执行，避免与通道验证后的数据加载冲突
      // 只有当activeTab真正变化时才加载
      return;
    }
    
    let isMounted = true;
    
    const loadTabData = async () => {
      try {
        setIsLoading(true);
        setClipboardItems([]); // 切换Tab时清空现有数据
        setCurrentPage(1);
        setTotalPages(1);
        setHasMore(false);
        
        let response;
        
        if (activeTab === 'favorite') {
          // 收藏夹 - 使用专门的API
          response = await clipboardService.getFavorites(1, pageSize);
        } else if (activeTab === 'all') {
          // 全部内容 - 不指定类型
          response = await clipboardService.getClipboardHistory(1, pageSize);
        } else {
          // 按类型筛选 - 传递类型参数
          response = await clipboardService.getClipboardHistory(
            1, 
            pageSize, 
            activeTab as ClipboardType // 将选项卡类型转换为ClipboardType
          );
        }
        
        if (!isMounted) return;
        
        if (response.success && response.data) {
          if ('items' in response.data) {
            // 新的分页格式
            const { items, page, totalPages: pages } = response.data;
            setClipboardItems(items);
            setCurrentPage(page);
            setTotalPages(pages);
            setHasMore(page < pages);
          } else if (Array.isArray(response.data)) {
            // 旧格式兼容
            setClipboardItems(response.data);
            setCurrentPage(1);
            setHasMore(false);
          }
        } else {
          showToast(response.message || '加载数据失败', 'error');
        }
      } catch (error) {
        if (isMounted) {
          showToast('加载数据失败', 'error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadTabData();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, showToast, pageSize, isChannelVerified]);

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
=======
  // 处理编辑按钮点击
  const handleEdit = (item?: ClipboardItem) => {
>>>>>>> 72a0fd19c9d0bd301f4f076547d50e1887b297b7
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

  // 添加处理手动输入的函数
  const handleManualAdd = useCallback(async (content: string) => {
    if (!content || content.trim() === '') {
      showToast('内容不能为空', 'warning');
      return;
    }
    
    await saveClipboardContent(content);
    setIsAddModalOpen(false);
  }, [saveClipboardContent, showToast]);

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
<<<<<<< HEAD
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isIOS={isIOS()}
=======
        onSaveManualInput={handleSaveManualInput}
        isIOSDevice={isIOSDevice}
>>>>>>> 72a0fd19c9d0bd301f4f076547d50e1887b297b7
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
      
      {/* 手动添加剪贴板内容模态框 */}
      <AddClipboardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleManualAdd}
      />
    </MainLayout>
  );
}
