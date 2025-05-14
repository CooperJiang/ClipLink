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
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/contexts/ToastContext';

interface ChannelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

export default function ChannelDetailModal({ isOpen, onClose, channelId }: ChannelDetailModalProps) {
  const [showChannelId, setShowChannelId] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareURLCopied, setShareURLCopied] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const { showToast } = useToast();
  
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
      // 重置状态
      setShowChannelId(false);
    }
  }, [isOpen]);
  
  // 处理关闭弹窗
  const handleClose = () => {
    setAnimationClass('scale-95 opacity-0');
    setTimeout(() => {
      onClose();
      setAnimationClass('');
    }, 200);
  };
  
  // 复制通道ID到剪贴板
  const copyChannelId = () => {
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
  
  // 遮罩通道ID
  const maskedChannelId = channelId ? '•'.repeat(Math.min(channelId.length, 20)) : '';
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 p-4">
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 ${animationClass}`}
      >
        {/* 弹窗顶部装饰 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <span className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faKey} className="text-blue-600" />
              </span>
              通道详情
            </h2>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>
          
          {/* 警告提示 */}
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg">
            <div className="flex">
              <FontAwesomeIcon icon={faInfoCircle} className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  通道ID是访问你数据的唯一凭证，请妥善保管。不要分享给不信任的人，确保在安全环境下查看。
                </p>
              </div>
            </div>
          </div>
          
          {/* 通道ID显示区域 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              通道ID
            </label>
            <div className="relative">
              <div className="flex">
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-l-lg p-3 font-mono text-sm">
                  {showChannelId ? channelId : maskedChannelId}
                </div>
                <button
                  onClick={() => setShowChannelId(!showChannelId)}
                  className="px-4 border-t border-r border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 rounded-r-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-all"
                  title={showChannelId ? "隐藏通道ID" : "显示通道ID"}
                >
                  <FontAwesomeIcon icon={showChannelId ? faEyeSlash : faEye} className="text-gray-500 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={copyChannelId}
              className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              <span>{copied ? "已复制" : "复制通道ID"}</span>
            </button>
            
            <button
              onClick={copyShareURL}
              className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors"
            >
              <FontAwesomeIcon icon={shareURLCopied ? faCheck : faShareNodes} />
              <span>{shareURLCopied ? "已复制" : "复制分享链接"}</span>
            </button>
          </div>
          
          {/* 说明文字 */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>• 在多个设备上使用相同的通道ID来同步你的剪贴板内容</p>
            <p>• 复制分享链接可让其他设备直接连接到你的通道</p>
            <p>• 通道ID一旦设置无法更改，请妥善保存</p>
          </div>
        </div>
      </div>
      
      {/* 添加用于动画效果的CSS */}
      <style jsx global>{`
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
      `}</style>
    </div>
  );
} 