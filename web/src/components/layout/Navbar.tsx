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
  faChain
} from '@fortawesome/free-solid-svg-icons';
import DeviceTypeInfo from './DeviceTypeInfo';
import ChannelModal from '../clipboard/ChannelModal';
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

  // 处理打开通道模态框
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
          
          {isChannelVerified ? (
            <div className="relative inline-flex items-center">
              <button 
                onClick={handleOpenChannelDetailModal}
                className="px-3 py-1.5 rounded-l-full bg-green-50 text-sm text-green-700 font-medium flex items-center hover:bg-green-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChain} className="mr-1.5" />
                <span>通道已链接</span>
              </button>
              <button 
                onClick={handleLogout}
                className="px-2 py-1.5 rounded-r-full bg-red-50 text-sm text-red-600 hover:bg-red-100 transition-colors"
                title="断开通道连接"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleOpenChannelModal} 
              className="relative inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors"
            >
              <FontAwesomeIcon icon={faUserCircle} className="mr-1.5" />
              <span>建立通道</span>
            </button>
          )}
      </div>
    </nav>
      
      {/* 通道模态框 */}
      <ChannelModal 
        isOpen={isChannelModalOpen} 
        onClose={handleCloseChannelModal} 
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