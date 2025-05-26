/**
 * API 连接检查工具
 * 用于检查API连接和诊断问题
 */

import { clipboardService } from '@/services/api';

// 检查通道API连接
export const checkApiConnections = async (channelId: string) => {
  const results: Array<{
    name: string;
    success: boolean;
    status?: number;
    message?: string;
    data?: any;
    error?: string;
  }> = [];
  
  try {
    // 检查各种API调用
    try {
      const devicesResponse = await clipboardService.getDevices();
      results.push({
        name: '设备列表',
        success: devicesResponse.success,
        status: devicesResponse.code,
        message: devicesResponse.message,
        data: devicesResponse.data
      });
    } catch (error) {
      results.push({
        name: '设备列表',
        success: false,
        error: String(error)
      });
    }
    
    try {
      const statsResponse = await clipboardService.getChannelStats();
      results.push({
        name: '统计数据',
        success: statsResponse.success,
        status: statsResponse.code,
        message: statsResponse.message,
        data: statsResponse.data
      });
    } catch (error) {
      results.push({
        name: '统计数据',
        success: false,
        error: String(error)
      });
    }
    
    try {
      const historyResponse = await clipboardService.getSyncHistory(5);
      results.push({
        name: '同步历史',
        success: historyResponse.success,
        status: historyResponse.code,
        message: historyResponse.message,
        data: historyResponse.data
      });
    } catch (error) {
      results.push({
        name: '同步历史',
        success: false,
        error: String(error)
      });
    }
    
    console.table(results);
    
    return results;
  } catch (err) {
    console.error('API检查工具错误:', err);
    return results;
  }
}; 