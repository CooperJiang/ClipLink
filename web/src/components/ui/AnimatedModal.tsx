'use client';

import React, { useEffect, useState, ReactNode, useRef } from 'react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function AnimatedModal({ 
  isOpen, 
  onClose, 
  children,
  maxWidth = 'max-w-2xl',
  showCloseButton = true
}: AnimatedModalProps) {
  // 添加状态来控制动画
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 当isOpen变化时控制动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 延迟一帧添加动画类
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          // 聚焦到模态框内部元素
          if (modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
              (focusableElements[0] as HTMLElement).focus();
            } else {
              modalRef.current.focus();
            }
          }
        });
      });
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      // 等待动画完成后隐藏
      const timer = setTimeout(() => {
        setIsVisible(false);
        // 恢复背景滚动
        document.body.style.overflow = '';
      }, 300); // 与过渡时间匹配
      return () => clearTimeout(timer);
    }
    
    return () => {
      // 清理函数确保离开时恢复背景滚动
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 添加ESC键关闭功能
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleEscKey);
    
    // 清理事件监听
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // 处理焦点循环
  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* 背景蒙层 - 修复虚影问题 */}
      <div 
        className={`absolute inset-0 bg-black transition-all duration-300 ease-out ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`} 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* 毛玻璃效果层 */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm transition-all duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      
      {/* 模态框容器 - 居中布局 */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div 
          ref={modalRef}
          className={`relative ${maxWidth} w-full transition-all duration-300 ease-out ${
            isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
          }`}
          onKeyDown={handleTabKey}
          tabIndex={-1}
        >
          {/* 关闭按钮 - 固定在弹窗内部右上角 */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-30 p-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-md border border-gray-200 dark:border-gray-600"
              aria-label="关闭"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
} 