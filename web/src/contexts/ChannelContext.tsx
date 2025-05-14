'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clipboardService } from '@/services/api';

interface ChannelContextType {
  channelId: string | null;
  isChannelVerified: boolean;
  isLoading: boolean;
  error: string | null;
  createChannel: (customId?: string) => Promise<boolean>;
  verifyChannel: (channelId: string) => Promise<boolean>;
  setChannel: (channelId: string) => void;
  clearChannel: () => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

const CHANNEL_ID_KEY = 'clipboard_channel_id';

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isChannelVerified, setIsChannelVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从URL获取通道ID并验证
  useEffect(() => {
    const getChannelFromUrl = async () => {
      // 只在客户端运行
      if (typeof window === 'undefined') return;

      // 从URL获取channel参数
      const url = new URL(window.location.href);
      const channelParam = url.searchParams.get('channel');

      // 如果URL中有channel参数
      if (channelParam) {
        try {
          console.log('从URL中获取到通道ID:', channelParam);
          
          // 无论验证成功与否，都移除URL中的channel参数
          url.searchParams.delete('channel');
          window.history.replaceState({}, '', url.toString());
          
          const isValid = await verifyChannel(channelParam);
          
          if (isValid) {
            console.log('通道ID验证成功');
            // 验证成功，不需要做其他操作，因为verifyChannel函数已经处理了状态设置
            setIsLoading(false);
            return;
          } else {
            console.log('通道ID验证失败');
            // 验证失败，设置错误信息
            setError('链接中的通道ID无效，请输入正确的通道ID或创建新通道');
            // 继续检查本地存储
          }
        } catch (err) {
          console.error('验证URL中的通道ID失败:', err);
          setError('验证链接中的通道ID时出错，请手动输入通道ID');
          // 错误处理，继续检查本地存储
        }
      }
      
      // 如果URL中没有channel参数或验证失败，从本地存储加载通道ID
      const storedChannelId = localStorage.getItem(CHANNEL_ID_KEY);
      if (storedChannelId) {
        setChannelId(storedChannelId);
        verifyChannel(storedChannelId)
          .then(isValid => {
            if (!isValid) {
              // 如果验证失败，清除本地存储的通道ID
              clearChannel();
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    };

    getChannelFromUrl();
  }, []);

  // 创建新通道
  const createChannel = async (customId?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clipboardService.createChannel(customId);
      if (response.success && response.data) {
        const newChannelId = response.data.id;
        localStorage.setItem(CHANNEL_ID_KEY, newChannelId);
        setChannelId(newChannelId);
        setIsChannelVerified(true);
        return true;
      } else {
        setError(response.message || '创建通道失败');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建通道失败';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 验证通道
  const verifyChannel = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clipboardService.verifyChannel(id);
      const isValid = response.success;
      setIsChannelVerified(isValid);
      if (isValid) {
        localStorage.setItem(CHANNEL_ID_KEY, id);
        setChannelId(id);
      }
      return isValid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '验证通道失败';
      setError(errorMessage);
      setIsChannelVerified(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 手动设置通道ID (不进行验证，用于已知有效的通道ID)
  const setChannel = (id: string) => {
    localStorage.setItem(CHANNEL_ID_KEY, id);
    setChannelId(id);
    setIsChannelVerified(true);
  };

  // 清除通道ID
  const clearChannel = () => {
    localStorage.removeItem(CHANNEL_ID_KEY);
    setChannelId(null);
    setIsChannelVerified(false);
  };

  const value = {
    channelId,
    isChannelVerified,
    isLoading,
    error,
    createChannel,
    verifyChannel,
    setChannel,
    clearChannel
  };

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannel() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
} 