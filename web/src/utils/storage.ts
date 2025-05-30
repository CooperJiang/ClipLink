/**
 * localStorage 封装工具类
 * 统一管理本地存储，提供类型安全和错误处理
 */

// 存储键名枚举
export enum StorageKeys {
  // 主题设置
  THEME = 'cliplink_theme',
  
  // 剪切板设置
  AUTO_READ_CLIPBOARD = 'cliplink_auto_read_clipboard',
  CONFIRM_BEFORE_SAVE = 'cliplink_confirm_before_save',
  HISTORY_RETENTION = 'cliplink_history_retention',
  AUTO_CLEAN_DUPLICATES = 'cliplink_auto_clean_duplicates',
  DETECT_SENSITIVE_CONTENT = 'cliplink_detect_sensitive_content',
  
  // 通知设置
  NEW_CONTENT_NOTIFICATION = 'cliplink_new_content_notification',
  ERROR_NOTIFICATION = 'cliplink_error_notification',
  
  // 安全设置
  LOCAL_ENCRYPTION = 'cliplink_local_encryption',
  
  // 其他
  LANGUAGE = 'cliplink_language',
}

// 默认值类型定义
export type StorageValue = string | number | boolean | object | null;

class Storage {
  /**
   * 设置存储值
   */
  set<T extends StorageValue>(key: StorageKeys | string, value: T): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const serializedValue = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  /**
   * 获取存储值
   */
  get<T extends StorageValue>(key: StorageKeys | string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined') return defaultValue;
      
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      // 尝试解析为JSON（对象类型）
      if (typeof defaultValue === 'object' && defaultValue !== null) {
        try {
          return JSON.parse(item) as T;
        } catch {
          return defaultValue;
        }
      }

      // 布尔值类型
      if (typeof defaultValue === 'boolean') {
        return (item === 'true') as T;
      }

      // 数字类型
      if (typeof defaultValue === 'number') {
        const num = Number(item);
        return (isNaN(num) ? defaultValue : num) as T;
      }

      // 字符串类型
      return item as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 移除存储项
   */
  remove(key: StorageKeys | string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  /**
   * 清空所有存储
   */
  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  has(key: StorageKeys | string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  }

  /**
   * 获取所有以指定前缀开头的键值对
   */
  getByPrefix(prefix: string): Record<string, any> {
    try {
      if (typeof window === 'undefined') return {};
      
      const result: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            try {
              result[key] = JSON.parse(value);
            } catch {
              result[key] = value;
            }
          }
        }
      }
      return result;
    } catch (error) {
      console.error('Storage getByPrefix error:', error);
      return {};
    }
  }

  /**
   * 批量设置
   */
  setBatch(items: Record<string, StorageValue>): boolean {
    try {
      for (const [key, value] of Object.entries(items)) {
        this.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Storage setBatch error:', error);
      return false;
    }
  }
}

// 导出单例实例
export const storage = new Storage();

// 便捷方法
export default storage; 