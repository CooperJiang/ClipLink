import axios, { AxiosError } from 'axios';
import { ApiResponse, ClipboardItem, SaveClipboardRequest, ClipboardType, RawClipboardItem } from '@/types/clipboard';
import { deviceIdUtil } from '@/utils/deviceId';
import { detectDeviceType } from '@/utils/deviceDetection';

// 获取通道ID
const getChannelId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clipboard_channel_id');
  }
  return null;
};

// 创建Axios实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // 添加跨域支持
  withCredentials: true,
});

// 添加请求拦截器，自动添加deviceId和channelId到每个请求
api.interceptors.request.use((config) => {
  // 获取通道ID
  const channelId = getChannelId();
  
  // 非通道创建和验证请求，添加通道ID到请求头
  if (channelId && 
      !(config.url?.includes('/channel') && config.method?.toLowerCase() === 'post')) {
    config.headers['X-Channel-ID'] = channelId;
  }
  
  // 如果是GET请求，添加deviceId到查询参数
  if (config.method?.toLowerCase() === 'get') {
    config.params = {
      ...config.params,
      device_id: deviceIdUtil.getDeviceId()
    };
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 处理新的统一API响应格式
const handleApiResponse = <T>(response: unknown): ApiResponse<T> => {
  // 如果响应符合新的统一格式
  if (response && typeof response === 'object' && 'code' in response && 
      typeof response.code === 'number' && 
      'success' in response && 
      typeof response.success === 'boolean') {
    return response as ApiResponse<T>;
  }
  
  // 如果不是新格式，尝试转换为新格式
  return {
    code: 200,
    message: '成功',
    success: true,
    data: response as T
  };
};

// 处理API错误
const handleApiError = <T>(error: unknown, defaultMessage: string): ApiResponse<T> => {
  let errorMessage = defaultMessage;
  let statusCode = 500;
  
  if (axios.isAxiosError(error)) {
    // 服务器返回了错误状态码
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      statusCode = axiosError.response.status;
      const responseData = axiosError.response.data as Record<string, unknown>;
      errorMessage = `服务器错误 (${statusCode}): ${
        responseData && typeof responseData === 'object' && 'message' in responseData 
          ? String(responseData.message) 
          : axiosError.message
      }`;
    } else if (axiosError.request) {
      // 请求发出但没有收到响应
      errorMessage = '服务器无响应，请检查网络连接';
      statusCode = 503;
    } else {
      // 其他错误
      errorMessage = axiosError.message || '未知错误';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  return {
    code: statusCode,
    message: errorMessage,
    success: false,
    error: errorMessage
  };
};

// 将API返回的原始格式转换为前端使用的格式
const convertRawClipboardItem = (raw: RawClipboardItem | any): ClipboardItem => {
  return {
    id: raw.id,
    title: raw.title || '',
    content: raw.content,
    type: raw.type,
    isFavorite: raw.favorite || raw.isFavorite || false,
    created_at: raw.created_at || raw.createdAt || '',
    createdAt: raw.created_at || raw.createdAt || '',
    updatedAt: raw.updated_at || raw.updatedAt || '',
    device_id: raw.device_id,
    device_type: raw.device_type
  };
};

// API服务类
export const clipboardService = {
  // 通道相关接口
  // 创建通道
  createChannel: async (channelId?: string): Promise<ApiResponse<{id: string, created_at: string}>> => {
    try {
      const response = await api.post<unknown>('/channel', channelId ? { channel_id: channelId } : undefined);
      return handleApiResponse<{id: string, created_at: string}>(response.data);
    } catch (error) {
      return handleApiError<{id: string, created_at: string}>(error, '创建通道失败');
    }
  },

  // 验证通道
  verifyChannel: async (channelId: string): Promise<ApiResponse<null>> => {
    try {
      const response = await api.post<unknown>('/channel/verify', { channel_id: channelId });
      return handleApiResponse<null>(response.data);
    } catch (error) {
      return handleApiError<null>(error, '验证通道失败');
    }
  },

  // 获取最新剪贴板内容
  getLatestClipboard: async (): Promise<ApiResponse<ClipboardItem>> => {
    try {
      const response = await api.get<unknown>('/clipboard');
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 转换为标准格式
      if (apiResponse.success && apiResponse.data) {
        apiResponse.data = convertRawClipboardItem(apiResponse.data);
      }
      
      return apiResponse as ApiResponse<ClipboardItem>;
    } catch (error) {
      return handleApiError<ClipboardItem>(error, '获取最新剪贴板失败');
    }
  },

  // 获取剪贴板历史
  getClipboardHistory: async (page = 1, size = 12, type?: ClipboardType): Promise<ApiResponse<{items: ClipboardItem[], total: number, page: number, size: number, totalPages: number} | ClipboardItem[]>> => {
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        size
      };
      
      // 如果指定了类型，添加到查询参数
      if (type) {
        params.type = type;
      }
      
      const response = await api.get<unknown>('/clipboard/history', { params });
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 处理可能的不同响应格式
      if (apiResponse.success && apiResponse.data) {
        if (Array.isArray(apiResponse.data)) {
          // 如果是数组格式，转换每个项目
          apiResponse.data = apiResponse.data.map(convertRawClipboardItem);
        } else if (apiResponse.data.items) {
          // 如果是分页对象格式，转换每个项目
          apiResponse.data.items = apiResponse.data.items.map(convertRawClipboardItem);
        }
      }
      
      return apiResponse as ApiResponse<{items: ClipboardItem[], total: number, page: number, size: number, totalPages: number} | ClipboardItem[]>;
    } catch (error) {
      return handleApiError<{items: ClipboardItem[], total: number, page: number, size: number, totalPages: number} | ClipboardItem[]>(error, '获取剪贴板历史失败');
    }
  },

  // 获取收藏的剪贴板项目
  getFavorites: async (page = 1, size = 12): Promise<ApiResponse<{items: ClipboardItem[], total: number, page: number, size: number, totalPages: number} | ClipboardItem[]>> => {
    try {
      const response = await api.get<unknown>('/clipboard/favorites', {
        params: {
          page,
          size
        }
      });
      
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 处理可能的不同响应格式
      if (apiResponse.success && apiResponse.data) {
        console.log('API返回的收藏数据:', apiResponse.data);
        
        if (Array.isArray(apiResponse.data)) {
          // 如果直接返回了数组，转换每个项目
          apiResponse.data = apiResponse.data.map(convertRawClipboardItem);
        } else if (apiResponse.data.items) {
          // 如果返回了分页对象，转换每个项目
          apiResponse.data.items = apiResponse.data.items.map(convertRawClipboardItem);
        }
      }
      
      return apiResponse as ApiResponse<{items: ClipboardItem[], total: number, page: number, size: number, totalPages: number} | ClipboardItem[]>;
    } catch (error) {
      return handleApiError<{items: ClipboardItem[], total: number, page: number, size: number, totalPages: number} | ClipboardItem[]>(error, '获取收藏夹失败');
    }
  },

  // 保存剪贴板内容
  saveClipboard: async (data: Omit<SaveClipboardRequest, 'device_id' | 'device_type'>): Promise<ApiResponse<ClipboardItem>> => {
    try {
      // 添加设备ID和设备类型
      const requestData: SaveClipboardRequest = {
        ...data,
        device_id: deviceIdUtil.getDeviceId(),
        device_type: detectDeviceType()
      };
      
      const response = await api.post<unknown>('/clipboard', requestData);
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 转换为标准格式
      if (apiResponse.success && apiResponse.data) {
        apiResponse.data = convertRawClipboardItem(apiResponse.data);
      }
      
      return apiResponse as ApiResponse<ClipboardItem>;
    } catch (error) {
      return handleApiError<ClipboardItem>(error, '保存剪贴板失败');
    }
  },

  // 更新剪贴板项目
  updateClipboard: async (id: string, data: SaveClipboardRequest): Promise<ApiResponse<ClipboardItem>> => {
    try {
      // 确保请求数据中包含设备ID
      const requestData: SaveClipboardRequest = {
        ...data,
        device_id: data.device_id || deviceIdUtil.getDeviceId(),
        device_type: data.device_type || detectDeviceType()
      };
      const response = await api.put<unknown>(`/clipboard/${id}`, requestData);
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 转换为标准格式
      if (apiResponse.success && apiResponse.data) {
        apiResponse.data = convertRawClipboardItem(apiResponse.data);
      }
      
      return apiResponse as ApiResponse<ClipboardItem>;
    } catch (error) {
      return handleApiError<ClipboardItem>(error, '更新剪贴板失败');
    }
  },

  // 切换收藏状态
  toggleFavorite: async (id: string, isFavorite: boolean): Promise<ApiResponse<ClipboardItem>> => {
    try {
      const response = await api.put<unknown>(`/clipboard/${id}/favorite`, { 
        isFavorite,
        device_id: deviceIdUtil.getDeviceId(),
      });
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 转换为标准格式
      if (apiResponse.success && apiResponse.data) {
        apiResponse.data = convertRawClipboardItem(apiResponse.data);
      }
      
      return apiResponse as ApiResponse<ClipboardItem>;
    } catch (error) {
      return handleApiError<ClipboardItem>(error, '切换收藏状态失败');
    }
  },

  // 删除剪贴板项目
  deleteClipboard: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const response = await api.delete<unknown>(`/clipboard/${id}`);
      return handleApiResponse<null>(response.data);
    } catch (error) {
      return handleApiError<null>(error, '删除剪贴板失败');
    }
  },

  // 获取指定类型的剪贴板项目数量
  getClipboardCount: async (type?: ClipboardType): Promise<ApiResponse<Record<string, number>>> => {
    try {
      const params: Record<string, string | undefined> = {};
      if (type) {
        params.type = type;
      }
      
      const response = await api.get<unknown>('/clipboard/count', { params });
      return handleApiResponse<Record<string, number>>(response.data);
    } catch (error) {
      return handleApiError<Record<string, number>>(error, '获取剪贴板数量失败');
    }
  },

  // 获取单个剪贴板项目
  getClipboardItem: async (id: string): Promise<ApiResponse<ClipboardItem>> => {
    try {
      const response = await api.get<unknown>(`/clipboard/${id}`);
      const apiResponse = handleApiResponse<any>(response.data);
      
      // 转换为标准格式
      if (apiResponse.success && apiResponse.data) {
        apiResponse.data = convertRawClipboardItem(apiResponse.data);
      }
      
      return apiResponse as ApiResponse<ClipboardItem>;
    } catch (error) {
      return handleApiError(error, '获取剪贴板项目失败');
    }
  }
}; 