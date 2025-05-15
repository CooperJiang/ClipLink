'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CurrentClipboard from '@/components/clipboard/CurrentClipboard';
import TabBar, { ClipboardFilterType } from '@/components/clipboard/TabBar';
import ClipboardGrid from '@/components/clipboard/ClipboardGrid';
import EditModal from '@/components/clipboard/EditModal';
import { ClipboardItem, SaveClipboardRequest, ClipboardType } from '@/types/clipboard';
import { clipboardService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { isContentDuplicate } from '@/utils/clipboardHelpers';
import { useChannel } from '@/contexts/ChannelContext';
import ChannelModal from '@/components/clipboard/ChannelModal';

// 添加检测iOS设备的辅助函数
const isIOS = () => {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
};

export default function Home() {
  const [currentClipboard, setCurrentClipboard] = useState<ClipboardItem | undefined>();
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [activeTab, setActiveTab] = useState<ClipboardFilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClipboardItem | undefined>();
  const [syncEnabled, setSyncEnabled] = useState(true); // 默认开启，后续会根据权限检查结果更新
  const [isLoading, setIsLoading] = useState(true);
  const [hasClipboardPermission, setHasClipboardPermission] = useState(false);
  // 添加iOS设备状态
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12;

  // 使用ref记录上次成功读取的剪贴板内容，而不是状态
  const lastClipboardContentRef = useRef<string>('');
  // 使用ref标记初始化状态
  const isInitializedRef = useRef<boolean>(false);
  // 使用ref记录上次读取剪贴板的时间戳
  const lastReadTimeRef = useRef<number>(0);
  // 使用ref作为自动同步锁，防止并发读取和保存
  const syncLockRef = useRef<boolean>(false);
  // 使用ref记录页面是否刚打开
  const isFirstLoadRef = useRef<boolean>(true);
  // 添加ref记录上次触发事件的时间戳，用于防止短时间内重复触发
  const lastEventTimeRef = useRef<number>(0);
  // 添加ref跟踪是否已经加载过数据，避免重复请求
  const hasLoadedDataRef = useRef<boolean>(false);
  // 添加标志，阻止Tab切换第一次渲染时执行，避免与通道验证后的数据加载重复
  const isInitialTabRenderRef = useRef<boolean>(true);

  // 添加toast
  const { showToast } = useToast();

  // 添加通道状态
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const { channelId, isChannelVerified, isLoading: isChannelLoading } = useChannel();

  // 获取最新剪贴板和历史记录 - 使用useCallback提高性能
  const fetchClipboardData = useCallback(async () => {
    
    try {
      setIsLoading(true);
      const [latestRes, historyRes] = await Promise.all([
        clipboardService.getLatestClipboard(),
        clipboardService.getClipboardHistory(1, pageSize)
      ]);
      
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
        
        setClipboardItems(items);
        setCurrentPage(pageValue);
        setTotalPages(pagesValue);
        setHasMore(pageValue < pagesValue);
      }
      
      // 标记初始化完成
      isInitializedRef.current = true;
    } catch (error) {
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
        if (isIOSDevice) {
          showToast('iOS需要点击系统粘贴确认', 'warning');
        } else {
          showToast('无法访问剪贴板，请重新授权', 'error');
        }
      } else {
        if (isIOSDevice) {
          showToast('请点击iOS系统粘贴确认', 'warning');
        } else {
          showToast('读取剪贴板失败', 'error');
        }
      }
    } finally {
      // 解除同步锁
      syncLockRef.current = false;
    }
  }, [hasClipboardPermission, syncEnabled, showToast, isIOSDevice, saveClipboardContent]);

  // 请求剪贴板权限 - 修改为同时处理iOS设备
  const requestClipboardPermission = useCallback(async () => {
    try {
      // 检查页面是否有焦点
      if (!document.hasFocus()) {
        showToast('请先点击页面，然后再请求权限', 'warning');
        return;
      }
      
      // iOS设备特殊处理
      if (isIOSDevice) {
        try {
          // 直接尝试读取，这会触发iOS的粘贴确认UI
          const text = await navigator.clipboard.readText();
          
          // 如果成功，说明用户确认了粘贴
          setHasClipboardPermission(true);
          setSyncEnabled(true);
          showToast('已获得剪贴板访问', 'success');
          
          // 如果有内容且与上次不同，则保存
          if (text && text !== lastClipboardContentRef.current) {
            saveClipboardContent(text);
          }
        } catch (error) {
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          showToast('未能获得剪贴板访问，请点击系统粘贴确认', 'warning');
        }
        return;
      }
      
      // 非iOS设备的原有逻辑
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
    } catch (error) {
      setHasClipboardPermission(false);
      setSyncEnabled(false);
      showToast('无法获取剪贴板权限', 'error');
    }
  }, [readClipboardContent, showToast, isIOSDevice, saveClipboardContent]);

  // 检查剪贴板权限 - 改进为适应iOS设备
  const checkClipboardPermission = useCallback(async () => {
    // iOS设备特殊处理
    if (isIOSDevice) {
      // iOS上不使用permissions API，默认设置为false等待用户主动触发
      setHasClipboardPermission(false);
      setSyncEnabled(false);
      return false;
    }
    
    try {
      // 非iOS设备使用原有逻辑
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
  }, [readClipboardContent, isIOSDevice]);

  // 初始化加载 - 只在组件挂载时执行一次
  useEffect(() => {
    let isMounted = true;
    
    // 检测是否为iOS设备
    if (isMounted) {
      setIsIOSDevice(isIOS());
    }
    
    // 立即主动检查剪贴板权限，不等待初始化完成
    const immediatePermissionCheck = async () => {
      try {
        // iOS设备特殊处理：不主动尝试读取
        if (isIOS()) {
          if (isMounted) {
            setHasClipboardPermission(false);
            setSyncEnabled(false);
          }
          return;
        }
        
        // 非iOS设备的原有逻辑
        // 尝试直接读取剪贴板
        const text = await navigator.clipboard.readText();
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
        // 首先检查通道状态，如果通道未验证，则不加载数据
        if (!isChannelVerified) {
          setIsLoading(false);
          return;
        }
        
        // 此处不再直接调用fetchClipboardData，而是通过另一个useEffect统一处理
        
        if (!isMounted) return;
        
        // 然后检查权限 - iOS设备跳过自动权限检查
        const hasPermission = !isIOSDevice ? await checkClipboardPermission() : false;
        
        if (!isMounted) return;
        
        // 确保状态已更新
        if (isMounted) {
          setSyncEnabled(hasPermission); // 明确设置同步开启状态
        }
        
        if (hasPermission && isMounted && !isIOSDevice) {
          // 获取权限后等待一会儿，确保状态已更新
          setTimeout(() => {
            if (isMounted && isInitializedRef.current) {
              // 初始化时间戳
              lastEventTimeRef.current = Date.now();
              readClipboardContent(true);
              // 标记首次加载完成
              isFirstLoadRef.current = false;
            }
          }, 100);
        } else {
          isFirstLoadRef.current = false;
        }
      } catch (error) {
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
        
        // iOS设备不自动读取剪贴板
        if (isIOSDevice) return;
        
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
        
        // iOS设备不自动读取剪贴板
        if (isIOSDevice) return;
        
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
  }, [isChannelVerified, checkClipboardPermission, readClipboardContent, showToast, saveClipboardContent]); // 添加通道状态作为依赖项

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
    setEditingItem(item);
    setIsModalOpen(true);
  }, []);

  // 处理删除操作
  const handleDelete = useCallback(async (item: ClipboardItem) => {
  
    
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
  }, [currentClipboard, showToast]);

  // 切换收藏状态
  const handleToggleFavorite = useCallback(async (item: ClipboardItem) => {
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
  }, [currentClipboard, showToast]);

  // 处理保存编辑操作
  const handleSave = useCallback(async (data: SaveClipboardRequest): Promise<void> => {
    if (!editingItem) return;
    
    try {
      const response = await clipboardService.updateClipboard(editingItem.id, data);
      
      if (response.success && response.data) {
        // 更新列表
        setClipboardItems(prevItems => 
          prevItems.map(item => item.id === editingItem.id ? response.data! : item)
        );
        
        // 如果更新的是当前剪贴板项目，同步更新
        if (currentClipboard && currentClipboard.id === editingItem.id) {
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
  }, [currentClipboard, editingItem, showToast]);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    await fetchClipboardData(); // 强制刷新
    showToast('数据已刷新', 'success');
  }, [fetchClipboardData, showToast]);

  // 处理手动输入的内容保存
  const handleSaveManualInput = useCallback(async (content: string) => {
    if (!content.trim()) {
      showToast('内容不能为空', 'error');
      return false;
    }
    
    try {
      // 使用现有的保存函数处理内容
      return await saveClipboardContent(content);
    } catch (error) {
      showToast('保存失败', 'error');
      return false;
    }
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
        onSaveManualInput={handleSaveManualInput}
        isIOSDevice={isIOSDevice} // 传递iOS设备状态
      />
      
      <TabBar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
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

      {/* 通道模态框 */}
      <ChannelModal 
        isOpen={isChannelModalOpen} 
        onClose={handleCloseChannelModal} 
        forceOpen={!isChannelVerified}
      />
    </MainLayout>
  );
}
