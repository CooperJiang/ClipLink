import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faGear, faCircleQuestion, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import DeviceTypeInfo from './DeviceTypeInfo';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 text-xl" />
          <h1 className="text-lg font-semibold">ClipFlow</h1>
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline-block">|</span>
        <span className="text-xs text-gray-400 hidden sm:inline-block">跨设备智能剪贴板</span>
      </div>
      <div className="flex items-center space-x-4">
        <DeviceTypeInfo />
        <button className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors">
          <FontAwesomeIcon icon={faGear} />
        </button>
        <button className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors">
          <FontAwesomeIcon icon={faCircleQuestion} />
        </button>
        <Link href="/login" className="relative inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors">
          <FontAwesomeIcon icon={faUserCircle} className="mr-1.5" />
          <span>登录</span>
        </Link>
      </div>
    </nav>
  );
} 