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
  faPlus
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
  onSaveManualInput?: (content: string) => Promise<boolean>;
  isIOSDevice?: boolean;
}

export default function CurrentClipboard({ 
  clipboard, 
  onCopy, 
  onEdit, 
  onRefresh,
  syncEnabled = true,
  hasPermission = false,
  onRequestPermission,
  onSaveManualInput,
  isIOSDevice = false
}: CurrentClipboardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // 添加点击外部区域关闭编辑框的功能
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      // 确保点击事件不是在容器内部
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancelEdit();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleCopy = async () => {
    if (!clipboard) return;
    
    try {
      await navigator.clipboard.writeText(clipboard.content);
      setCopied(true);
      onCopy();
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      showToast('复制失败', 'error');
    }
  };

  const handleContentClick = () => {
    if (!isEditing && hasPermission) {
      setIsEditing(true);
      setInputContent(clipboard?.content || '');
      // 等待DOM更新后聚焦输入框
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
      const success = await onSaveManualInput(inputContent);
      if (success) {
        setIsEditing(false);
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
    setInputContent('');
  };

  return (
    <div className="bg-white border-b p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center">
          <FontAwesomeIcon icon={faClipboard} className="text-blue-500 mr-2" />
          当前剪贴板
        </h2>
        <div className="flex items-center gap-2">
          {hasPermission ? (
            syncEnabled ? (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-xs text-green-700">
                <FontAwesomeIcon icon={faCheck} className="text-xs mr-1" />
                <span>自动同步已开启</span>
              </div>
            ) : (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                <FontAwesomeIcon icon={faLockOpen} className="text-xs mr-1" />
                <span>同步已关闭</span>
              </div>
            )
          ) : (
            <button 
              onClick={onRequestPermission}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-100 text-xs text-blue-800 hover:bg-blue-200 transition-colors"
            >
              <FontAwesomeIcon icon={faLock} className="text-xs mr-1.5" />
              {isIOSDevice ? (
                <span>点击读取剪贴板</span>
              ) : (
                <span>点击授权自动同步</span>
              )}
            </button>
          )}
          <button 
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50"
            onClick={onRefresh}
          >
            <FontAwesomeIcon icon={faRotate} />
          </button>
        </div>
      </div>
      
      <div className="flex sm:flex-row gap-3 h-20" ref={containerRef}>
        {isEditing ? (
          <div className="flex-grow bg-white rounded-lg border border-blue-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-transparent h-full overflow-hidden">
            <textarea
              ref={inputRef}
              className="w-full h-full p-3 resize-none outline-none text-sm scrollbar-none"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="输入或粘贴内容..."
              style={{ overflow: 'auto', maxHeight: '100%', lineHeight: '1.2' }}
            />
          </div>
        ) : (
          <div 
            className={`flex-grow bg-gray-50 rounded-lg p-3 h-full overflow-hidden border ${hasPermission ? 'cursor-pointer hover:bg-gray-100 border-gray-200' : 'border-gray-100'} transition-colors`}
            onClick={handleContentClick}
          >
            {!hasPermission ? (
              <p className="text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {isIOSDevice ? (
                  '在iOS上，您需要点击"读取剪贴板"按钮并确认系统弹出的粘贴确认。'
                ) : (
                  '需要授权才能自动同步剪贴板内容。授权后，您复制的内容将自动同步到此应用。'
                )}
              </p>
            ) : (
              <div className="flex items-center h-full">
                <p className="text-gray-700 text-sm flex-grow truncate">
                  {clipboard?.content || '剪贴板为空，点击此处手动添加内容...'}
                </p>
                {!clipboard?.content && (
                  <FontAwesomeIcon icon={faPlus} className="text-gray-400 ml-2 flex-shrink-0" />
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col justify-between h-full w-24 flex-shrink-0">
          {isEditing ? (
            <>
              <button 
                className="cursor-pointer transition-all bg-blue-500 text-white px-4 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px] flex items-center justify-center text-xs font-medium"
                onClick={handleSaveInput}
                disabled={isSaving || !inputContent.trim()}
              >
                <FontAwesomeIcon icon={faSave} className="mr-1.5" />
                {isSaving ? '保存中' : '保存'}
              </button>
              <button 
                className="cursor-pointer transition-all bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border-gray-300 border-b-[4px] hover:brightness-105 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-95 active:translate-y-[2px] flex items-center justify-center text-xs font-medium"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1.5" />
                取消
              </button>
            </>
          ) : (
            <>
              <button 
                className="cursor-pointer transition-all bg-blue-500 text-white px-4 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px] flex items-center justify-center text-xs font-medium"
                onClick={handleCopy}
                disabled={!clipboard || !hasPermission}
              >
                <FontAwesomeIcon icon={faCopy} className="mr-1.5" />
                {copied ? '已复制' : '复制'}
              </button>
              <button 
                className="cursor-pointer transition-all bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border-gray-300 border-b-[4px] hover:brightness-105 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-95 active:translate-y-[2px] flex items-center justify-center text-xs font-medium"
                onClick={onEdit}
                disabled={!clipboard || !hasPermission}
              >
                <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
                编辑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 