// 设备ID工具类
export const deviceIdUtil = {
  // 本地存储key
  STORAGE_KEY: 'clipflow_device_id',
  
  // 生成随机的设备ID
  generateDeviceId: (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
  
  // 获取设备ID，如果不存在则创建一个新的
  getDeviceId: (): string => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      return 'server-side';
    }
    
    // 从localStorage获取设备ID
    let deviceId = typeof window !== 'undefined' ? localStorage.getItem(deviceIdUtil.STORAGE_KEY) : null;
    
    // 如果不存在，生成一个新的并保存
    if (!deviceId) {
      deviceId = deviceIdUtil.generateDeviceId();
      if (typeof window !== 'undefined') localStorage.setItem(deviceIdUtil.STORAGE_KEY, deviceId);
    }
    
    return deviceId;
  }
}; 