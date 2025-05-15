# 剪贴板应用自定义钩子

本目录包含剪贴板应用的自定义钩子（Custom Hooks），用于分离关注点，提高代码可维护性。

## 钩子列表

### useClipboardPermission

处理剪贴板权限相关的逻辑：
- 检测设备类型（iOS/非iOS）
- 请求剪贴板权限
- 检查剪贴板权限状态
- 适配不同设备的权限处理方法

### useClipboardData

处理剪贴板数据获取和管理：
- 获取最新剪贴板内容
- 获取剪贴板历史记录
- 分页加载数据
- 处理剪贴板数据的CRUD操作（创建、读取、更新、删除）

### useClipboardSync

处理剪贴板实时同步逻辑：
- 监听页面可见性变化，自动同步剪贴板
- 处理不同设备的同步策略
- 防抖逻辑，避免频繁触发同步
- 同步锁，防止并发读取和保存

### useChannelState

处理通道状态管理：
- 验证通道状态
- 控制通道模态框显示
- 提供通道状态变化的回调

## 使用方法

所有钩子可通过索引文件统一导入：

```tsx
import { 
  useClipboardPermission, 
  useClipboardData, 
  useClipboardSync, 
  useChannelState 
} from '@/hooks';
``` 