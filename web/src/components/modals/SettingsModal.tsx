'use client';

import { useState, useEffect } from 'react';
import AnimatedModal from '../ui/AnimatedModal';
import { Settings, settingsManager, ThemeMode, HistoryRetention, Language } from '@/utils/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(settingsManager.getSettings());

  // 监听设置变化
  useEffect(() => {
    const handleSettingsChange = (newSettings: Settings) => {
      setSettings(newSettings);
    };

    settingsManager.addListener(handleSettingsChange);
    
    return () => {
      settingsManager.removeListener(handleSettingsChange);
    };
  }, []);

  // 重新加载设置（当弹窗打开时）
  useEffect(() => {
    if (isOpen) {
      setSettings(settingsManager.getSettings());
    }
  }, [isOpen]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settingsManager.setSetting(key, value);
  };

  const handleSave = () => {
    onClose();
  };

  const handleReset = () => {
    settingsManager.resetSettings();
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="glass-effect bg-white/95 dark:bg-dark-surface-primary/95 backdrop-blur-xl rounded-2xl overflow-hidden max-w-xl w-full mx-auto shadow-2xl dark:shadow-dark-xl border border-white/20 dark:border-dark-border-primary/30">
        {/* 头部 */}
        <div className="relative glass-effect bg-gradient-to-r from-brand-50/80 to-brand-100/60 dark:from-brand-900/20 dark:to-brand-800/10 border-b border-white/20 dark:border-dark-border-primary/30 px-6 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 flex items-center justify-center mr-3 shadow-md dark:shadow-glow-brand">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-dark-text-primary font-display">设置</h2>
              <p className="text-xs text-neutral-600 dark:text-dark-text-tertiary">个性化你的剪切板体验</p>
            </div>
          </div>
          
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-secondary/60 text-neutral-500 dark:text-dark-text-tertiary hover:text-neutral-700 dark:hover:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 transition-all duration-200 shadow-sm border border-white/30 dark:border-dark-border-secondary/50 glow-on-hover"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* 基础设置 */}
          <div className="space-y-4">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-2 shadow-sm">
                <span className="text-white text-xs">🎨</span>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-dark-text-primary">基础设置</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-dark-text-secondary mb-1.5">
                  主题模式
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value as ThemeMode)}
                  className="w-full rounded-lg border border-neutral-200/50 dark:border-dark-border-secondary/50 px-3 py-2 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 text-sm text-neutral-900 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-400/30 focus:border-brand-500/50 dark:focus:border-brand-400/50 transition-all duration-200"
                >
                  <option value="light">明亮模式</option>
                  <option value="dark">暗色模式</option>
                  <option value="system">跟随系统</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-dark-text-secondary mb-1.5">
                  界面语言
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value as Language)}
                  className="w-full rounded-lg border border-neutral-200/50 dark:border-dark-border-secondary/50 px-3 py-2 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 text-sm text-neutral-900 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-400/30 focus:border-brand-500/50 dark:focus:border-brand-400/50 transition-all duration-200"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* 剪切板设置 */}
          <div className="space-y-4">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-2 shadow-sm">
                <span className="text-white text-xs">📋</span>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-dark-text-primary">剪切板设置</h3>
            </div>
            
            {/* 新增配置项 */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  key: 'autoReadClipboard', 
                  label: '自动读取剪切板', 
                  desc: '开启后，打开当前网站自动读取剪切板内容上传'
                },
                { 
                  key: 'confirmBeforeSave', 
                  label: '读取后确认', 
                  desc: '如果开启，剪切板读取到新内容会弹窗提示确认是否上传'
                },
              ].map((item) => (
                <div key={item.key} className="glass-effect bg-white/40 dark:bg-dark-surface-tertiary/40 rounded-lg p-3 border border-white/30 dark:border-dark-border-secondary/30 hover:bg-white/50 dark:hover:bg-dark-surface-hover/50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-0.5">
                        <label className="text-xs font-medium text-neutral-700 dark:text-dark-text-secondary">
                          {item.label}
                        </label>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-dark-text-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting(item.key as keyof Settings, !settings[item.key as keyof Settings])}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ml-3 ${
                        settings[item.key as keyof Settings] 
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 shadow-md dark:shadow-glow-brand' 
                          : 'bg-neutral-200/80 dark:bg-dark-surface-quaternary/80'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          settings[item.key as keyof Settings] ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-dark-text-secondary mb-1.5">
                历史记录保留时间
              </label>
              <select
                value={settings.historyRetention}
                onChange={(e) => updateSetting('historyRetention', e.target.value as HistoryRetention)}
                className="w-full rounded-lg border border-neutral-200/50 dark:border-dark-border-secondary/50 px-3 py-2 glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 text-sm text-neutral-900 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-400/30 focus:border-brand-500/50 dark:focus:border-brand-400/50 transition-all duration-200"
              >
                <option value="7days">7天</option>
                <option value="30days">30天</option>
                <option value="90days">90天</option>
                <option value="forever">永久保存</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'autoCleanDuplicates', label: '自动清理重复内容', desc: '自动删除相同的剪切板内容，保持列表整洁' },
                { key: 'detectSensitiveContent', label: '敏感内容检测', desc: '自动识别并标记密码等敏感信息' },
              ].map((item) => (
                <div key={item.key} className="glass-effect bg-white/40 dark:bg-dark-surface-tertiary/40 rounded-lg p-3 border border-white/30 dark:border-dark-border-secondary/30 hover:bg-white/50 dark:hover:bg-dark-surface-hover/50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-0.5">
                        <label className="text-xs font-medium text-neutral-700 dark:text-dark-text-secondary">
                          {item.label}
                        </label>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-dark-text-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting(item.key as keyof Settings, !settings[item.key as keyof Settings])}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ml-3 ${
                        settings[item.key as keyof Settings] 
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 shadow-md dark:shadow-glow-brand' 
                          : 'bg-neutral-200/80 dark:bg-dark-surface-quaternary/80'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          settings[item.key as keyof Settings] ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 通知与安全 */}
          <div className="space-y-4">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-2 shadow-sm">
                <span className="text-white text-xs">🔔</span>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-dark-text-primary">通知与安全</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'newContentNotification', label: '新内容通知', desc: '有新的剪切板内容时显示通知' },
                { key: 'errorNotification', label: '错误通知', desc: '发生错误时显示通知提醒' },
                { key: 'localEncryption', label: '本地数据加密', desc: '在本地设备上加密存储剪切板数据' },
              ].map((item) => (
                <div key={item.key} className="glass-effect bg-white/40 dark:bg-dark-surface-tertiary/40 rounded-lg p-3 border border-white/30 dark:border-dark-border-secondary/30 hover:bg-white/50 dark:hover:bg-dark-surface-hover/50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-0.5">
                        <label className="text-xs font-medium text-neutral-700 dark:text-dark-text-secondary">
                          {item.label}
                        </label>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-dark-text-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting(item.key as keyof Settings, !settings[item.key as keyof Settings])}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ml-3 ${
                        settings[item.key as keyof Settings] 
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 shadow-md dark:shadow-glow-brand' 
                          : 'bg-neutral-200/80 dark:bg-dark-surface-quaternary/80'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          settings[item.key as keyof Settings] ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 其他操作 */}
          <div className="pt-3 border-t border-white/20 dark:border-dark-border-secondary/30">
            <button
              onClick={() => {
                if (confirm('确定要重置所有设置为默认值吗？')) {
                  handleReset();
                }
              }}
              className="px-3 py-2 rounded-lg glass-effect bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md hover:scale-105"
            >
              重置为默认设置
            </button>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="glass-effect bg-white/60 dark:bg-dark-surface-secondary/60 border-t border-white/20 dark:border-dark-border-primary/30 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg glass-effect bg-white/60 dark:bg-dark-surface-tertiary/60 border border-white/30 dark:border-dark-border-secondary/30 text-neutral-700 dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface-hover/80 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:scale-105"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-dark-400 dark:to-brand-dark-600 hover:from-brand-600 hover:to-brand-700 dark:hover:from-brand-dark-500 dark:hover:to-brand-dark-700 text-white transition-all duration-200 text-sm font-medium shadow-md dark:shadow-glow-brand hover:shadow-lg hover:scale-105 glow-on-hover"
          >
            保存设置
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
} 