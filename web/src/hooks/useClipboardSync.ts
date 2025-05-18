import { useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface UseClipboardSyncProps {
  hasClipboardPermission: boolean;
  isIOSDevice: boolean;
  isChannelVerified: boolean;
  onContentRead: (content: string) => Promise<boolean>;
}

export const useClipboardSync = ({
  hasClipboardPermission,
  isIOSDevice,
  isChannelVerified, 
  onContentRead
}: UseClipboardSyncProps) => {
  // 使用ref记录上次成功读取的剪贴板内容
  const lastClipboardContentRef = useRef<string>('');
  // 使用ref标记初始化状态
  const isInitializedRef = useRef<boolean>(false);
  // 使用ref作为自动同步锁，防止并发读取和保存
  const syncLockRef = useRef<boolean>(false);
  // 使用ref记录页面是否刚打开
  const isFirstLoadRef = useRef<boolean>(true);
  // 添加ref记录上次触发事件的时间戳，用于防止短时间内重复触发
  const lastEventTimeRef = useRef<number>(0);
  
  const { showToast } = useToast();
  
  // 读取剪贴板内容
  const readClipboardContent = useCallback(async (force = false) => {
    // 基本检查
    if (!isChannelVerified || (isIOSDevice && !force)) {
      return;
    }
    
    // 防抖 - 2秒内不重复触发
    const now = Date.now();
    const timeSinceLastRead = now - lastEventTimeRef.current;
    if (timeSinceLastRead < 2000 && !force) {
      return;
    }
    
    // 更新最后事件时间
    lastEventTimeRef.current = now;
    
    // 同步锁检查
    if (syncLockRef.current) {
      return;
    }
    
    // 设置同步锁
    syncLockRef.current = true;
    
    try {
      // 读取剪贴板
      const text = await navigator.clipboard.readText();
      
      // 内容检查
      if (!text || text.trim() === '' || text === lastClipboardContentRef.current) {
        return;
      }
      
      // 保存新内容
      const saved = await onContentRead(text);
      if (saved) {
        lastClipboardContentRef.current = text;
      }
    } catch (error) {
      // 处理权限错误
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        if (force || isFirstLoadRef.current) {
          if (isIOSDevice) {
            showToast('iOS需要点击系统粘贴确认', 'warning');
          } else {
            showToast('无法访问剪贴板，请重新授权', 'error');
          }
        }
      } else if (force) {
        // 其他错误，只在强制模式下显示toast
        showToast('读取剪贴板失败', 'error');
      }
    } finally {
      // 解除同步锁
      syncLockRef.current = false;
    }
  }, [isChannelVerified, isIOSDevice, onContentRead, showToast]);

  // 简化的页面和窗口事件监听
  useEffect(() => {
    if (!isChannelVerified) return;
    
    // 标记初始化和挂载状态
    isInitializedRef.current = true;
    let isMounted = true;
    
    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 
          hasClipboardPermission && 
          !isIOSDevice && 
          document.hasFocus()) {
        // 确保不会短时间内重复触发
        const now = Date.now();
        if (now - lastEventTimeRef.current > 3000) {
          lastEventTimeRef.current = now;
          // 延迟执行，避免与其他事件冲突
          setTimeout(() => {
            if (isMounted) readClipboardContent(true);
          }, 300);
        }
      }
    };
    
    // 窗口获得焦点处理
    const handleWindowFocus = () => {
      if (hasClipboardPermission && 
          !isIOSDevice && 
          document.hasFocus()) {
        // 确保不会短时间内重复触发
        const now = Date.now();
        if (now - lastEventTimeRef.current > 3000) {
          lastEventTimeRef.current = now;
          // 延迟执行，避免与其他事件冲突
          setTimeout(() => {
            if (isMounted) readClipboardContent(true);
          }, 300);
        }
      }
    };
    
    // 页面初始加载时读取一次
    setTimeout(() => {
      if (isMounted && hasClipboardPermission && !isIOSDevice) {
        readClipboardContent(true);
      }
      isFirstLoadRef.current = false;
    }, 500);
    
    // 只监听两个核心事件
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    // 清理函数
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isChannelVerified, hasClipboardPermission, isIOSDevice, readClipboardContent]);
  
  return {
    readClipboardContent,
    isInitialized: isInitializedRef.current,
    lastClipboardContent: lastClipboardContentRef.current
  };
}; 