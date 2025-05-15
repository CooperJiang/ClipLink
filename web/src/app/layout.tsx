'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { config } from '@fortawesome/fontawesome-svg-core';
// 注释掉有问题的直接样式导入
// import '@fortawesome/fontawesome-svg-core/styles.css';
import { ToastProvider } from "@/contexts/ToastContext";
import { ChannelProvider } from "@/contexts/ChannelContext";

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
            background-color: #f9fafb; /* 设置与Tailwind bg-gray-50相同的背景色 */
          }
          
          /* 添加一些重要UI元素的基础样式，以防Tailwind加载延迟 */
          .bg-white {
            background-color: white !important;
          }
          
          button {
            transition: all 0.2s ease;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <ChannelProvider>
          {children}
          </ChannelProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
