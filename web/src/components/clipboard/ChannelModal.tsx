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
  const [animationClass, setAnimationClass] = useState('');
  const { createChannel, verifyChannel, error: contextError } = useChannel();
  const { showToast } = useToast();

  // 处理关闭弹窗
  const handleClose = () => {
    if (!forceOpen) {
      setAnimationClass('scale-95 opacity-0');
      setTimeout(() => {
        onClose();
        setAnimationClass('');
      }, 200);
    }
  };

  // 当弹窗打开时添加动画效果
  useEffect(() => {
    if (isOpen) {
      // 立即设置初始状态
      setAnimationClass('scale-95 opacity-0');
      
      // 使用requestAnimationFrame确保状态更新后应用动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationClass('scale-100 opacity-100');
        });
      });
    } else {
      setAnimationClass('');
    }
  }, [isOpen]);

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
      handleClose();
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
      handleClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 p-2 sm:p-4 overflow-auto">
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${animationClass} w-full max-h-[95vh] overflow-y-auto`}
        style={{ maxWidth: '800px' }}
      >
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
                <h2 className="text-xl sm:text-2xl font-bold">ClipFlow 通道</h2>
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
                  onClick={handleClose}
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
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {activeTab === 'connect' ? (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      输入已有的通道ID连接到你的账户，继续访问你的剪贴板数据
                    </p>
                  </div>
                  
                  {contextError && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                        {contextError}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="channelId" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      通道ID
                    </label>
                    <div className="relative">
                      <input
                        type={showChannelId ? "text" : "password"}
                        id="channelId"
                        maxLength={64}
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        placeholder="输入你的通道ID"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 dark:placeholder-gray-400 pr-10 sm:pr-12 text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowChannelId(!showChannelId)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <FontAwesomeIcon icon={showChannelId ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      创建新通道来保存和同步你的剪贴板数据。请保存并记住你的通道ID！
                    </p>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="newChannelId" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      自定义通道ID <span className="text-gray-400 dark:text-gray-500">(可选)</span>
                    </label>
                    <div className="relative flex">
                      <input
                        type={showChannelId ? "text" : "password"}
                        id="newChannelId"
                        maxLength={64}
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        placeholder="留空自动生成或输入自定义ID"
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-l-lg sm:rounded-l-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:z-10 transition-all duration-200 dark:placeholder-gray-400 pr-10 sm:pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowChannelId(!showChannelId)}
                        className="absolute right-[3.5rem] sm:right-[4.5rem] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
                      >
                        <FontAwesomeIcon icon={showChannelId ? faEyeSlash : faEye} />
                      </button>
                      <button
                        type="button"
                        onClick={generateRandomChannelId}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 border-l-0 rounded-r-lg sm:rounded-r-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:z-10"
                        title="生成随机通道ID"
                      >
                        <FontAwesomeIcon icon={faRandom} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      自定义ID更易记忆，随机ID更安全。通道ID创建后无法更改！
                    </p>
                  </div>
                </>
              )}
              
              {contextError && (
                <div className="p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-xs sm:text-sm text-red-700 dark:text-red-400">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  {contextError}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg sm:rounded-xl font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">处理中...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-1 sm:mr-2 text-sm">{activeTab === 'connect' ? '连接通道' : '创建通道'}</span>
                    <FontAwesomeIcon icon={activeTab === 'connect' ? faPlug : faSync} className="text-xs sm:text-sm" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 添加用于动画效果的CSS */}
      <style jsx global>{`
        .highlight-animation {
          animation: highlight 1s ease;
        }
        
        .shake-animation {
          animation: shake 0.5s ease;
        }
        
        .scale-95 {
          transform: scale(0.95);
        }
        
        .scale-100 {
          transform: scale(1);
        }
        
        .opacity-0 {
          opacity: 0;
        }
        
        .opacity-100 {
          opacity: 1;
        }
        
        @keyframes highlight {
          0% { background-color: rgba(59, 130, 246, 0.1); }
          50% { background-color: rgba(59, 130, 246, 0.2); }
          100% { background-color: transparent; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
} 