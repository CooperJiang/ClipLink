'use client';

import { useState } from 'react';
import AnimatedModal from '../ui/AnimatedModal';
import { ClipboardType } from '@/types/clipboard';
import { useClipboardFilter } from '@/hooks';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, type?: ClipboardType, title?: string, isFavorite?: boolean) => void;
  initialContent?: string;
}

export default function AddContentModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialContent = ''
}: AddContentModalProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<ClipboardType>(ClipboardType.TEXT);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const { handleFilteredContent } = useClipboardFilter({
    hasClipboardPermission: true,
    isIOSDevice: false,
    isChannelVerified: true,
    onSaveContent: async () => true,
    debug: false
  });

  // 获取类型名称
  const getTypeName = (type: ClipboardType): string => {
    switch (type) {
      case ClipboardType.TEXT:
        return '文本';
      case ClipboardType.LINK:
        return '链接';
      case ClipboardType.CODE:
        return '代码';
      case ClipboardType.PASSWORD:
        return '密码';
      case ClipboardType.IMAGE:
        return '图片';
      case ClipboardType.FILE:
        return '文件';
      case ClipboardType.OTHER:
        return '其他';
      default:
        return '文本';
    }
  };

  // 处理内容提交
  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('内容不能为空');
      return;
    }
    
    if (isSaving) {
      return; // 防止重复提交
    }
    
    setError('');
    setIsSaving(true);
    
    try {
      // 调用父组件传入的保存函数
      onSave(content, selectedType, title || undefined, isFavorite);
      
      // 清空表单
      setContent('');
      setTitle('');
      setSelectedType(ClipboardType.TEXT);
      setIsFavorite(false);
    } catch (err) {
      setError('保存失败，请重试');
      console.error('保存内容失败:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 快速粘贴剪贴板内容
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setContent(clipboardText);
        
        // 简单的内容类型检测
        if (clipboardText.startsWith('http://') || clipboardText.startsWith('https://')) {
          setSelectedType(ClipboardType.LINK);
        } else if (clipboardText.includes('{') && clipboardText.includes('}') || 
                  clipboardText.includes('<') && clipboardText.includes('>') ||
                  clipboardText.includes('function') || clipboardText.includes('class')) {
          setSelectedType(ClipboardType.CODE);
        }
      }
    } catch (err) {
      setError('无法读取剪贴板，请手动输入内容');
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} showCloseButton={false} maxWidth="max-w-lg">
      <div className="glass-effect bg-white/95 dark:bg-dark-surface-primary/95 backdrop-blur-xl rounded-xl overflow-hidden w-full mx-auto shadow-xl dark:shadow-dark-xl border border-white/30 dark:border-dark-border-primary/40 relative">
        {/* 自定义关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-1.5 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-secondary/60 text-neutral-500 dark:text-dark-text-tertiary hover:text-neutral-700 dark:hover:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 transition-all duration-200 shadow-sm border border-white/30 dark:border-dark-border-secondary/50 hover:scale-105"
          aria-label="关闭"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* 头部区域 */}
        <div className="glass-effect bg-gradient-to-r from-white/70 to-white/50 dark:from-dark-surface-secondary/70 dark:to-dark-surface-secondary/50 border-b border-white/20 dark:border-dark-border-primary/30">
          <div className="p-4 pr-12">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-dark-text-primary font-display">添加新内容</h2>
                <p className="text-xs text-neutral-600 dark:text-dark-text-tertiary">
                  手动添加内容到剪贴板历史
                </p>
              </div>
            </div>
            
            {/* 从剪贴板粘贴按钮 */}
            <div className="mt-3">
              <button
                onClick={handlePaste}
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 text-neutral-700 dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 border border-white/30 dark:border-dark-border-secondary/50 hover:scale-105 shadow-sm"
                title="从系统剪贴板中获取内容"
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                从剪贴板粘贴
              </button>
            </div>
          </div>
        </div>

        {/* 表单内容区域 */}
        <div className="p-4">
          <div className="space-y-4">
            {/* 内容类型选择 - 紧凑设计 */}
            <div>
              <label className="block text-sm font-medium text-neutral-800 dark:text-dark-text-primary mb-2">
                内容类型
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[ClipboardType.TEXT, ClipboardType.CODE, ClipboardType.LINK, ClipboardType.PASSWORD].map((type) => {
                  // 定义所有类型的配置，确保覆盖所有ClipboardType值
                  const getTypeConfig = (type: ClipboardType) => {
                    switch (type) {
                      case ClipboardType.TEXT:
                        return {
                          icon: '📝',
                          name: '文本',
                          color: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-600',
                          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                        };
                      case ClipboardType.CODE:
                        return {
                          icon: '💻',
                          name: '代码',
                          color: 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-600',
                          bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
                        };
                      case ClipboardType.LINK:
                        return {
                          icon: '🔗',
                          name: '链接',
                          color: 'from-green-500 to-green-600 dark:from-green-400 dark:to-green-600',
                          bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                        };
                      case ClipboardType.PASSWORD:
                        return {
                          icon: '🔒',
                          name: '密码',
                          color: 'from-red-500 to-red-600 dark:from-red-400 dark:to-red-600',
                          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                        };
                      case ClipboardType.IMAGE:
                        return {
                          icon: '🖼️',
                          name: '图片',
                          color: 'from-pink-500 to-pink-600 dark:from-pink-400 dark:to-pink-600',
                          bgColor: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
                        };
                      case ClipboardType.FILE:
                        return {
                          icon: '📁',
                          name: '文件',
                          color: 'from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-600',
                          bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
                        };
                      case ClipboardType.OTHER:
                        return {
                          icon: '📄',
                          name: '其他',
                          color: 'from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-600',
                          bgColor: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
                        };
                      default:
                        // 默认配置，防止未定义的类型
                        return {
                          icon: '📄',
                          name: getTypeName(type),
                          color: 'from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-600',
                          bgColor: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
                        };
                    }
                  };
                  
                  const config = getTypeConfig(type);
                  const isSelected = selectedType === type;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all duration-200 border hover:scale-105 ${
                        isSelected
                          ? `bg-gradient-to-br ${config.color} text-white shadow-md border-transparent`
                          : `glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 text-neutral-700 dark:text-dark-text-secondary border-white/30 dark:border-dark-border-secondary/50 hover:bg-white/80 dark:hover:bg-dark-surface-hover/80`
                      }`}
                    >
                      <span className="text-lg mb-1">{config.icon}</span>
                      <span className="text-xs font-medium">{config.name}</span>
                      
                      {/* 选中指示器 */}
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 内容标题和收藏设置 */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label htmlFor="contentTitle" className="block text-sm font-medium text-neutral-800 dark:text-dark-text-primary mb-1.5">
                  标题 <span className="text-neutral-500 dark:text-dark-text-muted font-normal text-xs">(可选)</span>
                </label>
                <input
                  id="contentTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="为内容添加标题..."
                  className="w-full px-3 py-2 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 border border-white/30 dark:border-dark-border-secondary/50 rounded-lg text-sm text-neutral-900 dark:text-dark-text-primary placeholder-neutral-500 dark:placeholder-dark-text-muted focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-400/30 focus:border-brand-500/50 dark:focus:border-brand-400/50 transition-all duration-200 backdrop-blur-sm"
                />
              </div>
              
              {/* 收藏开关 */}
              <div className="flex items-center justify-between">
                <label htmlFor="favoriteToggle" className="text-sm font-medium text-neutral-800 dark:text-dark-text-primary">
                  添加到收藏
                </label>
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    isFavorite 
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isFavorite ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 内容输入框 */}
            <div>
              <label htmlFor="contentInput" className="block text-sm font-medium text-neutral-800 dark:text-dark-text-primary mb-1.5">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="contentInput"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入要保存的内容..."
                rows={4}
                className="w-full px-3 py-2 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 border border-white/30 dark:border-dark-border-secondary/50 rounded-lg text-sm text-neutral-900 dark:text-dark-text-primary placeholder-neutral-500 dark:placeholder-dark-text-muted focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-400/30 focus:border-brand-500/50 dark:focus:border-brand-400/50 transition-all duration-200 backdrop-blur-sm resize-none"
              />
            </div>
            
            {/* 密码类型提示 */}
            {selectedType === ClipboardType.PASSWORD && (
              <div className="glass-effect bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <h3 className="text-xs font-medium text-amber-800 dark:text-amber-400">密码安全提示</h3>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      密码将在显示时进行模糊处理，但保留完整内容以供复制。
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误提示 */}
            {error && (
              <div className="glass-effect bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="glass-effect bg-gradient-to-r from-white/70 to-white/50 dark:from-dark-surface-secondary/70 dark:to-dark-surface-secondary/50 border-t border-white/20 dark:border-dark-border-primary/30 px-4 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 border border-white/30 dark:border-dark-border-secondary/50 rounded-lg text-neutral-700 dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:scale-105"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isSaving}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 ${
              !content.trim() || isSaving
                ? 'bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed'
                : 'glass-effect bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 shadow-brand-500/30 dark:shadow-glow-brand hover:shadow-xl'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </div>
            ) : (
              <div className="flex items-center">
                {isFavorite && (
                  <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
                保存{isFavorite ? '并收藏' : ''}
              </div>
            )}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
} 