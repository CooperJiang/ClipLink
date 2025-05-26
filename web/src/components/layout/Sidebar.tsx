import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faStar, 
  faClockRotateLeft, 
  faFolder, 
  faGear
} from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleAddContent = () => {
    // 触发自定义事件，通知首页打开添加内容模态框
    const event = new Event('add-content-click');
    window.dispatchEvent(event);
  };

  const handleOpenSettings = () => {
    // 触发自定义事件，通知打开设置弹窗
    const event = new Event('open-settings');
    window.dispatchEvent(event);
  };

  return (
    <div className="hidden md:flex flex-col w-20 bg-white/95 dark:bg-dark-surface-primary/95 backdrop-blur-md border-r border-neutral-200 dark:border-dark-border-primary shadow-sm">
      <div className="flex-1 flex flex-col items-center pt-8 gap-6">
        <NavItem 
          href="/" 
          icon={faClipboardList} 
          label="剪贴板" 
          isActive={isActive('/')} 
        />
        <NavItem 
          href="/favorites" 
          icon={faStar} 
          label="收藏夹" 
          isActive={isActive('/favorites')} 
        />
        <NavItem 
          href="/history" 
          icon={faClockRotateLeft} 
          label="历史" 
          isActive={isActive('/history')} 
        />
        {/* <NavItem 
          href="/categories" 
          icon={faFolder} 
          label="分类" 
          isActive={isActive('/categories')} 
        /> */}
      </div>
      <div className="py-8 flex flex-col items-center">
        <button 
          onClick={handleOpenSettings}
          className="flex flex-col items-center text-neutral-500 dark:text-dark-text-tertiary hover:text-neutral-800 dark:hover:text-dark-text-secondary text-xs font-medium transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-dark-surface-hover border border-transparent hover:scale-105 hover:shadow-md glow-on-hover">
            <FontAwesomeIcon icon={faGear} className="text-lg group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <span>设置</span>
        </button>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center ${isActive ? 'text-brand-600 dark:text-brand-dark-400' : 'text-neutral-500 dark:text-dark-text-tertiary hover:text-neutral-800 dark:hover:text-dark-text-secondary'} text-xs font-medium transition-all duration-200`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-200 ${
        isActive 
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-dark-400 shadow-sm dark:shadow-glow-brand border border-brand-100 dark:border-brand-800/30 scale-105' 
          : 'hover:bg-neutral-100 dark:hover:bg-dark-surface-hover border border-transparent hover:border-neutral-200 dark:hover:border-dark-border-secondary hover:scale-105'
      }`}>
        <FontAwesomeIcon icon={icon} className="text-lg" />
      </div>
      <span>{label}</span>
    </Link>
  );
} 