import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

// 添加检测iOS设备的辅助函数
const isIOS = () => {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
};

interface UseClipboardPermissionProps {
  onPermissionChange?: (hasPermission: boolean) => void;
}

interface UseClipboardPermissionReturn {
  hasClipboardPermission: boolean;
  syncEnabled: boolean;
  isIOSDevice: boolean;
  requestClipboardPermission: () => Promise<string | undefined>;
  checkClipboardPermission: () => Promise<boolean>;
}

export const useClipboardPermission = ({ 
  onPermissionChange 
}: UseClipboardPermissionProps = {}): UseClipboardPermissionReturn => {
  const [hasClipboardPermission, setHasClipboardPermission] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const { showToast } = useToast();

  // 检测iOS设备和初始化权限状态
  useEffect(() => {
    const isIosDevice = isIOS();
    setIsIOSDevice(isIosDevice);
    
    // 初始化时检查权限状态
    const checkInitialPermission = async () => {
      if (isIosDevice) {
        // iOS不主动检查
        setHasClipboardPermission(false);
        setSyncEnabled(false);
      } else {
        try {
          // 非iOS设备尝试直接读取剪贴板
          await navigator.clipboard.readText();
          // 如果能读取成功，说明有权限
          setHasClipboardPermission(true);
          setSyncEnabled(true);
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
        } catch (error) {
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          
          if (onPermissionChange) {
            onPermissionChange(false);
          }
        }
      }
    };
    
    checkInitialPermission();
  }, [onPermissionChange]);

  // 请求剪贴板权限
  const requestClipboardPermission = useCallback(async () => {
    try {
      // 检查页面是否有焦点
      if (!document.hasFocus()) {
        showToast('请先点击页面，然后再请求权限', 'warning');
        return;
      }
      
      // iOS设备特殊处理
      if (isIOSDevice) {
        try {
          // 直接尝试读取，这会触发iOS的粘贴确认UI
          const text = await navigator.clipboard.readText();
          
          // 如果成功，说明用户确认了粘贴
          setHasClipboardPermission(true);
          setSyncEnabled(true);
          showToast('已获得剪贴板访问', 'success');
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
          
          return text; // 返回读取的内容，便于后续处理
        } catch (error) {
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          showToast('未能获得剪贴板访问，请点击系统粘贴确认', 'warning');
          
          if (onPermissionChange) {
            onPermissionChange(false);
          }
        }
        return;
      }
      
      // 非iOS设备的原有逻辑
      // 尝试读取剪贴板内容，这会触发权限请求
      const text = await navigator.clipboard.readText();
      
      // 更新权限状态
      const permissionStatus = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName
      });
      
      const granted = permissionStatus.state === 'granted';
      setHasClipboardPermission(granted);
      setSyncEnabled(granted);
      
      if (onPermissionChange) {
        onPermissionChange(granted);
      }
      
      if (granted) {
        showToast('剪贴板权限已授予', 'success');
        return text; // 返回读取的内容
      } else {
        showToast('未能获得剪贴板权限', 'error');
      }
    } catch (error) {
      setHasClipboardPermission(false);
      setSyncEnabled(false);
      showToast('无法获取剪贴板权限', 'error');
      
      if (onPermissionChange) {
        onPermissionChange(false);
      }
    }
  }, [showToast, isIOSDevice, onPermissionChange]);

  // 检查剪贴板权限
  const checkClipboardPermission = useCallback(async () => {
    // iOS设备特殊处理
    if (isIOSDevice) {
      // iOS上不使用permissions API，默认设置为false等待用户主动触发
      setHasClipboardPermission(false);
      setSyncEnabled(false);
      return false;
    }
    
    try {
      // 非iOS设备使用原有逻辑
      // 先尝试通过permissions API检查
      const permissionStatus = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName
      });
      
      const granted = permissionStatus.state === 'granted';
      
      // 如果权限未确定，尝试主动读取一次来确认
      if (permissionStatus.state === 'prompt') {
        try {
          // 尝试实际读取剪贴板内容
          await navigator.clipboard.readText();
          // 如果成功读取，说明有权限
          setHasClipboardPermission(true);
          setSyncEnabled(true);
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
          
          return true;
        } catch (readError) {
          // 读取失败，确认无权限
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          
          if (onPermissionChange) {
            onPermissionChange(false);
          }
          
          return false;
        }
      }
      
      // 设置权限状态
      setHasClipboardPermission(granted);
      setSyncEnabled(granted);
      
      if (onPermissionChange) {
        onPermissionChange(granted);
      }
      
      // 监听权限变化
      permissionStatus.onchange = () => {
        const newIsGranted = permissionStatus.state === 'granted';
        setHasClipboardPermission(newIsGranted);
        setSyncEnabled(newIsGranted);
        
        if (onPermissionChange) {
          onPermissionChange(newIsGranted);
        }
      };
      
      return granted;
    } catch (error) {
      // 如果API不支持，直接尝试读取
      try {
        await navigator.clipboard.readText();
        // 读取成功说明有权限
        setHasClipboardPermission(true);
        setSyncEnabled(true);
        
        if (onPermissionChange) {
          onPermissionChange(true);
        }
        
        return true;
      } catch (readError) {
        setHasClipboardPermission(false);
        setSyncEnabled(false);
        
        if (onPermissionChange) {
          onPermissionChange(false);
        }
        
        return false;
      }
    }
  }, [isIOSDevice, onPermissionChange]);

  return {
    hasClipboardPermission,
    syncEnabled,
    isIOSDevice,
    requestClipboardPermission,
    checkClipboardPermission
  };
}; 