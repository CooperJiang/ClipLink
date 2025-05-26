'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faGear, 
  faCircleQuestion, 
  faUserCircle,
  faSignOutAlt,
  faRandom,
  faChain,
  faLink,
  faLinkSlash,
  faPlusCircle
} from '@fortawesome/free-solid-svg-icons';
import DeviceTypeInfo from './DeviceTypeInfo';
import ChannelDetailModal from '../clipboard/ChannelDetailModal';
import HelpModal from './HelpModal';
import { useChannel } from '@/contexts/ChannelContext';
import { useToast } from '@/contexts/ToastContext';

export default function Navbar() {
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isChannelDetailModalOpen, setIsChannelDetailModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { channelId, isChannelVerified, clearChannel } = useChannel();
  const { showToast } = useToast();

  // 处理打开通道模态框（使用ChannelDetailModal代替）
  const handleOpenChannelModal = () => {
    setIsChannelModalOpen(true);
  };

  // 处理关闭通道模态框
  const handleCloseChannelModal = () => {
    setIsChannelModalOpen(false);
  };

  // 处理打开通道详情弹窗
  const handleOpenChannelDetailModal = () => {
    setIsChannelDetailModalOpen(true);
  };

  // 处理关闭通道详情弹窗
  const handleCloseChannelDetailModal = () => {
    setIsChannelDetailModalOpen(false);
  };

  // 处理打开帮助弹窗
  const handleOpenHelpModal = () => {
    setIsHelpModalOpen(true);
  };

  // 处理关闭帮助弹窗
  const handleCloseHelpModal = () => {
    setIsHelpModalOpen(false);
  };

  // 处理退出通道
  const handleLogout = () => {
    clearChannel();
    showToast('已断开通道连接', 'success');
  };

  return (
    <>
    <nav className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 text-xl" />
          <h1 className="text-lg font-semibold">ClipLink</h1>
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline-block">|</span>
        <span className="text-xs text-gray-400 hidden sm:inline-block">跨设备智能剪贴板</span>
      </div>
      <div className="flex items-center space-x-4">
        <DeviceTypeInfo />
        <Link href="/settings" className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors">
          <FontAwesomeIcon icon={faGear} />
        </Link>
        <button 
          className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
          onClick={handleOpenHelpModal}
        >
          <FontAwesomeIcon icon={faCircleQuestion} />
        </button>
          
          {/* 优化通道连接按钮 - 使用不同颜色状态和动画效果 */}
          {isChannelVerified ? (
            <div className="relative group">
              <button 
                onClick={handleOpenChannelDetailModal}
                className="flex items-center px-3 py-1.5 rounded-md bg-green-50 border border-green-200 text-sm text-green-700 font-medium hover:bg-green-100 transition-colors group-hover:shadow-md"
              >
                <span className="mr-1.5 relative">
                  <FontAwesomeIcon icon={faLink} className="text-green-600" />
                  {/* 添加脉动动画指示活跃连接 */}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </span>
                <span>已连接</span>
              </button>
              <div className="absolute hidden group-hover:block mt-1 right-0 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-28 z-10">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={handleOpenChannelDetailModal}
                >
                  <FontAwesomeIcon icon={faChain} className="mr-2 text-gray-500 dark:text-gray-400" />
                  通道详情
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center border-t border-gray-100 dark:border-gray-700"
                >
                  <FontAwesomeIcon icon={faLinkSlash} className="mr-2" />
                  断开连接
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleOpenChannelModal} 
              className="flex items-center px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faPlusCircle} className="mr-1.5 text-gray-500" />
              <span>连接通道</span>
            </button>
          )}
      </div>
    </nav>
      
      {/* 通道模态框（使用ChannelDetailModal） */}
      <ChannelDetailModal 
        isOpen={isChannelModalOpen} 
        onClose={handleCloseChannelModal} 
        channelId={channelId || "new_channel"} // 没有通道ID时创建新通道
      />

      {/* 通道详情弹窗 */}
      {channelId && (
        <ChannelDetailModal
          isOpen={isChannelDetailModalOpen}
          onClose={handleCloseChannelDetailModal}
          channelId={channelId}
        />
      )}

      {/* 帮助弹窗 */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={handleCloseHelpModal}
      />
    </>
  );
} 