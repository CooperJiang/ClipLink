import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboard, 
  faCheck, 
  faRotate, 
  faCopy, 
  faPenToSquare,
  faLock,
  faLockOpen
} from '@fortawesome/free-solid-svg-icons';
import { ClipboardItem } from '@/types/clipboard';
import { useToast } from '@/contexts/ToastContext';

interface CurrentClipboardProps {
  clipboard?: ClipboardItem;
  onCopy: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  syncEnabled: boolean;
  hasPermission: boolean;
  onRequestPermission: () => void;
}

export default function CurrentClipboard({ 
  clipboard, 
  onCopy, 
  onEdit, 
  onRefresh,
  syncEnabled = true,
  hasPermission = false,
  onRequestPermission
}: CurrentClipboardProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

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
      console.error('复制到剪贴板失败:', err);
      showToast('复制失败', 'error');
    }
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
              <span>点击授权自动同步</span>
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
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-grow bg-gray-50 rounded-lg p-3 max-h-20 overflow-hidden border border-gray-100">
          {!hasPermission ? (
            <p className="text-gray-500 text-sm">
              需要授权才能自动同步剪贴板内容。授权后，您复制的内容将自动同步到此应用。
              <br />
              <span className="text-xs text-gray-400">请点击上方的&ldquo;点击授权自动同步&rdquo;按钮来启用自动同步功能。</span>
            </p>
          ) : (
            <p className="text-gray-700 text-sm">
              {clipboard?.content || '剪贴板为空，复制任意内容将自动同步到这里...'}
            </p>
          )}
        </div>
        <div className="flex sm:flex-col justify-end gap-2 sm:w-auto">
          <button 
            className="btn-primary"
            onClick={handleCopy}
            disabled={!clipboard || !hasPermission}
          >
            <FontAwesomeIcon icon={faCopy} className="mr-1.5" />
            {copied ? '已复制' : '复制'}
          </button>
          <button 
            className="btn-secondary"
            onClick={onEdit}
            disabled={!clipboard || !hasPermission}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
            编辑
          </button>
        </div>
      </div>
    </div>
  );
} 