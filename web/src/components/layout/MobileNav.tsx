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
    <div className="md:hidden bg-white border-t border-gray-200 grid grid-cols-4 gap-1 p-1">
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
      className={`flex flex-col items-center py-2 ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} text-xs`}
    >
      <FontAwesomeIcon icon={icon} className="text-lg mb-1" />
      <span>{label}</span>
    </Link>
  );
} 