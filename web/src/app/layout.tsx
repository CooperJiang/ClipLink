'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { config } from '@fortawesome/fontawesome-svg-core';
// 注释掉有问题的直接样式导入
// import '@fortawesome/fontawesome-svg-core/styles.css';
import { ToastProvider } from "@/contexts/ToastContext";
import { ChannelProvider } from "@/contexts/ChannelContext";
import DeviceRegistration from "@/components/device/DeviceRegistration";

// 防止fontawesome图标闪烁，这个设置会内联样式，无需外部CSS
config.autoAddCss = true;

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

// 由于使用'use client'，metadata需要在另一个文件定义
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          body {
            animation: fadeIn 0.4s ease-in-out;
            background-color: #f9fafb; /* 浅色模式背景 */
          }
          
          /* 暗色模式支持 */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111827; /* 暗色模式背景 - 对应 Tailwind gray-900 */
              color: #f3f4f6; /* 暗色模式文字颜色 */
            }
          }
          
          /* 当HTML元素有dark类时的暗色模式支持 */
          html.dark body {
            background-color: #111827 !important; /* 暗色模式背景 */
            color: #f3f4f6; /* 暗色模式文字颜色 */
          }
          
          /* 添加一些重要UI元素的基础样式，以防Tailwind加载延迟 */
          .bg-white {
            background-color: white !important;
          }
          
          html.dark .bg-white {
            background-color: #1f2937 !important; /* 暗色模式下的"白色"背景 */
          }
          
          button {
            transition: all 0.2s ease;
          }
        `}</style>
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <ToastProvider>
          <ChannelProvider>
            {/* 设备注册组件（不可见） */}
            <DeviceRegistration />
          {children}
          </ChannelProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
