'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faCopy, 
  faQrcode, 
  faTimes,
  faKey,
  faShareNodes,
  faCheck,
  faInfoCircle,
  faChartLine,
  faClockRotateLeft,
  faDesktop,
  faMobile,
  faTablet,
  faSignOutAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/contexts/ToastContext';
import AnimatedModal from '../ui/AnimatedModal';
import Image from 'next/image';
import { clipboardService } from '@/services/api';
import { useChannel } from '@/contexts/ChannelContext';
import { useRouter } from 'next/navigation';
import { checkApiConnections } from '@/utils/apiChecker';

interface ChannelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

interface ChannelStats {
  total_devices: number;
  online_devices: number;
  sync_count: number;
  clipboard_item_count: number;
  created_at: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  last_seen: string;
  is_online: boolean;
  channel_id: string;
  created_at: string;
}

interface SyncRecord {
  id: number;
  action: string;
  content: string;
  device_id: string;
  channel_id: string;
  created_at: string;
}

export default function ChannelDetailModal({ isOpen, onClose, channelId }: ChannelDetailModalProps) {
  const [showChannelId, setShowChannelId] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareURLCopied, setShareURLCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'devices' | 'history'>('info');
  const [qrVisible, setQrVisible] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [confirmExitVisible, setConfirmExitVisible] = useState(false);
  const { showToast } = useToast();
  const { clearChannel, isChannelVerified, verifyChannel, createChannel } = useChannel();
  const router = useRouter();
  
  // 添加状态用于连接通道
  const [inputChannelId, setInputChannelId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // 实际数据状态
  const [isLoading, setIsLoading] = useState(true);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [isApiTesting, setIsApiTesting] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<any>(null);

  // 添加API调试功能
  const runApiTests = async () => {
    if (!channelId) return;
    
    setIsApiTesting(true);
    try {
      // 检查各种API路径
      const results = await checkApiConnections(channelId);
      setApiTestResults(results);
    } catch (err) {
      console.error('API测试失败:', err);
    } finally {
      setIsApiTesting(false);
    }
  };

  // 获取通道统计数据
  const fetchChannelStats = async () => {
    if (!channelId || !isChannelVerified) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await clipboardService.getChannelStats();
      if (response.success) {
        setChannelStats(response.data);
      } else {
        showToast(response.message || '获取通道统计数据失败', 'error');
      }
    } catch (error) {
      console.error('获取通道统计数据失败:', error);
      showToast('获取通道统计数据失败', 'error');
    }
  };

  // 获取已连接设备
  const fetchConnectedDevices = async () => {
    if (!channelId || !isChannelVerified) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await clipboardService.getDevices();
      if (response.success) {
        setConnectedDevices(response.data || []);
      } else {
        showToast(response.message || '获取已连接设备失败', 'error');
      }
    } catch (error) {
      console.error('获取已连接设备失败:', error);
      showToast('获取已连接设备失败', 'error');
    }
  };

  // 获取同步历史
  const fetchSyncHistory = async () => {
    if (!channelId || !isChannelVerified) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response: any = await clipboardService.getSyncHistory(10);
      if (response.success) {
        setSyncHistory(response.data.records || []);
      } else {
        showToast(response.message || '获取同步历史失败', 'error');
      }
    } catch (error) {
      console.error('获取同步历史失败:', error);
      showToast('获取同步历史失败', 'error');
    }
  };

  // 当打开模态框时加载数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      if (!channelId || !isChannelVerified) {
        // 如果没有通道或通道未验证，不加载数据，直接结束loading状态
        setIsLoading(false);
        return;
      }
      
      Promise.all([fetchChannelStats(), fetchConnectedDevices(), fetchSyncHistory()])
        .catch(error => {
          console.error('加载通道数据失败:', error);
          showToast('加载通道数据失败，请稍后重试', 'error');
        })
        .finally(() => {
          setIsLoading(false);
        });
      generateQRCode();
    }
  }, [isOpen, channelId, isChannelVerified]);
  
  // 退出通道
  const handleExitChannel = () => {
    setConfirmExitVisible(true);
  };

  // 确认退出通道
  const confirmExitChannel = () => {
    if (clearChannel) {
      clearChannel();
      showToast('已成功退出通道', 'success');
      setConfirmExitVisible(false); // 关闭确认对话框
      onClose(); // 关闭主模态框
    }
  };
  
  // 生成QR码
  const generateQRCode = () => {
    if (!channelId) return;
    
    const shareURL = `${window.location.origin}${window.location.pathname}?channel=${encodeURIComponent(channelId)}`;
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareURL)}&bgcolor=FFFFFF&color=384ADC`;
    setQrCodeImage(qrCodeURL);
  };
  
  // 复制通道ID到剪贴板
  const copyChannelId = () => {
    if (!channelId) return;
    
    navigator.clipboard.writeText(channelId).then(() => {
      setCopied(true);
      showToast('通道ID已复制到剪贴板', 'success');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };
  
  // 复制分享链接
  const copyShareURL = () => {
    if (!channelId) return;
    
    // 创建一个包含channelId参数的URL
    const shareURL = `${window.location.origin}${window.location.pathname}?channel=${encodeURIComponent(channelId)}`;
    
    navigator.clipboard.writeText(shareURL).then(() => {
      setShareURLCopied(true);
      showToast('分享链接已复制，可直接发送给其他设备使用', 'success');
      
      setTimeout(() => {
        setShareURLCopied(false);
      }, 2000);
    });
  };
  
  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else {
      return `${diffDays} 天前`;
    }
  };
  
  // 获取设备图标
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

  // 获取设备名称（如果设备ID与实际设备匹配）
  const getDeviceName = (deviceId: string) => {
    const device = connectedDevices.find(d => d.id === deviceId);
    return device ? device.name : deviceId;
  };
  
  // 遮罩通道ID
  const maskedChannelId = channelId ? '•'.repeat(Math.min(channelId.length, 20)) : '';

  // 处理连接通道
  const handleConnectChannel = async () => {
    if (!inputChannelId.trim()) {
      setConnectionError('请输入通道ID');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const success = await verifyChannel(inputChannelId.trim());
      if (success) {
        showToast('通道连接成功', 'success');
        // 连接成功后重置输入
        setInputChannelId('');
      } else {
        setConnectionError('无效的通道ID，请检查后重试');
      }
    } catch (error) {
      console.error('通道连接失败:', error);
      setConnectionError('连接失败，请稍后重试');
    } finally {
      setIsConnecting(false);
    }
  };

  // 创建新通道
  const [isCreating, setIsCreating] = useState(false);
  const handleCreateChannel = async () => {
    setIsCreating(true);
    setConnectionError(null);
    try {
      const customId = inputChannelId.trim() || undefined;
      const success = await createChannel(customId);
      if (success) {
        showToast('新通道创建并已连接', 'success');
        setInputChannelId('');
      } else {
        setConnectionError('创建通道失败，请稍后重试');
      }
    } catch (err) {
      setConnectionError('创建通道失败，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  };

  // 渲染未连接通道的提示内容
  const renderNoChannelContent = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
        <FontAwesomeIcon icon={faKey} className="text-gray-400 dark:text-gray-500 text-3xl" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">未连接通道</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md">
        请输入通道ID进行连接，或创建一个新的通道来开始跨设备同步。
      </p>

      {/* 通道连接输入框和按钮 */}
      <div className="w-full max-w-md mb-6">
        <div className="relative">
          <input
            type="text"
            value={inputChannelId}
            onChange={(e) => setInputChannelId(e.target.value)}
            placeholder="输入通道ID连接"
            className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            disabled={isConnecting || isCreating}
          />
          {connectionError && (
            <p className="text-xs text-red-500 mt-1">{connectionError}</p>
          )}
        </div>
        <div className="flex justify-between mt-4 space-x-3">
          <button
            onClick={handleConnectChannel}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            disabled={isConnecting || !inputChannelId.trim() || isCreating}
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                连接中...
              </>
            ) : (
              <>连接通道</>
            )}
          </button>
          <button
            onClick={handleCreateChannel}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            disabled={isCreating || isConnecting}
          >
            {isCreating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                创建中...
              </>
            ) : (
              <>创建新通道</>
            )}
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
        通道ID用于连接多个设备，创建后请妥善保存
      </div>
    </div>
  );
  
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      {/* 弹窗顶部装饰 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-t-lg"></div>
      
      <div className="p-0 bg-white dark:bg-gray-800 flex flex-col overflow-hidden rounded-b-lg" style={{maxHeight: '85vh'}}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <FontAwesomeIcon icon={faKey} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">通道管理</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">管理您的剪贴板同步通道</p>
            </div>
          </div>
        </div>
        
        {!channelId || !isChannelVerified ? (
          // 未连接通道时显示的内容
          renderNoChannelContent()
        ) : (
          <>
            {/* 标签页导航 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 mx-6 rounded-t-lg overflow-hidden">
              <button
                className={`flex-1 py-3 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'info' 
                    ? 'text-blue-600 bg-white dark:bg-gray-800 border-b-2 border-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setActiveTab('info')}
              >
                通道信息
              </button>
              <button
                className={`flex-1 py-3 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'devices' 
                    ? 'text-blue-600 bg-white dark:bg-gray-800 border-b-2 border-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setActiveTab('devices')}
              >
                已连接设备
              </button>
              <button
                className={`flex-1 py-3 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'history' 
                    ? 'text-blue-600 bg-white dark:bg-gray-800 border-b-2 border-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setActiveTab('history')}
              >
                同步历史
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{maxHeight: '400px'}}>
                {/* 通道信息页面 */}
                {activeTab === 'info' && channelStats && (
                  <>
                    {/* 通道基本信息 */}
                    <div className="flex items-center mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full">
                        <FontAwesomeIcon icon={faChartLine} className="text-blue-600 dark:text-blue-400 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">通道状态</h3>
                        <div className="mt-1 flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-400 dark:bg-green-500 mr-2"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">活跃</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          创建于 {formatTime(channelStats.created_at)}，当前有 {channelStats.online_devices} 台设备连接
                        </div>
                      </div>
                    </div>
                    
                    {/* 通道ID和复制按钮 */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通道 ID</label>
                      <div className="relative">
                        <div className="flex">
                          <div className="grow bg-gray-50 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-l-md text-sm font-mono flex items-center">
                            {showChannelId ? channelId : maskedChannelId}
                          </div>
                          <button
                            className="px-3 border-r border-t border-b border-gray-300 dark:border-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-none"
                            onClick={() => setShowChannelId(!showChannelId)}
                          >
                            <FontAwesomeIcon icon={showChannelId ? faEyeSlash : faEye} />
                          </button>
                          <button 
                            className="px-3 border-r border-t border-b border-gray-300 dark:border-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-none flex items-center"
                            onClick={copyChannelId}
                          >
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? "text-green-500 dark:text-green-400" : ""} />
                          </button>
                          <button 
                            className="px-3 border-t border-r border-b border-gray-300 dark:border-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-r-md"
                            onClick={() => setQrVisible(!qrVisible)}
                          >
                            <FontAwesomeIcon icon={faQrcode} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        使用此ID在多个设备间建立同步连接
                      </p>
                    </div>
                    
                    {/* QR码显示区域 */}
                    {qrVisible && qrCodeImage && (
                      <div className="mb-6 flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">扫描二维码连接到此通道</p>
                        <div className="bg-white p-2 rounded-lg mb-2 w-48 h-48 relative">
                          <Image
                            src={qrCodeImage}
                            alt="通道连接二维码"
                            width={200}
                            height={200}
                            className="w-full h-full"
                            priority
                          />
                        </div>
                        <button
                          className="mt-3 flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          onClick={copyShareURL}
                        >
                          <FontAwesomeIcon icon={shareURLCopied ? faCheck : faShareNodes} className="mr-2" />
                          {shareURLCopied ? "已复制" : "复制分享链接"}
                        </button>
                      </div>
                    )}
                    
                    {/* 统计数据 */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">同步次数</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                          {channelStats.sync_count}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">剪贴板条目</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                          {channelStats.clipboard_item_count}
                        </div>
                      </div>
                    </div>
                    
                    {/* 安全提示 */}
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
                      <div className="flex">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 dark:text-yellow-500 mt-1 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">安全提示</h4>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            通道ID是连接到您剪贴板的唯一标识。请勿分享给不信任的人，如需更改请创建新通道。
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* 已连接设备页面 - 移除了断开全部设备功能 */}
                {activeTab === 'devices' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">设备列表</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{connectedDevices.length} 台设备</span>
                    </div>
                    
                    {connectedDevices.length > 0 ? (
                      <div className="space-y-3">
                        {connectedDevices.map(device => (
                          <div 
                            key={device.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all hover:shadow-md"
                          >
                            <div className="flex items-center">
                              <div className={`p-2.5 rounded-full ${
                                device.type === 'desktop' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                device.type === 'mobile' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                              }`}>
                                <FontAwesomeIcon icon={getDeviceIcon(device.type)} />
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900 dark:text-white">{device.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {device.is_online ? '当前在线' : `最后活动：${formatTime(device.last_seen)}`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                device.is_online ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {device.is_online ? '在线' : '离线'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="text-gray-400 dark:text-gray-500 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">暂无连接的设备</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">使用通道ID或扫描二维码连接更多设备</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 同步历史页面 - 美化UI */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">近期同步活动</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">最近同步记录</span>
                    </div>
                    
                    {syncHistory.length > 0 ? (
                      <div className="relative">
                        {/* 时间轴线 - 美化为渐变色 */}
                        <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-100 dark:from-blue-600 dark:via-blue-700 dark:to-blue-900/20"></div>
                        
                        <div className="space-y-5">
                          {syncHistory.map((activity, index) => (
                            <div 
                              key={activity.id} 
                              className="relative pl-12 animate-fadeIn transition-all hover:translate-x-1" 
                              style={{ animationDelay: `${index * 150}ms`, transition: 'all 0.3s ease' }}
                            >
                              {/* 时间点 - 添加脉动效果 */}
                              <div className="absolute left-4 top-3 w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-600 border-4 border-white dark:border-gray-800 z-10 shadow-md">
                                {index === 0 && (
                                  <span className="absolute inset-0 rounded-full bg-blue-500 dark:bg-blue-600 animate-ping opacity-75"></span>
                                )}
                              </div>
                              
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                      {activity.action}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    {formatTime(activity.created_at)}
                                  </div>
                                </div>
                                
                                <div className="text-sm font-medium text-gray-900 dark:text-white break-words mb-2 border-l-2 border-blue-200 dark:border-blue-800 pl-2 transition-all hover:border-blue-500">
                                  {activity.content.length > 100 
                                    ? `${activity.content.substring(0, 100)}...` 
                                    : activity.content}
                                </div>
                                
                                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-md px-2 py-1">
                                  <FontAwesomeIcon 
                                    icon={getDeviceIcon(
                                      connectedDevices.find(d => d.id === activity.device_id)?.type || 'desktop'
                                    )} 
                                    className="text-gray-400 dark:text-gray-500 mr-1.5"
                                  />
                                  <span>{getDeviceName(activity.device_id)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="text-gray-400 dark:text-gray-500 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">暂无同步历史记录</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">设备之间的同步记录将显示在这里</p>
                      </div>
                    )}
                    
                    {syncHistory.length > 8 && (
                      <div className="text-center mt-6">
                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                          查看更多历史
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* 底部操作栏 */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between space-x-3">
              <button 
                onClick={handleExitChannel}
                className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                退出通道
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </>
        )}
        
        {/* 退出通道确认对话框 */}
        {confirmExitVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认退出通道</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                退出通道后，您将无法继续接收此通道的剪贴板内容。您可以随时使用通道ID重新加入。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                  onClick={() => setConfirmExitVisible(false)}
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={confirmExitChannel}
                >
                  确认退出
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedModal>
  );
} 