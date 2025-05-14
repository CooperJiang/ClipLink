import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // 毫秒
  onClose: (id: string) => void;
}

export default function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  // 根据类型决定背景颜色和图标
  const bgColorClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  };

  // 设置自动关闭
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div 
      className={`${bgColorClasses[type]} text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-between w-full animate-fade-in`}
      role="alert"
    >
      <div className="flex items-center flex-grow mr-2">
        <p className="text-sm font-medium truncate">{message}</p>
      </div>
      <button 
        className="flex-shrink-0 text-white hover:text-gray-100"
        onClick={() => onClose(id)}
        aria-label="关闭"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
} 