'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudArrowUp, 
  faCloudArrowDown, 
  faDesktop, 
  faMobile, 
  faTablet,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '@/components/layout/MainLayout';

export default function SyncPage() {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5);
  const [devices, setDevices] = useState([
    { id: 1, name: '当前电脑', type: 'desktop', isOnline: true, lastSync: new Date().toISOString() },
    { id: 2, name: 'iPhone 13', type: 'mobile', isOnline: true, lastSync: new Date().toISOString() },
    { id: 3, name: 'iPad Pro', type: 'tablet', isOnline: false, lastSync: '2023-05-13T10:15:30Z' }
  ]);

  const toggleSync = () => {
    setSyncEnabled(!syncEnabled);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return faDesktop;
      case 'mobile':
        return faMobile;
      case 'tablet':
        return faTablet;
      default:
        return faDesktop;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
  };

  return (
    <MainLayout>
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-lg font-medium">设备同步</h1>
        <p className="text-sm text-gray-500">管理剪贴板在不同设备上的同步状态</p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium mb-2">自动同步</h2>
              <p className="text-sm text-gray-600">启用后，您的剪贴板内容将在所有设备上自动同步</p>
            </div>
            <div className="flex items-center">
              <button 
                onClick={toggleSync}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  syncEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    syncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm font-medium">
                {syncEnabled ? '已开启' : '已关闭'}
              </span>
            </div>
          </div>
          
          {syncEnabled && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label htmlFor="sync-interval" className="text-sm text-gray-700">
                  同步间隔（分钟）:
                </label>
                <input
                  id="sync-interval"
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                  className="w-full md:w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium">{syncInterval} 分钟</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-lg font-medium mb-4">已连接设备</h2>
          
          <div className="grid gap-4">
            {devices.map(device => (
              <div 
                key={device.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    device.isOnline ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <FontAwesomeIcon icon={getDeviceIcon(device.type)} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">{device.name}</h3>
                    <div className="flex items-center text-xs mt-1">
                      <span className={`flex items-center ${device.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        <FontAwesomeIcon icon={device.isOnline ? faCheck : faTimes} className="mr-1" />
                        {device.isOnline ? '在线' : '离线'}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-500">
                        最后同步: {formatDate(device.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {device.isOnline && (
                    <button className="btn-secondary text-xs">
                      <FontAwesomeIcon icon={faCloudArrowDown} className="mr-1.5" />
                      同步
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button className="btn-primary">
              <FontAwesomeIcon icon={faCloudArrowUp} className="mr-1.5" />
              立即同步所有设备
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 