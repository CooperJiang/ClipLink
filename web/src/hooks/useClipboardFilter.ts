import { useState, useRef, useEffect, useCallback } from 'react';
import { ClipboardItem, ClipboardType, SaveClipboardRequest } from '@/types/clipboard';

interface ClipboardFilterOptions {
  hasClipboardPermission: boolean;
  isIOSDevice: boolean;
  isChannelVerified: boolean;
  onSaveContent: (content: string) => Promise<boolean>;
  debug?: boolean;
}

interface UseClipboardFilterReturn {
  syncClipboard: (force?: boolean) => Promise<void>;
  handleDeletedContent: (content: string) => void;
  handleFilteredContent: (content: string) => Promise<boolean>;
  trackProcessedContent: (content: string) => void;
  processedContents: Set<string>;
  deletedContents: Set<string>;
  resetFilter: () => void;
}

// 工具函数：去除内容首尾空格
function trimContent(content: string): string {
  return content.trim();
}

// 工具函数：内容是否为空
function isEmptyContent(content: string): boolean {
  return !content || content.trim() === '';
}

export function useClipboardFilter({
  hasClipboardPermission,
  isIOSDevice,
  isChannelVerified,
  onSaveContent,
  debug = false
}: ClipboardFilterOptions): UseClipboardFilterReturn {
  // 状态管理
  const [processedContents, setProcessedContents] = useState<Set<string>>(new Set());
  const [deletedContents, setDeletedContents] = useState<Set<string>>(new Set());
  const lastSyncTimeRef = useRef<number>(0);
  const hasVisibilityChangedRef = useRef<boolean>(false);

  // 追踪已处理内容
  const trackProcessedContent = useCallback((content: string) => {
    if (isEmptyContent(content)) return;
    const trimmedContent = trimContent(content);
    setProcessedContents(prev => {
      const newSet = new Set(prev);
      newSet.add(trimmedContent);
      return newSet;
    });
  }, []);

  // 处理被删除内容
  const handleDeletedContent = useCallback((content: string) => {
    if (isEmptyContent(content)) return;
    const trimmedContent = trimContent(content);
    setDeletedContents(prev => {
      const newSet = new Set(prev);
      newSet.add(trimmedContent);
      return newSet;
    });
    setProcessedContents(prev => {
      const newSet = new Set(prev);
      newSet.delete(trimmedContent);
      return newSet;
    });
    if (debug) {
      console.log('[ClipboardFilter] 内容已添加到屏蔽列表:', trimmedContent);
    }
  }, [debug]);

  // 判断内容是否需要同步
  const shouldSyncContent = useCallback((content: string): boolean => {
    if (isEmptyContent(content)) return false;
    const trimmedContent = trimContent(content);
    if (deletedContents.has(trimmedContent)) {
      if (debug) {
        console.log('[ClipboardFilter] 内容在屏蔽列表中，跳过同步:', trimmedContent);
      }
      return false;
    }
    if (processedContents.has(trimmedContent)) {
      if (debug) {
        console.log('[ClipboardFilter] 内容已存在，跳过同步:', trimmedContent);
      }
      return false;
    }
    return true;
  }, [deletedContents, processedContents, debug]);

  // 处理过滤后的内容
  const handleFilteredContent = useCallback(async (content: string): Promise<boolean> => {
    if (isEmptyContent(content)) return false;
    if (!shouldSyncContent(content)) return false;
    
    // 添加与上次保存的最小时间间隔检查
    const now = Date.now();
    const minTimeBetweenSaves = 500; // 最小间隔为500毫秒
    if (now - lastSyncTimeRef.current < minTimeBetweenSaves) {
      if (debug) {
        console.log('[ClipboardFilter] 距离上次同步时间太短，跳过:', trimContent(content));
      }
      return false;
    }
    
    const result = await onSaveContent(content);
    if (result) {
      trackProcessedContent(content);
      lastSyncTimeRef.current = now;
      
      // 触发剪贴板更新事件，通知应用有新内容
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('clipboard-updated'));
      }
      
      if (debug) {
        console.log('[ClipboardFilter] 新内容已同步:', trimContent(content));
      }
    }
    return result;
  }, [shouldSyncContent, onSaveContent, trackProcessedContent, debug]);

  // 同步剪贴板内容
  const syncClipboard = useCallback(async (force = false) => {
    if (!isChannelVerified) return;
    if (!hasClipboardPermission || isIOSDevice) return;
    if (!force) {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTimeRef.current;
      if (hasVisibilityChangedRef.current && timeSinceLastSync < 3000) {
        return;
      }
      hasVisibilityChangedRef.current = false;
    }
    try {
      const text = await navigator.clipboard.readText();
      await handleFilteredContent(text);
    } catch (error) {
      if (debug) {
        console.warn('[ClipboardFilter] 同步错误:', error);
      }
    }
  }, [hasClipboardPermission, isIOSDevice, isChannelVerified, handleFilteredContent, debug]);

  // 标记可见性变化
  const setVisibilityChanged = useCallback(() => {
    hasVisibilityChangedRef.current = true;
  }, []);

  // 监听可见性和焦点变化
  useEffect(() => {
    if (!isChannelVerified) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setVisibilityChanged();
        syncClipboard(false);
      }
    };
    const handleWindowFocus = () => {
      setVisibilityChanged();
      syncClipboard(false);
    };
    if (hasClipboardPermission && !isIOSDevice) {
      syncClipboard(true);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [hasClipboardPermission, isIOSDevice, isChannelVerified, syncClipboard, setVisibilityChanged]);

  // 重置过滤器
  const resetFilter = useCallback(() => {
    setProcessedContents(new Set());
    setDeletedContents(new Set());
    lastSyncTimeRef.current = 0;
    hasVisibilityChangedRef.current = false;
    if (debug) {
      console.log('[ClipboardFilter] 过滤器已重置');
    }
  }, [debug]);

  // 返回 API
  return {
    syncClipboard,
    handleDeletedContent,
    handleFilteredContent,
    trackProcessedContent,
    processedContents,
    deletedContents,
    resetFilter
  };
}