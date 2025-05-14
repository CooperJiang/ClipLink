import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faStar, 
  faClockRotateLeft, 
  faFolder, 
  faArrowRightFromBracket 
} from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="hidden md:flex flex-col w-16 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col items-center pt-6 gap-6">
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
        <NavItem 
          href="/categories" 
          icon={faFolder} 
          label="分类" 
          isActive={isActive('/categories')} 
        />
      </div>
      <div className="py-6 flex flex-col items-center">
        <NavItem 
          href="/sync" 
          icon={faArrowRightFromBracket} 
          label="同步" 
          isActive={isActive('/sync')} 
        />
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
      className={`flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} text-xs`}
    >
      <div className={`w-10 h-10 rounded-lg ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'} flex items-center justify-center mb-1`}>
        <FontAwesomeIcon icon={icon} className="text-lg" />
      </div>
      <span>{label}</span>
    </Link>
  );
} 