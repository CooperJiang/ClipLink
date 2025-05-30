import { storage, StorageKeys } from './storage';

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system';

// 历史记录保留时间
export type HistoryRetention = '7days' | '30days' | '90days' | 'forever';

// 语言类型
export type Language = 'zh-CN' | 'en-US';

// 设置接口
export interface Settings {
  // 基础设置
  theme: ThemeMode;
  language: Language;
  
  // 剪切板设置
  autoReadClipboard: boolean;           // 是否自动读取剪切板
  confirmBeforeSave: boolean;           // 是否自动读取后确认
  historyRetention: HistoryRetention;
  autoCleanDuplicates: boolean;
  detectSensitiveContent: boolean;
  
  // 通知设置
  newContentNotification: boolean;
  errorNotification: boolean;
  
  // 安全设置
  localEncryption: boolean;
}

// 默认设置
export const defaultSettings: Settings = {
  theme: 'system',
  language: 'zh-CN',
  autoReadClipboard: true,              // 默认开启自动读取
  confirmBeforeSave: false,             // 默认关闭确认
  historyRetention: '30days',
  autoCleanDuplicates: true,
  detectSensitiveContent: true,
  newContentNotification: true,
  errorNotification: true,
  localEncryption: true,
};

// 设置管理类
class SettingsManager {
  private _settings: Settings;
  private _listeners: ((settings: Settings) => void)[] = [];

  constructor() {
    this._settings = this.loadSettings();
  }

  /**
   * 加载设置
   */
  private loadSettings(): Settings {
    return {
      theme: storage.get(StorageKeys.THEME, defaultSettings.theme),
      language: storage.get(StorageKeys.LANGUAGE, defaultSettings.language),
      autoReadClipboard: storage.get(StorageKeys.AUTO_READ_CLIPBOARD, defaultSettings.autoReadClipboard),
      confirmBeforeSave: storage.get(StorageKeys.CONFIRM_BEFORE_SAVE, defaultSettings.confirmBeforeSave),
      historyRetention: storage.get(StorageKeys.HISTORY_RETENTION, defaultSettings.historyRetention),
      autoCleanDuplicates: storage.get(StorageKeys.AUTO_CLEAN_DUPLICATES, defaultSettings.autoCleanDuplicates),
      detectSensitiveContent: storage.get(StorageKeys.DETECT_SENSITIVE_CONTENT, defaultSettings.detectSensitiveContent),
      newContentNotification: storage.get(StorageKeys.NEW_CONTENT_NOTIFICATION, defaultSettings.newContentNotification),
      errorNotification: storage.get(StorageKeys.ERROR_NOTIFICATION, defaultSettings.errorNotification),
      localEncryption: storage.get(StorageKeys.LOCAL_ENCRYPTION, defaultSettings.localEncryption),
    };
  }

  /**
   * 获取所有设置
   */
  getSettings(): Settings {
    return { ...this._settings };
  }

  /**
   * 获取单个设置
   */
  getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this._settings[key];
  }

  /**
   * 更新单个设置
   */
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this._settings[key] = value;
    this.saveSettingToStorage(key, value);
    this.notifyListeners();
  }

  /**
   * 批量更新设置
   */
  updateSettings(updates: Partial<Settings>): void {
    Object.entries(updates).forEach(([key, value]) => {
      if (key in this._settings) {
        (this._settings as any)[key] = value;
        this.saveSettingToStorage(key as keyof Settings, value);
      }
    });
    this.notifyListeners();
  }

  /**
   * 重置为默认设置
   */
  resetSettings(): void {
    this._settings = { ...defaultSettings };
    this.saveAllSettings();
    this.notifyListeners();
  }

  /**
   * 保存单个设置到存储
   */
  private saveSettingToStorage<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const storageKeyMap: Record<keyof Settings, StorageKeys> = {
      theme: StorageKeys.THEME,
      language: StorageKeys.LANGUAGE,
      autoReadClipboard: StorageKeys.AUTO_READ_CLIPBOARD,
      confirmBeforeSave: StorageKeys.CONFIRM_BEFORE_SAVE,
      historyRetention: StorageKeys.HISTORY_RETENTION,
      autoCleanDuplicates: StorageKeys.AUTO_CLEAN_DUPLICATES,
      detectSensitiveContent: StorageKeys.DETECT_SENSITIVE_CONTENT,
      newContentNotification: StorageKeys.NEW_CONTENT_NOTIFICATION,
      errorNotification: StorageKeys.ERROR_NOTIFICATION,
      localEncryption: StorageKeys.LOCAL_ENCRYPTION,
    };

    const storageKey = storageKeyMap[key];
    if (storageKey) {
      storage.set(storageKey, value);
    }
  }

  /**
   * 保存所有设置
   */
  private saveAllSettings(): void {
    Object.entries(this._settings).forEach(([key, value]) => {
      this.saveSettingToStorage(key as keyof Settings, value);
    });
  }

  /**
   * 添加设置变更监听器
   */
  addListener(listener: (settings: Settings) => void): void {
    this._listeners.push(listener);
  }

  /**
   * 移除设置变更监听器
   */
  removeListener(listener: (settings: Settings) => void): void {
    const index = this._listeners.indexOf(listener);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this._listeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }
}

// 导出单例实例
export const settingsManager = new SettingsManager();

// 便捷方法
export default settingsManager; 