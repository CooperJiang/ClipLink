'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import AnimatedModal from '../ui/AnimatedModal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ClipLink 使用指南</h2>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800" style={{maxHeight: '60vh'}}>
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">什么是 ClipLink?</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                ClipLink 是一款强大的跨平台剪贴板内容同步工具，允许您在不同设备（手机、平板、电脑）间通过网页界面共享剪贴板内容。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                项目采用前后端分离架构，后端使用 Go 语言构建，数据通过 SQLite 存储并网络同步，前端使用 Next.js 和 React 构建。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">为什么需要 ClipLink?</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                在多设备环境下，我们经常需要在不同设备间共享剪贴板内容，传统方案往往繁琐且低效：
              </p>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                <li>需要登录微信、QQ等通讯工具，发送给自己或特定联系人</li>
                <li>依赖第三方云服务，隐私安全无法保障</li>
                <li>需要安装专用软件，增加系统负担</li>
                <li>操作复杂，打断工作流程</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                ClipLink 提供轻量、安全、高效的方式，让您在任何支持浏览器的设备上快速共享剪贴板内容。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">如何使用 ClipLink?</h3>
              <ol className="list-decimal pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                <li>首先<strong>建立通道</strong>：点击右上角的&ldquo;建立通道&rdquo;按钮，创建或加入已有通道</li>
                <li>在所有需要同步的设备上打开 ClipLink 并连接相同通道</li>
                <li>在大多数平台上（Windows/macOS/Android等），授权后剪贴板内容会自动读取和同步</li>
                <li>在 iOS 等平台，需要手动点击粘贴按钮或输入内容</li>
                <li>复制的内容会保存在历史记录中，可随时查看和重新使用</li>
              </ol>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">注意事项</h3>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                <li><strong className="text-red-600 dark:text-red-400">重要：</strong>为确保剪贴板权限正常获取，请确保通过 <strong>HTTPS</strong> 协议访问</li>
                <li>iOS 设备由于系统安全限制，需要手动粘贴内容，无法自动读取</li>
                <li>所有内容均通过通道 ID 加密传输，未授权设备无法访问您的内容</li>
                <li>您可以随时切换或断开通道连接，保护隐私安全</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">即将推出的功能</h3>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                <li>格式化文本支持 - 保留富文本格式</li>
                <li>代码片段优化 - 提供语法高亮和格式化</li>
                <li>内容分类与标签 - 对剪贴板内容分类整理</li>
                <li>图片粘贴支持 - 支持复制和粘贴图片</li>
                <li>端到端加密 - 增强数据传输和存储安全</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
} 