'use client';

import React, { useEffect, useState, ReactNode } from 'react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function AnimatedModal({ 
  isOpen, 
  onClose, 
  children,
  maxWidth = 'max-w-3xl' 
}: AnimatedModalProps) {
  // 添加状态来控制动画
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // 当isOpen变化时控制动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 延迟一帧添加动画类
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // 等待动画完成后隐藏
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 与过渡时间匹配
      return () => clearTimeout(timer);
    }
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

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 点击蒙层关闭 */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`} 
        onClick={onClose}
      ></div>
      
      <div 
        className={`bg-white rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-in-out ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {children}
      </div>
    </div>
  );
} 