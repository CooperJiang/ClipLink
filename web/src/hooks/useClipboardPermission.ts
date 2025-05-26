import { useState, useCallback, useEffect, useRef } from 'react';
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
  // 添加一个用于保存权限检查状态的引用
  const permissionCheckTimeRef = useRef<number>(0);
  // 添加一个用于防止短时间内重复提示的引用
  const lastToastTimeRef = useRef<number>(0);
  const { showToast } = useToast();

  // 检测iOS设备和初始化权限状态
  useEffect(() => {
    const isIosDevice = isIOS();
    setIsIOSDevice(isIosDevice);
    
    // 初始化时检查权限状态
    const checkInitialPermission = async () => {
      if (isIosDevice) {
        // iOS设备使用手动模式，初始就设置为有权限，但不开启自动同步
        setHasClipboardPermission(true);
        setSyncEnabled(false);
        
        if (onPermissionChange) {
          onPermissionChange(true);
        }
      } else {
        try {
          // 非iOS设备尝试直接读取剪贴板
          await navigator.clipboard.readText();
          // 如果能读取成功，说明有权限
          setHasClipboardPermission(true);
          setSyncEnabled(true);
          permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
        } catch (error) {
          // 如果出现NotAllowedError，说明没有权限
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          
          if (onPermissionChange) {
            onPermissionChange(false);
            }
          } else {
            // 如果是其他错误，可能是暂时性的或网络相关的，维持当前状态
            console.warn('检查剪贴板权限时出现非权限相关错误:', error);
          }
        }
      }
    };
    
    checkInitialPermission();
    
    // 添加定期检查权限的机制，防止权限被意外撤销
    const intervalId = setInterval(() => {
      // 只对非iOS设备进行定期检查
      if (!isIosDevice) {
        checkClipboardPermissionSilent();
      }
    }, 30000); // 每30秒检查一次
    
    return () => {
      clearInterval(intervalId);
    };
  }, [onPermissionChange]);

  // 静默检查权限的函数，不显示提示
  const checkClipboardPermissionSilent = useCallback(async () => {
    // iOS设备不走这个逻辑
    if (isIOSDevice) return true;
    
    try {
      // 尝试实际读取剪贴板
      await navigator.clipboard.readText();
      // 如果成功，说明有权限
      setHasClipboardPermission(true);
      setSyncEnabled(true);
      permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
      
      if (onPermissionChange) {
        onPermissionChange(true);
      }
      
      return true;
    } catch (error) {
      // 只有在确认是权限被拒绝的情况下才更新状态
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        // 权限被拒绝
        setHasClipboardPermission(false);
        setSyncEnabled(false);
        
        if (onPermissionChange) {
          onPermissionChange(false);
        }
        
        return false;
      }
      
      // 其他错误不改变状态
      return hasClipboardPermission;
    }
  }, [isIOSDevice, onPermissionChange, hasClipboardPermission]);

  // 请求剪贴板权限
  const requestClipboardPermission = useCallback(async () => {
    try {
      // 检查页面是否有焦点
      if (!document.hasFocus()) {
        showToast('请先点击页面，然后再请求权限', 'warning');
        return;
      }
      
      // 防抖：如果上一次成功授权后不到5秒，跳过请求
      const now = Date.now();
      if (now - permissionCheckTimeRef.current < 5000) {
        return;
      }
      
      // 防抖：如果上一次提示不到3秒，跳过提示
      const shouldShowToast = now - lastToastTimeRef.current > 3000;
      
      // iOS设备特殊处理
      if (isIOSDevice) {
        try {
          // 直接尝试读取，这会触发iOS的粘贴确认UI
          const text = await navigator.clipboard.readText();
          
          // 如果成功，说明用户确认了粘贴
          setHasClipboardPermission(true);
          // iOS设备始终不开启自动同步，只依靠手动粘贴
          setSyncEnabled(false);
          
          if (shouldShowToast) {
            lastToastTimeRef.current = now;
            showToast('已获得剪贴板访问权限', 'success');
          }
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
          
          return text; // 返回读取的内容，便于后续处理
        } catch (error) {
          // iOS上可能是用户拒绝，但我们仍然设置为有权限，这样用户还可以使用手动输入功能
          setHasClipboardPermission(true);
          setSyncEnabled(false);
          
          if (shouldShowToast) {
            lastToastTimeRef.current = now;
            showToast('未能获得剪贴板访问，请点击"粘贴"按钮并在系统弹出时确认', 'warning');
          }
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
        }
        return;
      }
      
      // 非iOS设备的原有逻辑
      // 尝试读取剪贴板内容，这会触发权限请求
      const text = await navigator.clipboard.readText();
      permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
      
      // 尝试使用权限API获取更准确的状态
      try {
      const permissionStatus = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName
      });
      
      const granted = permissionStatus.state === 'granted';
      setHasClipboardPermission(granted);
      setSyncEnabled(granted);
      
      if (onPermissionChange) {
        onPermissionChange(granted);
      }
      
        if (granted && shouldShowToast) {
          lastToastTimeRef.current = now;
          showToast('剪贴板权限已授予', 'success');
        } else if (!granted && shouldShowToast) {
          lastToastTimeRef.current = now;
          showToast('未能获得完全剪贴板权限', 'info');
        }
      } catch (permError) {
        // 如果permissions API不可用，根据能否读取剪贴板来判断
        setHasClipboardPermission(true);
        setSyncEnabled(true);
        
        if (onPermissionChange) {
          onPermissionChange(true);
        }
        
        if (shouldShowToast) {
          lastToastTimeRef.current = now;
        showToast('剪贴板权限已授予', 'success');
        }
      }
      
      return text; // 返回读取的内容
    } catch (error) {
      // 检查是否是权限错误
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
      setHasClipboardPermission(false);
      setSyncEnabled(false);
        
        const now = Date.now();
        if (now - lastToastTimeRef.current > 3000) {
          lastToastTimeRef.current = now;
          showToast('剪贴板权限被拒绝', 'error');
        }
      
      if (onPermissionChange) {
        onPermissionChange(false);
        }
      } else {
        // 其他错误(可能是临时性的)不要立即改变权限状态
        console.error('请求剪贴板权限时发生错误:', error);
        
        const now = Date.now();
        if (now - lastToastTimeRef.current > 3000) {
          lastToastTimeRef.current = now;
          showToast('无法获取剪贴板权限，请重试', 'error');
        }
      }
    }
  }, [showToast, isIOSDevice, onPermissionChange]);

  // 检查剪贴板权限 - 可显示提示的版本
  const checkClipboardPermission = useCallback(async () => {
    // iOS设备特殊处理
    if (isIOSDevice) {
      // iOS上始终设置为有权限，但不开启自动同步
      setHasClipboardPermission(true);
      setSyncEnabled(false);
      return true;
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
          permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
          
          if (onPermissionChange) {
            onPermissionChange(true);
          }
          
          return true;
        } catch (readError) {
          // 检查是否是权限错误
          if (readError instanceof DOMException && readError.name === 'NotAllowedError') {
          // 读取失败，确认无权限
          setHasClipboardPermission(false);
          setSyncEnabled(false);
          
          if (onPermissionChange) {
            onPermissionChange(false);
          }
          
          return false;
          }
          // 其他错误可能是临时的，不改变权限状态
          return hasClipboardPermission;
        }
      }
      
      // 设置权限状态
      setHasClipboardPermission(granted);
      setSyncEnabled(granted);
      if (granted) {
        permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
      }
      
      if (onPermissionChange) {
        onPermissionChange(granted);
      }
      
      // 监听权限变化
      permissionStatus.onchange = () => {
        const newIsGranted = permissionStatus.state === 'granted';
        setHasClipboardPermission(newIsGranted);
        setSyncEnabled(newIsGranted);
        
        if (newIsGranted) {
          permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
        }
        
        if (onPermissionChange) {
          onPermissionChange(newIsGranted);
        }
      };
      
      return granted;
    } catch (error) {
      // 如果permissions API不支持，直接尝试读取
      try {
        await navigator.clipboard.readText();
        // 读取成功说明有权限
        setHasClipboardPermission(true);
        setSyncEnabled(true);
        permissionCheckTimeRef.current = Date.now(); // 记录成功授权时间
        
        if (onPermissionChange) {
          onPermissionChange(true);
        }
        
        return true;
      } catch (readError) {
        // 检查是否是权限错误
        if (readError instanceof DOMException && readError.name === 'NotAllowedError') {
        setHasClipboardPermission(false);
        setSyncEnabled(false);
        
        if (onPermissionChange) {
          onPermissionChange(false);
        }
        
        return false;
        }
        // 其他错误可能是临时的，不改变权限状态
        return hasClipboardPermission;
      }
    }
  }, [isIOSDevice, onPermissionChange, hasClipboardPermission]);

  return {
    hasClipboardPermission,
    syncEnabled,
    isIOSDevice,
    requestClipboardPermission,
    checkClipboardPermission
  };
}; 