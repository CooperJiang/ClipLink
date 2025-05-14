import { DeviceType } from '@/types/clipboard';

/**
 * 检测当前设备类型
 * 简化版：只区分电脑和手机
 * @returns {DeviceType} 设备类型枚举值
 */
export function detectDeviceType(): DeviceType {
  // 只在客户端执行
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return DeviceType.OTHER;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 简化检测：只检查是否是移动设备
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent) || 
                   (window.innerWidth < 768); // 额外使用屏幕宽度判断
  
  if (isMobile) {
    return DeviceType.PHONE;
  } else {
    return DeviceType.DESKTOP;
  }
}

/**
 * 获取设备类型的本地化描述
 * @param {DeviceType} deviceType 设备类型
 * @returns {string} 设备类型的中文描述
 */
export function getDeviceTypeLabel(deviceType: DeviceType): string {
  switch (deviceType) {
    case DeviceType.DESKTOP:
      return '电脑';
    case DeviceType.PHONE:
      return '手机';
    case DeviceType.TABLET:
      return '平板';
    default:
      return '其他设备';
  }
} 