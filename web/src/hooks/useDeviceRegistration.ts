'use client';

import { useState, useEffect } from 'react';
import { useChannel } from '@/contexts/ChannelContext';
import { clipboardService } from '@/services/api';
import { v4 as uuidv4 } from 'uuid';

// 本地存储的设备ID键名
const DEVICE_ID_KEY = 'clipboard_device_id';
// 本地存储的设备名称键名
const DEVICE_NAME_KEY = 'clipboard_device_name';

// 检测设备类型
function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return 'desktop'; // SSR默认返回desktop
  }
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent) || 
    (isMobile && Math.min(window.screen.width, window.screen.height) > 540);
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

// 获取或生成设备名称
function getOrGenerateDeviceName(): string {
  // 尝试从本地存储获取设备名称
  const storedName = typeof window !== 'undefined' ? localStorage.getItem(DEVICE_NAME_KEY) : null;
  if (storedName) return storedName;
  
  // 生成默认设备名称
  const deviceType = detectDeviceType();
  const defaultName = `${deviceType === 'desktop' ? '电脑' : deviceType === 'tablet' ? '平板' : '手机'}-${Math.random().toString(36).substring(2, 6)}`;
  
  // 存储生成的名称
  if (typeof window !== 'undefined') localStorage.setItem(DEVICE_NAME_KEY, defaultName);
  return defaultName;
}

// 获取或生成设备ID
function getOrGenerateDeviceId(): string {
  // 尝试从本地存储获取设备ID
  const storedId = typeof window !== 'undefined' ? localStorage.getItem(DEVICE_ID_KEY) : null;
  if (storedId) return storedId;
  
  // 生成新的设备ID
  const newId = uuidv4();
  if (typeof window !== 'undefined') localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

export function useDeviceRegistration() {
  const { channelId, isChannelVerified } = useChannel();
  const [deviceId] = useState(getOrGenerateDeviceId);
  const [deviceName] = useState(getOrGenerateDeviceName);
  const [deviceType] = useState(detectDeviceType);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 当通道连接时，注册设备
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;
    
    // 如果达到最大重试次数，停止尝试
    if (retryCount >= 5) return;

    // 如果已经注册或正在注册，或没有有效的通道，则不继续
    if (isRegistered || isRegistering || !channelId || !isChannelVerified) return;

    // 立即注册设备，不再延迟
    const registerDevice = async () => {
      setIsRegistering(true);
      setError(null);
      
      try {
        // 使用clipboardService注册设备
        const response = await clipboardService.registerDevice({
          device_id: deviceId,
          device_name: deviceName,
          device_type: deviceType
        });
        
        if (response.success) {
          setIsRegistered(true);
        } else {
          throw new Error(response.message || '设备注册失败');
        }
      } catch (err) {
        console.error('设备注册错误:', err);
        setError(err instanceof Error ? err.message : '设备注册失败');
        setRetryCount(count => count + 1);
      } finally {
        setIsRegistering(false);
      }
    };

    // 立即执行设备注册
    registerDevice();
  }, [channelId, isChannelVerified, deviceId, deviceName, deviceType, isRegistered, isRegistering, retryCount]);

  // 定期发送心跳更新设备状态
  useEffect(() => {
    if (!channelId || !isChannelVerified || !isRegistered) return;

    // 发送心跳更新
    const sendHeartbeat = async () => {
      try {
        // 使用clipboardService发送心跳
        const response = await clipboardService.updateDeviceStatus(deviceId, true);
        if (!response.success) {
          console.warn('心跳发送返回非成功状态:', response.message);
        }
      } catch (err) {
        console.error('发送心跳错误:', err);
      }
    };

    // 立即发送第一次心跳
    sendHeartbeat();

    // 设置定期发送心跳的间隔 - 每5分钟一次
    const heartbeatInterval = setInterval(sendHeartbeat, 300000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [channelId, isChannelVerified, deviceId, isRegistered]);

  // 在组件卸载或页面关闭时更新设备为离线状态
  useEffect(() => {
    if (!channelId || !isChannelVerified || !isRegistered) return;

    const updateOfflineStatus = async () => {
      try {
        // 使用clipboardService更新离线状态
        await clipboardService.updateDeviceStatus(deviceId, false);
      } catch (err) {
        console.error('更新设备离线状态错误:', err);
      }
    };

    // 在页面卸载时更新设备状态为离线
    const handleBeforeUnload = () => {
      updateOfflineStatus();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOfflineStatus();
    };
  }, [channelId, isChannelVerified, deviceId, isRegistered]);

  return {
    deviceId,
    deviceName,
    deviceType,
    isRegistered,
    isRegistering,
    error
  };
} 