import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faDesktop, 
  faMobilePhone,
  faFont, 
  faLink, 
  faCode, 
  faLock, 
  faImage, 
  faFile,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ClipboardItem, ClipboardType, DeviceType, SaveClipboardRequest } from '@/types/clipboard';
import { detectDeviceType } from '@/utils/deviceDetection';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { detectLanguage } from '@/utils/codeHelper';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveClipboardRequest) => Promise<void>;
  initialData?: ClipboardItem;
}

export default function EditModal({ isOpen, onClose, onSave, initialData }: EditModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<ClipboardType>(ClipboardType.TEXT);
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.DESKTOP);
  const [previewMode, setPreviewMode] = useState(false);
  const codeLanguage = type === ClipboardType.CODE ? detectLanguage(content) : '';

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content);
      setIsFavorite(initialData.isFavorite);
      setType(initialData.type);
      setDeviceType(initialData.device_type || detectDeviceType());
      setVisible(true);
    } else {
      setTitle('');
      setContent('');
      setIsFavorite(false);
      setType(ClipboardType.TEXT);
      setDeviceType(detectDeviceType());
      setVisible(true);
    }
  }, [initialData, isOpen]);

  // 检测内容类型
  const detectContentType = (content: string): ClipboardType => {
    if (!content.trim()) return ClipboardType.TEXT;
    
    if (content.startsWith('http://') || content.startsWith('https://')) {
      return ClipboardType.LINK;
    } else if (
      content.includes('{') || 
      content.includes('}') || 
      content.includes('function') || 
      content.includes('class') ||
      (content.includes('<') && content.includes('>'))
    ) {
      return ClipboardType.CODE;
    }
    
    return ClipboardType.TEXT;
  };

  // 当内容变化时，自动检测类型
  useEffect(() => {
    if (!initialData) {
      setType(detectContentType(content));
    }
  }, [content, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        title: title.trim() || undefined,
        content: content.trim(),
        isFavorite,
        type,
        device_type: deviceType
      });
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染内容编辑区域
  const renderContentEditor = () => {
    if (type === ClipboardType.CODE && previewMode) {
      return (
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-1 bg-gray-100 border-b border-gray-300">
            <span className="text-xs text-gray-500 ml-2">{codeLanguage}</span>
            <button
              type="button"
              className="p-1 text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setPreviewMode(false)}
            >
              <FontAwesomeIcon icon={faEyeSlash} className="mr-1" />
              <span>编辑模式</span>
            </button>
          </div>
          <div className="h-56 overflow-y-auto custom-scrollbar bg-gray-900">
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
              {content}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <textarea 
          id="edit-content" 
          rows={type === ClipboardType.CODE ? 10 : 6} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          placeholder="请输入内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        {type === ClipboardType.CODE && (
          <button
            type="button"
            className="absolute top-2 right-2 p-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 hover:text-gray-800 focus:outline-none flex items-center"
            onClick={() => setPreviewMode(true)}
          >
            <FontAwesomeIcon icon={faEye} className="mr-1" />
            <span>预览</span>
          </button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">编辑剪贴板内容</h3>
          <button 
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input 
                type="text" 
                id="edit-title" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="请输入标题(可选)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">内容类型</label>
              <div className="flex flex-wrap gap-2">
                <TypeButton 
                  type={ClipboardType.TEXT} 
                  currentType={type} 
                  icon={faFont} 
                  label="文本" 
                  onClick={setType} 
                />
                <TypeButton 
                  type={ClipboardType.LINK} 
                  currentType={type} 
                  icon={faLink} 
                  label="链接" 
                  onClick={setType} 
                />
                <TypeButton 
                  type={ClipboardType.CODE} 
                  currentType={type} 
                  icon={faCode} 
                  label="代码" 
                  onClick={setType} 
                />
                <TypeButton 
                  type={ClipboardType.PASSWORD} 
                  currentType={type} 
                  icon={faLock} 
                  label="密码" 
                  onClick={setType} 
                />
                <TypeButton 
                  type={ClipboardType.IMAGE} 
                  currentType={type} 
                  icon={faImage} 
                  label="图片" 
                  onClick={setType} 
                />
                <TypeButton 
                  type={ClipboardType.FILE} 
                  currentType={type} 
                  icon={faFile} 
                  label="文件" 
                  onClick={setType} 
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
              <div className="flex gap-2">
                <DeviceTypeButton 
                  type={DeviceType.DESKTOP} 
                  currentType={deviceType} 
                  icon={faDesktop} 
                  label="电脑" 
                  onClick={setDeviceType} 
                />
                <DeviceTypeButton 
                  type={DeviceType.PHONE} 
                  currentType={deviceType} 
                  icon={faMobilePhone} 
                  label="手机" 
                  onClick={setDeviceType} 
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              {renderContentEditor()}
            </div>
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <input 
                  type="checkbox" 
                  id="edit-favorite" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                />
                <label htmlFor="edit-favorite" className="ml-2 text-sm text-gray-700">添加到收藏</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edit-visible" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />
                <label htmlFor="edit-visible" className="ml-2 text-sm text-gray-700">内容可见</label>
                <span className="ml-1 text-xs text-gray-500">(隐藏时需要标题)</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none"
                onClick={onClose}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? '保存中...' : '保存更改'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// 类型选择按钮组件
interface TypeButtonProps {
  type: ClipboardType;
  currentType: ClipboardType;
  icon: IconDefinition;
  label: string;
  onClick: (type: ClipboardType) => void;
}

function TypeButton({ type, currentType, icon, label, onClick }: TypeButtonProps) {
  const isActive = type === currentType;
  
  return (
    <button 
      type="button"
      className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
        isActive 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => onClick(type)}
    >
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </button>
  );
}

// 设备类型选择按钮组件
interface DeviceTypeButtonProps {
  type: DeviceType;
  currentType: DeviceType;
  icon: IconDefinition;
  label: string;
  onClick: (type: DeviceType) => void;
}

function DeviceTypeButton({ type, currentType, icon, label, onClick }: DeviceTypeButtonProps) {
  const isActive = type === currentType;
  
  return (
    <button 
      type="button"
      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
        isActive 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => onClick(type)}
    >
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </button>
  );
} 