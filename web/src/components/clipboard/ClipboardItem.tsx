import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar as faStarSolid,
  faLink,
  faPenToSquare,
  faTrashCan,
  faLock,
  faImage,
  faFile,
  faDesktop,
  faMobilePhone,
  faTabletScreenButton,
  faQuestion
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular, faCopy } from '@fortawesome/free-regular-svg-icons';
import { ClipboardItem as ClipboardItemType, ClipboardType, DeviceType } from '@/types/clipboard';
import { useToast } from '@/contexts/ToastContext';
import { formatClipboardContent } from '@/utils/clipboardHelpers';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { detectLanguage } from '@/utils/codeHelper';

interface ClipboardItemProps {
  item: ClipboardItemType;
  onCopy: (item: ClipboardItemType) => void;
  onEdit: (item: ClipboardItemType) => void;
  onDelete: (item: ClipboardItemType) => void;
  onToggleFavorite: (item: ClipboardItemType) => void;
}

export default function ClipboardItemCard({ 
  item, 
  onCopy, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}: ClipboardItemProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  
  // 预先计算代码语言，避免重复计算
  const codeLanguage = item.type === ClipboardType.CODE ? detectLanguage(item.content) : '';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      onCopy(item);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      showToast('复制失败', 'error');
    }
  };

  // 格式化日期 - 修改formatDate函数，使其支持不同的日期格式属性
  const formatDate = (item: ClipboardItemType) => {
    try {
      // 选择合适的日期属性，优先使用created_at
      const dateString = item.created_at || item.createdAt || '';
      
      // 处理带有时区信息的ISO格式日期
      // 例如 "2025-05-14T18:10:59.325974+08:00"
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return '日期未知';
      }
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-');
    } catch (error) {
      return '日期未知';
    }
  };

  // 根据设备类型获取图标
  const getDeviceIcon = () => {
    switch (item.device_type) {
      case DeviceType.DESKTOP:
        return <FontAwesomeIcon icon={faDesktop} className="text-gray-600" />;
      case DeviceType.PHONE:
        return <FontAwesomeIcon icon={faMobilePhone} className="text-gray-600" />;
      case DeviceType.TABLET:
        return <FontAwesomeIcon icon={faTabletScreenButton} className="text-gray-600" />;
      default:
        return <FontAwesomeIcon icon={faQuestion} className="text-gray-400" />;
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case ClipboardType.CODE:
        return (
          <div className="bg-gray-900 h-24 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <SyntaxHighlighter
                language={codeLanguage}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  padding: '8px',
                  fontSize: '0.75rem',
                  backgroundColor: 'transparent',
                  height: 'auto',
                  minHeight: '100%',
                }}
                wrapLines={true}
                wrapLongLines={true}
                showLineNumbers={true}
                lineNumberStyle={{ opacity: 0.4, minWidth: '2.5em', paddingRight: '0.5em' }}
              >
                {item.content}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      case ClipboardType.LINK:
        return (
          <div className="p-3 bg-white h-24 overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                <FontAwesomeIcon icon={faLink} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-600 truncate">{item.title || '链接'}</p>
                <p className="text-xs text-gray-500 truncate">{item.content}</p>
              </div>
            </div>
          </div>
        );
      case ClipboardType.PASSWORD:
        return (
          <div className="p-3 bg-white h-24 overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title || '密码'}</p>
                <div className="flex items-center mt-1">
                  <p className="text-xs text-gray-500 font-mono">
                    {showPassword ? item.content : '•'.repeat(Math.min(20, item.content.length))}
                  </p>
                  <button 
                    className="ml-2 text-xs text-blue-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case ClipboardType.IMAGE:
        return (
          <div className="p-3 bg-white h-24 overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                <FontAwesomeIcon icon={faImage} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title || '图片'}</p>
                <p className="text-xs text-gray-500 truncate">图片链接: {item.content}</p>
              </div>
            </div>
          </div>
        );
      case ClipboardType.FILE:
        return (
          <div className="p-3 bg-white h-24 overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                <FontAwesomeIcon icon={faFile} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title || '文件'}</p>
                <p className="text-xs text-gray-500 truncate">文件路径: {item.content}</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-3 bg-white h-24 overflow-y-auto">
            <p className="text-sm text-gray-600">{item.content}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-soft overflow-hidden hover:shadow-medium transition-shadow group flex flex-col h-[180px]">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2" title={`设备: ${item.device_type || '未知'}`}>
            {getDeviceIcon()}
          </span>
          <h3 className="font-medium text-sm line-clamp-1">{item.title || '未命名'}</h3>
        </div>
        <div className="flex items-center">
          <button 
            className={`p-1 ${item.isFavorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`}
            onClick={() => onToggleFavorite(item)}
          >
            <FontAwesomeIcon icon={item.isFavorite ? faStarSolid : faStarRegular} className="text-xs" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      <div className="p-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between mt-auto">
        <span>{formatDate(item)}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="p-1 hover:text-blue-600" 
            title={copied ? '已复制' : '复制'}
            onClick={handleCopy}
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
          <button 
            className="p-1 hover:text-gray-800" 
            title="编辑"
            onClick={() => onEdit(item)}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button 
            className="p-1 hover:text-red-600" 
            title="删除"
            onClick={() => onDelete(item)}
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      </div>
    </div>
  );
} 