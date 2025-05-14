import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faFilter, 
  faArrowDownShortWide,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { ClipboardType } from '@/types/clipboard';

// 调整类型定义，与ClipboardType更好地对应
export type ClipboardFilterType = 'all' | ClipboardType | 'favorite';

interface TabBarProps {
  activeTab: ClipboardFilterType;
  onTabChange: (tab: ClipboardFilterType) => void;
  onFilterClick: () => void;
  onSortClick: () => void;
}

export default function TabBar({ 
  activeTab, 
  onTabChange, 
  onFilterClick, 
  onSortClick 
}: TabBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-2 md:px-4 flex items-center justify-between overflow-x-auto scrollbar-none">
      <div className="flex flex-nowrap">
        <TabButton 
          label="全部" 
          isActive={activeTab === 'all'} 
          onClick={() => onTabChange('all')} 
        />
        <TabButton 
          label="文本" 
          isActive={activeTab === ClipboardType.TEXT} 
          onClick={() => onTabChange(ClipboardType.TEXT)} 
        />
        <TabButton 
          label="链接" 
          isActive={activeTab === ClipboardType.LINK} 
          onClick={() => onTabChange(ClipboardType.LINK)} 
        />
        <TabButton 
          label="代码" 
          isActive={activeTab === ClipboardType.CODE} 
          onClick={() => onTabChange(ClipboardType.CODE)} 
          className="hidden md:block"
        />
        <TabButton 
          label={
            <div className="flex items-center whitespace-nowrap">
              <FontAwesomeIcon icon={faLock} className="text-gray-600 mr-1.5 text-xs" />
              <span>密码</span>
            </div>
          }
          isActive={activeTab === ClipboardType.PASSWORD} 
          onClick={() => onTabChange(ClipboardType.PASSWORD)} 
        />
        <TabButton 
          label={
            <div className="flex items-center whitespace-nowrap">
              <FontAwesomeIcon icon={faStar} className="text-amber-500 mr-1.5 text-xs" />
              <span>收藏</span>
            </div>
          }
          isActive={activeTab === 'favorite'} 
          onClick={() => onTabChange('favorite')} 
          className="hidden md:block"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button 
          className="p-1.5 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          onClick={onFilterClick}
        >
          <FontAwesomeIcon icon={faFilter} className="text-sm" />
        </button>
        <button 
          className="p-1.5 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          onClick={onSortClick}
        >
          <FontAwesomeIcon icon={faArrowDownShortWide} className="text-sm" />
        </button>
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string | React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

function TabButton({ label, isActive, onClick, className = '' }: TabButtonProps) {
  return (
    <button 
      className={`px-2 md:px-4 py-3 border-b-2 whitespace-nowrap ${
        isActive 
          ? 'border-blue-500 text-blue-700 font-medium' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      } text-sm ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
} 