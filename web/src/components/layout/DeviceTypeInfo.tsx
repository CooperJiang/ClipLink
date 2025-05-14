import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDesktop, 
  faMobilePhone, 
  faTabletScreenButton, 
  faQuestion 
} from '@fortawesome/free-solid-svg-icons';
import { DeviceType } from '@/types/clipboard';
import { detectDeviceType, getDeviceTypeLabel } from '@/utils/deviceDetection';

export default function DeviceTypeInfo() {
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.OTHER);
  
  useEffect(() => {
    // 客户端环境检测设备类型
    if (typeof window !== 'undefined') {
      setDeviceType(detectDeviceType());
      
      // 监听窗口大小变化，因为可能会影响设备类型检测
      const handleResize = () => {
        setDeviceType(detectDeviceType());
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  // 获取设备类型图标
  const getDeviceIcon = () => {
    switch (deviceType) {
      case DeviceType.DESKTOP:
        return <FontAwesomeIcon icon={faDesktop} />;
      case DeviceType.PHONE:
        return <FontAwesomeIcon icon={faMobilePhone} />;
      case DeviceType.TABLET:
        return <FontAwesomeIcon icon={faTabletScreenButton} />;
      default:
        return <FontAwesomeIcon icon={faQuestion} />;
    }
  };
  
  return (
    <div className="flex items-center space-x-1 text-sm text-gray-500">
      <span className="mr-1">{getDeviceIcon()}</span>
      <span>{getDeviceTypeLabel(deviceType)}</span>
    </div>
  );
}