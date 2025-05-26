'use client';

import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';

// 这是一个隐形组件，不渲染任何UI，仅用于注册设备
export default function DeviceRegistration() {
  // 使用设备注册hook
  useDeviceRegistration();
  
  // 不渲染任何内容
  return null;
} 