import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboard, 
  faCheck, 
  faRotate, 
  faCopy, 
  faPenToSquare,
  faLock,
  faLockOpen,
  faSave,
  faTimes,
  faPlus,
  faPaste
} from '@fortawesome/free-solid-svg-icons';
import { ClipboardItem, ClipboardType } from '@/types/clipboard';
import { useToast } from '@/contexts/ToastContext';

interface CurrentClipboardProps {
  clipboard?: ClipboardItem;
  onCopy: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  syncEnabled: boolean;
  hasPermission: boolean;
  onRequestPermission: () => void;
  onSaveManualInput?: (content: string, type?: ClipboardType, isManualInput?: boolean) => Promise<boolean>;
  isIOSDevice?: boolean;
}

export default function CurrentClipboard({ 
  clipboard, 
  onCopy, 
  onEdit, 
  onRefresh,
  syncEnabled = true,
  hasPermission = true,
  onRequestPermission,
  onSaveManualInput,
  isIOSDevice = false
}: CurrentClipboardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isManualAdding, setIsManualAdding] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // 格式化日期时间，确保添加秒数显示
  const formatDateTime = (date: Date | string | number | undefined): string => {
    if (!date) return ''; 
    
    try {
      const dateObj = new Date(date);
      // 检查日期是否有效
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      return dateObj.toLocaleString('zh-CN', { 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '';
    }
  };

  useEffect(() => {
    if (!isEditing && !isManualAdding) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancelEdit();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, isManualAdding]);

  const handleCopy = async () => {
    if (!clipboard) return;
    
    try {
      await navigator.clipboard.writeText(clipboard.content);
      onCopy();
    } catch (err) {
      showToast('复制失败', 'error');
    }
  };

  const handleContentClick = () => {
    if (!isEditing && !isManualAdding && hasPermission && clipboard?.content) {
      setIsEditing(true);
      setIsManualAdding(false);
      setInputContent(clipboard?.content || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    }
  };

  const handleSaveInput = async () => {
    if (!onSaveManualInput) return;
    
    try {
      setIsSaving(true);
      const success = await onSaveManualInput(inputContent, undefined, isManualAdding);
      if (success) {
        setIsEditing(false);
        setIsManualAdding(false);
        showToast('内容已保存', 'success');
      }
    } catch (error) {
      showToast('保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsManualAdding(false);
    setInputContent('');
  };
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        showToast('剪贴板为空', 'warning');
        return;
      }
      
      if (onSaveManualInput) {
        const success = await onSaveManualInput(text, undefined, true);
        if (success) {
          showToast('内容已保存', 'success');
        }
      }
    } catch (error) {
      showToast('读取剪贴板失败，请重新授权', 'error');
      onRequestPermission();
    }
  };
  
  const handleOpenManualInput = () => {
    setIsEditing(false);
    setIsManualAdding(true);
    setInputContent('');
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  return (
    <div className="glass-effect bg-white/90 dark:bg-dark-surface-primary/90 backdrop-blur-md rounded-2xl shadow-lg dark:shadow-dark-lg border border-white/30 dark:border-dark-border-primary/30 p-3 mb-3 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 rounded-lg shadow-sm dark:shadow-glow-brand">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-dark-text-primary font-display">当前剪贴板</h2>
            {clipboard?.type && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                clipboard.type === 'code' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                clipboard.type === 'link' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                clipboard.type === 'password' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
              }`}>
                {clipboard.type === 'code' ? '代码' : 
                 clipboard.type === 'link' ? '链接' : 
                 clipboard.type === 'password' ? '密码' : '文本'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {isIOSDevice ? (
            <button 
              onClick={() => onSaveManualInput && onSaveManualInput('', undefined, true)} 
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg glass-effect bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 text-white shadow-sm hover:shadow-md dark:shadow-glow-brand transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              手动添加
            </button>
          ) : (
            <>
              {!hasPermission && (
                <button
                  onClick={onRequestPermission}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg glass-effect bg-gradient-to-r from-brand-500 to-blue-500 dark:from-brand-dark-400 dark:to-blue-600 text-white shadow-sm hover:shadow-md dark:shadow-glow-brand transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 21H5v-6l2.257-2.257A6 6 0 1119 9z" />
                  </svg>
                  授权访问
                </button>
              )}
              {!syncEnabled && hasPermission && (
                <span className="text-xs text-warning-600 dark:text-warning-400 flex items-center px-2.5 py-1 glass-effect bg-warning-50/80 dark:bg-warning-900/20 rounded-lg border border-warning-200/50 dark:border-warning-800/30">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  同步已暂停
                </span>
              )}
            </>
          )}
          
          <button 
            onClick={onRefresh}
            className="p-2 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-hover/60 hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 text-neutral-600 dark:text-dark-text-tertiary hover:text-neutral-800 dark:hover:text-dark-text-secondary transition-all duration-200 border border-white/30 dark:border-dark-border-secondary/30 hover:scale-105"
            title="刷新"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {!clipboard ? (
        <div className="flex flex-col items-center justify-center p-4 glass-effect bg-white/40 dark:bg-dark-surface-secondary/40 backdrop-blur-sm border border-white/20 dark:border-dark-border-secondary/20 rounded-xl text-center">
          <div className="w-10 h-10 mb-2 rounded-xl glass-effect bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-neutral-800 dark:text-dark-text-primary mb-1">暂无内容</h3>
          <p className="text-neutral-600 dark:text-dark-text-tertiary text-xs mb-3 max-w-sm leading-relaxed">
            {isIOSDevice ? '点击"手动添加"添加新内容' : '复制内容后将自动同步至此'}
          </p>
          {!isIOSDevice && hasPermission && (
            <button 
              onClick={handlePaste}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg glass-effect bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 text-white shadow-sm hover:shadow-md dark:shadow-glow-brand transition-all duration-200 hover:scale-105"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              从剪贴板粘贴
            </button>
          )}
        </div>
      ) : (
        <div className="group relative">
          <div className={`rounded-xl border p-2.5 ${
            clipboard.type === 'code' ? 'glass-effect bg-gradient-to-r from-amber-50/80 to-white/80 dark:from-amber-950/10 dark:to-dark-surface-secondary/80 border-amber-200/50 dark:border-amber-900/50' :
            clipboard.type === 'link' ? 'glass-effect bg-gradient-to-r from-blue-50/80 to-white/80 dark:from-blue-950/10 dark:to-dark-surface-secondary/80 border-blue-200/50 dark:border-blue-900/50' :
            clipboard.type === 'password' ? 'glass-effect bg-gradient-to-r from-red-50/80 to-white/80 dark:from-red-950/10 dark:to-dark-surface-secondary/80 border-red-200/50 dark:border-red-900/50' :
            'glass-effect bg-gradient-to-r from-white/80 to-white/60 dark:from-dark-surface-secondary/80 dark:to-dark-surface-secondary/60 border-white/30 dark:border-dark-border-secondary/30'
          } backdrop-blur-sm`}>
            <div className="overflow-hidden break-words text-sm text-neutral-700 dark:text-dark-text-secondary max-h-16 leading-relaxed">
              {clipboard.content}
            </div>
            
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/40 dark:border-dark-border-secondary/40 text-xs text-neutral-500 dark:text-dark-text-muted">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDateTime(clipboard.createdAt || clipboard.created_at)}
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="inline-flex items-center px-2 py-1 rounded-md glass-effect bg-white/60 dark:bg-dark-surface-hover/60 hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 text-neutral-600 dark:text-dark-text-tertiary hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  复制
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="inline-flex items-center px-2 py-1 rounded-md glass-effect bg-white/60 dark:bg-dark-surface-hover/60 hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 text-neutral-600 dark:text-dark-text-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑框 */}
      {(isEditing || isManualAdding) && (
        <div 
          ref={containerRef}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in p-4"
        >
          <div className="w-full max-w-2xl glass-effect bg-white/95 dark:bg-dark-surface-primary/95 backdrop-blur-xl rounded-2xl shadow-2xl dark:shadow-dark-xl border border-white/30 dark:border-dark-border-primary/40 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-white/20 dark:border-dark-border-primary/30 flex justify-between items-center glass-effect bg-white/60 dark:bg-dark-surface-secondary/60">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-dark-text-primary font-display">
                {isEditing ? '编辑内容' : '添加新内容'}
              </h3>
              <button 
                onClick={handleCancelEdit}
                className="p-2 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-hover/60 hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 text-neutral-500 hover:text-neutral-700 dark:text-dark-text-tertiary dark:hover:text-dark-text-secondary transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <textarea
                ref={inputRef}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="请输入要保存的内容..."
                className="w-full p-3 border border-white/30 dark:border-dark-border-secondary/50 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-400/30 focus:border-brand-500/50 dark:focus:border-brand-400/50 outline-none text-neutral-800 dark:text-dark-text-primary min-h-[150px] backdrop-blur-sm transition-all duration-200"
              ></textarea>
            </div>
            <div className="p-4 glass-effect bg-white/60 dark:bg-dark-surface-secondary/60 border-t border-white/20 dark:border-dark-border-primary/30 flex justify-end space-x-3">
              <button 
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-white/30 dark:border-dark-border-secondary/50 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-hover/60 text-neutral-700 dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 transition-all duration-200 hover:scale-105"
              >
                取消
              </button>
              <button 
                onClick={handleSaveInput}
                disabled={!inputContent.trim() || isSaving}
                className={`px-4 py-2 rounded-lg text-white shadow-lg transition-all duration-200 hover:scale-105 ${
                  !inputContent.trim() || isSaving
                    ? 'bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed'
                    : 'glass-effect bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 shadow-brand-500/30 dark:shadow-glow-brand hover:shadow-xl'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </div>
                ) : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 