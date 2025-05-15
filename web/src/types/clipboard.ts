// 剪贴板项目类型
export enum ClipboardType {
  TEXT = 'text',
  LINK = 'link',
  CODE = 'code',
  PASSWORD = 'password',
  IMAGE = 'image',
  FILE = 'file',
  OTHER = 'other'
}

// 设备类型
export enum DeviceType {
  PHONE = 'phone',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  OTHER = 'other'
}

// API返回的原始剪贴板项目接口
export interface RawClipboardItem {
  id: string;
  title: string;
  content: string;
  type: ClipboardType;
  favorite: boolean;  // API返回使用favorite而不是isFavorite
  created_at: string; // API返回使用created_at而不是createdAt
  updated_at?: string;
  device_id: string;
  device_type?: DeviceType;
}

// 前端使用的剪贴板项目接口
export interface ClipboardItem {
  id: string;
  title: string;
  content: string;
  type: ClipboardType;
  isFavorite: boolean;   // 前端使用isFavorite
  created_at: string;    // 保持和API一致使用created_at
  createdAt?: string;    // 兼容旧代码
  updatedAt?: string;    // 兼容旧代码
  device_id?: string;    // 可选字段
  device_type?: DeviceType; // 可选的设备类型字段
}

// 创建或更新剪贴板的请求
export interface SaveClipboardRequest {
  id?: string; // 添加id字段，用于编辑时传递
  title?: string;
  content: string;
  isFavorite?: boolean;
  type?: ClipboardType;
  device_id?: string;
  device_type?: DeviceType; // 添加设备类型字段
}

// API响应类型 - 新的统一格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  success: boolean;
  data?: T;
  error?: string;
} 