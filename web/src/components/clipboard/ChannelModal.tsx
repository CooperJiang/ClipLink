'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRandom, 
  faArrowRight, 
  faInfoCircle, 
  faPlug, 
  faKey, 
  faTimes, 
  faEye, 
  faEyeSlash,
  faShieldAlt,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { useChannel } from '@/contexts/ChannelContext';
import { useToast } from '@/contexts/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import AnimatedModal from '../ui/AnimatedModal';

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOpen?: boolean; // 如果为true，则不能关闭
}

export default function ChannelModal({ isOpen, onClose, forceOpen = false }: ChannelModalProps) {
  const [channelId, setChannelId] = useState('');
  const [activeTab, setActiveTab] = useState<'connect' | 'create'>('connect');
  const [isLoading, setIsLoading] = useState(false);
  const [showChannelId, setShowChannelId] = useState(false);
  const { createChannel, verifyChannel, error: contextError } = useChannel();
  const { showToast } = useToast();

  // 生成随机通道ID
  const generateRandomChannelId = () => {
    const uuid = uuidv4().replace(/-/g, '').substring(0, 16);
    setChannelId(uuid);
    // 创建动画效果
    const input = document.getElementById('newChannelId');
    if (input) {
      input.classList.add('highlight-animation');
      setTimeout(() => {
        input.classList.remove('highlight-animation');
      }, 1000);
    }
  };

  // 连接到通道
  const handleConnect = async () => {
    if (!channelId.trim()) {
      showToast('请输入通道ID', 'error');
      return;
    }

    setIsLoading(true);
    const success = await verifyChannel(channelId.trim());
    setIsLoading(false);

    if (success) {
      showToast('通道连接成功', 'success');
      if (!forceOpen) {
        onClose();
      }
    } else {
      showToast('通道ID无效，请重试', 'error');
      // 添加错误时的抖动效果
      const input = document.getElementById('channelId');
      if (input) {
        input.classList.add('shake-animation');
        setTimeout(() => {
          input.classList.remove('shake-animation');
        }, 500);
      }
    }
  };

  // 创建新通道
  const handleCreate = async () => {
    setIsLoading(true);
    const customId = channelId.trim() || undefined;
    const success = await createChannel(customId);
    setIsLoading(false);

    if (success) {
      showToast('通道创建成功', 'success');
      if (!forceOpen) {
        onClose();
      }
    } else {
      showToast('通道创建失败，请重试', 'error');
      // 添加错误时的抖动效果
      const input = document.getElementById('newChannelId');
      if (input) {
        input.classList.add('shake-animation');
        setTimeout(() => {
          input.classList.remove('shake-animation');
        }, 500);
      }
    }
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'connect') {
      handleConnect();
    } else {
      handleCreate();
    }
  };

  // 切换标签页
  const handleTabChange = (tab: 'connect' | 'create') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      // 清空当前输入
      setChannelId('');
      setShowChannelId(false);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={forceOpen ? () => {} : onClose} maxWidth="max-w-[800px]">
      <div className="flex flex-col md:flex-row">
        {/* 左侧信息面板 - 在移动端显示缩略版 */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-24 sm:w-40 h-24 sm:h-40 rounded-full bg-white"></div>
            <div className="absolute bottom-10 right-10 w-32 sm:w-60 h-32 sm:h-60 rounded-full bg-white"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center mr-3 sm:mr-4">
                <FontAwesomeIcon icon={faShieldAlt} className="text-white text-lg sm:text-xl" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">ClipLink 通道</h2>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">安全的跨设备同步</h3>
            
            {/* 移动端只显示精简内容 */}
            <ul className="space-y-2 sm:space-y-4 mb-4 sm:mb-8 md:block hidden">
              <li className="flex">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p>通道ID可让你在不同设备间轻松同步数据，保持内容一致</p>
              </li>
              <li className="flex">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p>每个通道相互隔离，确保你的剪贴板内容安全且私密</p>
              </li>
              <li className="flex">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p>创建时可使用自定义ID或随机生成，请妥善保管你的通道ID</p>
              </li>
            </ul>
            
            {/* 移动端显示简化版 */}
            <div className="md:hidden">
              <p className="text-sm mb-4">通过通道ID可在多设备间同步数据，请妥善保管并保持私密</p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-3 sm:p-4 border border-white/20 text-sm">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faInfoCircle} className="text-white mt-1 mr-2 sm:mr-3 flex-shrink-0" />
                <p className="text-xs sm:text-sm opacity-90">
                  在多个设备上使用相同的通道ID，你的剪贴板将自动在所有设备间同步。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧表单 */}
        <div className="w-full md:w-7/12 p-4 sm:p-6 md:p-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'connect' ? '连接通道' : '创建通道'}
            </h2>
            {!forceOpen && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            )}
          </div>
          
          {/* 标签页导航 */}
          <div className="flex mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-700 rounded-full p-1 sm:p-1.5">
            <button
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center ${
                activeTab === 'connect'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
              onClick={() => handleTabChange('connect')}
            >
              <FontAwesomeIcon icon={faPlug} className="mr-1 sm:mr-2" />
              连接现有通道
            </button>
            <button
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
              onClick={() => handleTabChange('create')}
            >
              <FontAwesomeIcon icon={faKey} className="mr-1 sm:mr-2" />
              创建新通道
            </button>
          </div>
          
          {/* 连接通道表单 */}
          {activeTab === 'connect' && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  通道ID
                </label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative flex-1">
                      <input
                        type={showChannelId ? 'text' : 'password'}
                        id="channelId"
                        name="channelId"
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        className="block w-full rounded-l-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white transition-all pl-3 py-2.5 pr-10"
                        placeholder="输入通道ID以连接"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowChannelId(!showChannelId)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <FontAwesomeIcon icon={showChannelId ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <FontAwesomeIcon icon={faSync} className="animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">连接</span>
                          <FontAwesomeIcon icon={faArrowRight} className="sm:ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  输入你或其他人创建的通道ID，连接后可同步剪贴板内容
                </p>
              </div>

              {/* 输入指引区域 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 dark:text-blue-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">如何获取通道ID？</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      你可以请求其他已创建通道的用户分享给你，或者切换到「创建通道」标签页创建一个新通道。
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
          
          {/* 创建通道表单 */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="newChannelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  自定义通道ID（可选）
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <input
                      type={showChannelId ? 'text' : 'password'}
                      id="newChannelId"
                      name="newChannelId"
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white transition-all pl-3 py-2.5 pr-10"
                      placeholder="留空将自动生成"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChannelId(!showChannelId)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <FontAwesomeIcon icon={showChannelId ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomChannelId}
                    className="px-3 sm:px-4 py-2.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    <FontAwesomeIcon icon={faRandom} className="mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">随机生成</span>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  你可以使用自定义ID或随机生成的ID，创建后请妥善保存
                </p>
              </div>
                
              {/* 创建指引区域 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 dark:text-blue-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">通道创建说明</h4>
                    <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400 list-disc pl-4">
                      <li>创建通道无需注册或登录账号</li>
                      <li>通道ID必须在多设备间保持一致才能同步内容</li>
                      <li>重要内容请备份，数据可能会在服务器更新时清除</li>
                    </ul>
                  </div>
                </div>
              </div>
                
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSync} className="animate-spin mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                )}
                {isLoading ? '处理中...' : '创建新通道'}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .highlight-animation {
          animation: highlight 1s ease;
        }
        
        @keyframes highlight {
          0% { background-color: rgba(96, 165, 250, 0.2); }
          50% { background-color: rgba(96, 165, 250, 0.4); }
          100% { background-color: transparent; }
        }
        
        .shake-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
          40%, 60% { transform: translate3d(3px, 0, 0); }
        }
      `}</style>
    </AnimatedModal>
  );
} 