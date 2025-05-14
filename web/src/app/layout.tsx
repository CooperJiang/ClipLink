'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { config } from '@fortawesome/fontawesome-svg-core';
// 注释掉有问题的直接样式导入
// import '@fortawesome/fontawesome-svg-core/styles.css';
import { ToastProvider } from "@/contexts/ToastContext";

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
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
