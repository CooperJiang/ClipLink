'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import UnderConstruction from '@/components/ui/UnderConstruction';

export default function CategoriesPage() {
  return (
    <MainLayout>
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-lg font-medium">内容分类</h1>
        <p className="text-sm text-gray-500">按类型组织和管理您的剪贴板内容</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <UnderConstruction 
            title="内容分类功能" 
            description="我们正在开发强大的内容分类功能，让您可以更轻松地组织和查找剪贴板内容。此功能将很快上线！"
          />
        </div>
      </div>
    </MainLayout>
  );
} 