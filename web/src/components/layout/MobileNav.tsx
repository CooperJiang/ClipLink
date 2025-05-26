import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faStar, 
  faClockRotateLeft, 
  faGear 
} from '@fortawesome/free-solid-svg-icons';

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="md:hidden bg-white/95 dark:bg-dark-surface-primary/95 backdrop-blur-md border-t border-neutral-200 dark:border-dark-border-primary grid grid-cols-4 gap-1 p-1 shadow-sm dark:shadow-dark-sm">
      <MobileNavItem 
        href="/" 
        icon={faClipboardList} 
        label="剪贴板" 
        isActive={isActive('/')} 
      />
      <MobileNavItem 
        href="/favorites" 
        icon={faStar} 
        label="收藏夹" 
        isActive={isActive('/favorites')} 
      />
      <MobileNavItem 
        href="/history" 
        icon={faClockRotateLeft} 
        label="历史" 
        isActive={isActive('/history')} 
      />
      <MobileNavItem 
        href="/settings" 
        icon={faGear} 
        label="设置" 
        isActive={isActive('/settings')} 
      />
    </div>
  );
}

interface MobileNavItemProps {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
}

function MobileNavItem({ href, icon, label, isActive }: MobileNavItemProps) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center py-2 transition-all duration-200 rounded-lg ${
        isActive 
          ? 'text-brand-600 dark:text-brand-dark-400 bg-brand-50/50 dark:bg-brand-900/20 shadow-sm dark:shadow-glow-brand' 
          : 'text-neutral-400 dark:text-dark-text-tertiary hover:text-neutral-600 dark:hover:text-dark-text-secondary hover:bg-neutral-100/50 dark:hover:bg-dark-surface-hover/50'
      } text-xs`}
    >
      <FontAwesomeIcon icon={icon} className="text-lg mb-1" />
      <span>{label}</span>
    </Link>
  );
} 