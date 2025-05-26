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
      <div className="bg-white dark:bg-dark-surface-primary/95 backdrop-blur-md border-b border-neutral-200 dark:border-dark-border-primary p-4 shadow-sm dark:shadow-dark-sm">
        <h1 className="text-lg font-medium text-neutral-900 dark:text-dark-text-primary">设备同步</h1>
        <p className="text-sm text-neutral-500 dark:text-dark-text-tertiary">管理剪贴板在不同设备上的同步状态</p>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gradient-dark">
        <div className="bg-white dark:bg-dark-surface-primary rounded-lg shadow-soft dark:shadow-dark-card border border-neutral-200 dark:border-dark-border-primary p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium mb-2 text-neutral-900 dark:text-dark-text-primary">自动同步</h2>
              <p className="text-sm text-neutral-600 dark:text-dark-text-tertiary">启用后，您的剪贴板内容将在所有设备上自动同步</p>
            </div>
            <div className="flex items-center">
              <button 
                onClick={toggleSync}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-dark-surface-primary ${
                  syncEnabled ? 'bg-brand-600 dark:bg-brand-dark-500 shadow-glow-brand' : 'bg-neutral-200 dark:bg-dark-surface-tertiary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    syncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm font-medium text-neutral-900 dark:text-dark-text-primary">
                {syncEnabled ? '已开启' : '已关闭'}
              </span>
            </div>
          </div>
          
          {syncEnabled && (
            <div className="mt-4 border-t border-neutral-100 dark:border-dark-border-primary pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label htmlFor="sync-interval" className="text-sm text-neutral-700 dark:text-dark-text-secondary">
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
                  className="w-full md:w-48 h-2 bg-neutral-200 dark:bg-dark-surface-tertiary rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-neutral-900 dark:text-dark-text-primary">{syncInterval} 分钟</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-dark-surface-primary rounded-lg shadow-soft dark:shadow-dark-card border border-neutral-200 dark:border-dark-border-primary p-6">
          <h2 className="text-lg font-medium mb-4 text-neutral-900 dark:text-dark-text-primary">已连接设备</h2>
          
          <div className="grid gap-4">
            {devices.map(device => (
              <div 
                key={device.id}
                className="border border-neutral-200 dark:border-dark-border-secondary rounded-lg p-4 flex items-center justify-between bg-white dark:bg-dark-surface-secondary hover:bg-neutral-50 dark:hover:bg-dark-surface-hover transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    device.isOnline 
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-dark-400' 
                      : 'bg-neutral-100 dark:bg-dark-surface-tertiary text-neutral-400 dark:text-dark-text-muted'
                  }`}>
                    <FontAwesomeIcon icon={getDeviceIcon(device.type)} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-neutral-900 dark:text-dark-text-primary">{device.name}</h3>
                    <div className="flex items-center text-xs mt-1">
                      <span className={`flex items-center ${
                        device.isOnline 
                          ? 'text-success-600 dark:text-success-400' 
                          : 'text-neutral-400 dark:text-dark-text-muted'
                      }`}>
                        <FontAwesomeIcon icon={device.isOnline ? faCheck : faTimes} className="mr-1" />
                        {device.isOnline ? '在线' : '离线'}
                      </span>
                      <span className="mx-2 text-neutral-300 dark:text-dark-border-accent">|</span>
                      <span className="text-neutral-500 dark:text-dark-text-tertiary">
                        最后同步: {formatDate(device.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {device.isOnline && (
                    <button className="inline-flex items-center px-3 py-1.5 bg-neutral-100 dark:bg-dark-surface-tertiary text-neutral-700 dark:text-dark-text-secondary text-xs font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-dark-surface-hover focus:outline-none transition-all duration-200 border border-neutral-200 dark:border-dark-border-secondary">
                      <FontAwesomeIcon icon={faCloudArrowDown} className="mr-1.5" />
                      同步
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-dark-500 dark:hover:bg-brand-dark-400 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-glow-brand">
              <FontAwesomeIcon icon={faCloudArrowUp} className="mr-1.5" />
              立即同步所有设备
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 