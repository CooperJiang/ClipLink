import { useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface UseClipboardSyncProps {
  hasClipboardPermission: boolean;
  isIOSDevice: boolean;
  isChannelVerified: boolean;
  onContentRead: (content: string) => Promise<boolean>;
}

interface UseClipboardSyncReturn {
  readClipboardContent: (force?: boolean) => Promise<void>;
  isInitialized: boolean;
  lastClipboardContent: string;
  // 新增：追踪手动添加的内容
  trackManualContent: (content: string) => void;
}

export const useClipboardSync = ({
  hasClipboardPermission,
  isIOSDevice,
  isChannelVerified, 
  onContentRead
}: UseClipboardSyncProps): UseClipboardSyncReturn => {
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
  // 添加ref记录上次错误提示的时间戳，避免短时间内多次提示
  const lastErrorToastTimeRef = useRef<number>(0);
  // 添加ref记录连续错误次数
  const errorCountRef = useRef<number>(0);
  // 添加ref记录最后一次用户删除或编辑的时间戳
  const lastUserEditTimeRef = useRef<number>(0);
  // 添加ref记录页面最后一次可见状态变更的时间戳
  const lastVisibilityChangeTimeRef = useRef<number>(0);
  // 添加ref记录上次内容同步的时间戳
  const lastSyncTimeRef = useRef<number>(0);
  
  const { showToast } = useToast();
  
  // 新增：记录用户操作时间
  const recordUserEditTime = () => {
    lastUserEditTimeRef.current = Date.now();
  };
  
  // 在全局对象上添加方法，使其他组件可调用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error 全局剪贴板同步对象未在TypeScript中声明
      window.__clipboardSync = window.__clipboardSync || {};
      // @ts-expect-error 全局剪贴板同步对象未在TypeScript中声明
      window.__clipboardSync.recordUserEdit = recordUserEditTime;
      
      return () => {
        // 清理函数
        // @ts-expect-error 全局剪贴板同步对象未在TypeScript中声明
        if (window.__clipboardSync) {
          // @ts-expect-error 全局剪贴板同步对象未在TypeScript中声明
          delete window.__clipboardSync.recordUserEdit;
        }
      };
    }
  }, []);
  
  // 新增函数：追踪手动添加的内容
  const trackManualContent = useCallback((content: string) => {
    if (content && content.trim() !== '') {
      lastClipboardContentRef.current = content.trim();
      // 记录同步时间
      lastSyncTimeRef.current = Date.now();
    }
  }, []);
  
  // 判断是否应该同步内容
  const shouldSyncContent = useCallback((force = false) => {
    const now = Date.now();
    
    // 强制模式直接返回true
    if (force) return true;
    
    // 无权限则不同步
    if (!hasClipboardPermission) return false;
    
    // iOS设备不自动同步
    if (isIOSDevice) return false;
    
    // 如果用户最近有删除或编辑操作，等待更长的冷却时间
    const minTimeSinceUserEdit = 10000; // 10秒
    if (now - lastUserEditTimeRef.current < minTimeSinceUserEdit) {
      return false;
    }
    
    // 判断是否应该根据visibility变化同步
    // 如果最后一次可见性变化是最近发生的，且距离上次同步有一定时间
    const minTimeBetweenSyncs = 5000; // 5秒
    const isRecentVisibilityChange = now - lastVisibilityChangeTimeRef.current < 2000;
    const isEnoughTimeSinceLastSync = now - lastSyncTimeRef.current > minTimeBetweenSyncs;
    
    return isRecentVisibilityChange && isEnoughTimeSinceLastSync;
  }, [hasClipboardPermission, isIOSDevice]);
  
  // 读取剪贴板内容
  const readClipboardContent = useCallback(async (force = false) => {
    // 基本检查
    if (!isChannelVerified) {
      return;
    }
    
    // 检查是否应该同步
    if (!shouldSyncContent(force)) {
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
      
      // 重置错误计数
      errorCountRef.current = 0;
      
      // 内容检查
      if (!text || text.trim() === '' || text.trim() === lastClipboardContentRef.current.trim()) {
        syncLockRef.current = false;
        return;
      }
      
      // 保存新内容
      const saved = await onContentRead(text);
      if (saved) {
        lastClipboardContentRef.current = text.trim();
        // 记录同步时间
        lastSyncTimeRef.current = now;
        
        // 触发剪贴板更新事件，通知应用有新内容
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('clipboard-updated'));
        }
      }
    } catch (error) {
      // 增加错误计数
      errorCountRef.current++;
      
      // 提示阈值：首次错误、强制模式或连续多次错误
      const shouldShowToast = force || 
                             (errorCountRef.current > 3 && 
                              now - lastErrorToastTimeRef.current > 10000);
      
      // 处理权限错误
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        if (shouldShowToast) {
          lastErrorToastTimeRef.current = now;
          if (isIOSDevice) {
            showToast('请在系统弹出框中确认粘贴操作', 'warning');
          } else {
            showToast('无法访问剪贴板，请重新授权', 'error');
          }
        }
      } else if (shouldShowToast) {
        // 其他错误，只在符合条件时显示toast
        lastErrorToastTimeRef.current = now;
        showToast('读取剪贴板失败，可能是临时网络问题', 'warning');
        
        // 打印错误信息到控制台，便于调试
        console.warn('剪贴板读取错误:', error);
      }
    } finally {
      // 解除同步锁
      syncLockRef.current = false;
    }
  }, [isChannelVerified, shouldSyncContent, onContentRead, showToast, isIOSDevice]);

  // 简化的页面和窗口事件监听
  useEffect(() => {
    if (!isChannelVerified) return;
    
    // 标记初始化和挂载状态
    isInitializedRef.current = true;
    let isMounted = true;
    
    // iOS设备完全不监听自动事件
    if (isIOSDevice) {
      return;
    }
    
    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      // 记录可见性变化时间
      lastVisibilityChangeTimeRef.current = Date.now();
      
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
            if (isMounted) readClipboardContent(false); // 不强制执行
          }, 300);
        }
      }
    };
    
    // 窗口获得焦点处理
    const handleWindowFocus = () => {
      // 记录窗口聚焦事件，视为与可见性变化类似
      lastVisibilityChangeTimeRef.current = Date.now();
      
      if (hasClipboardPermission && 
          !isIOSDevice && 
          document.hasFocus()) {
        // 确保不会短时间内重复触发
        const now = Date.now();
        if (now - lastEventTimeRef.current > 3000) {
          lastEventTimeRef.current = now;
          // 延迟执行，避免与其他事件冲突
          setTimeout(() => {
            if (isMounted) readClipboardContent(false); // 不强制执行
          }, 300);
        }
      }
    };
    
    // 页面初始加载时读取一次 - 非iOS设备才执行
    if (!isIOSDevice) {
    setTimeout(() => {
        if (isMounted && hasClipboardPermission) {
          readClipboardContent(true); // 首次加载时强制执行
          // 记录初次同步时间
          lastSyncTimeRef.current = Date.now();
      }
      isFirstLoadRef.current = false;
    }, 500);
    }
    
    // 只监听两个核心事件，只对非iOS设备注册监听
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
    lastClipboardContent: lastClipboardContentRef.current,
    trackManualContent
  };
}; 