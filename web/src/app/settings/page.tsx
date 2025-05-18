'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import UnderConstruction from '@/components/ui/UnderConstruction';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-lg font-medium">设置</h1>
        <p className="text-sm text-gray-500">自定义您的ClipLink体验</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <UnderConstruction 
            title="设置功能" 
            description="我们正在开发全面的设置选项，让您可以根据个人偏好自定义ClipLink。敬请期待更多自定义选项！"
          />
        </div>
      </div>
    </MainLayout>
  );
} 