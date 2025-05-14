# 剪贴板项目后端结构

## 项目架构

该项目采用MVC分层架构，结构清晰，职责分明，便于维护和扩展。

### 目录结构

```
internal/
├── bootstrap/        # 系统启动
├── common/           # 通用工具
│   └── response/     # 统一响应处理
├── config/           # 配置管理
├── controller/       # 控制器层，处理请求和响应
├── model/            # 数据模型定义
├── repository/       # 数据访问层，与数据库交互
├── server/           # 服务器配置
└── service/          # 业务逻辑层
```

### 功能分层

1. **控制器层（Controller）**：
   - 处理HTTP请求和返回响应
   - 参数校验和格式转换
   - 调用相应的服务层方法
   - 使用统一响应格式返回数据

2. **服务层（Service）**：
   - 实现业务逻辑
   - 组合多个存储库操作
   - 数据转换和处理

3. **存储库层（Repository）**：
   - 提供数据访问接口
   - 封装数据库操作细节
   - 实现数据持久化

4. **模型层（Model）**：
   - 定义数据结构
   - 与数据库表对应

5. **通用响应（Response）**：
   - 统一API响应格式
   - 规范状态码和消息

## 统一响应格式

所有API接口都使用统一的响应格式：

```json
{
  "code": 200,        // HTTP状态码
  "message": "成功",   // 响应消息
  "data": {           // 响应数据（可选）
    // 具体数据
  },
  "success": true     // 是否成功（true/false）
}
```

### 分页数据格式

分页接口返回格式：

```json
{
  "code": 200,
  "message": "获取成功",
  "success": true,
  "data": {
    "items": [],      // 分页数据
    "total": 100,     // 总记录数
    "page": 1,        // 当前页码
    "size": 10,       // 每页大小
    "totalPages": 10  // 总页数
  }
}
```

## 内容类型和设备类型

### 内容类型 (type)

剪贴板项目支持以下内容类型：

| 类型 | 说明 |
|------|------|
| text | 普通文本（默认） |
| link | 网页链接 |
| code | 代码片段 |
| password | 密码 |
| image | 图片 |
| file | 文件 |

### 设备类型 (device_type)

剪贴板项目支持以下设备类型：

| 类型 | 说明 |
|------|------|
| phone | 手机 |
| tablet | 平板 |
| desktop | 台式机/笔记本电脑 |
| other | 其他设备（默认） |

## API接口详细说明

### 获取剪贴板历史记录

```
GET /api/clipboard/history
```

支持按内容类型和设备类型筛选，并分页显示结果。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，从1开始，默认为1 |
| size | int | 否 | 每页记录数，默认为10，最大为50 |
| type | string | 否 | 内容类型，可选值：text, link, code, password, image, file |
| device_type | string | 否 | 设备类型，可选值：phone, tablet, desktop, other |

**示例请求：**

```
GET /api/clipboard/history?page=2&size=20&type=code&device_type=desktop
```

以上请求会返回第2页的桌面设备上的代码片段，每页20条记录。

### 保存剪贴板内容

```
POST /api/clipboard
```

**请求体：**

```json
{
  "content": "要保存的内容",
  "type": "text",  // 可选值：text, link, code, password, image, file，默认为text
  "device_id": "设备唯一标识符",
  "device_type": "desktop",  // 可选值：phone, tablet, desktop, other，默认为other
  "title": "可选标题"
}
```

### 按内容类型获取剪贴板历史

```
GET /api/clipboard/type/:type
```

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 内容类型，可选值：text, link, code, password, image, file |

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，从1开始，默认为1 |
| size | int | 否 | 每页记录数，默认为10，最大为50 |

### 按设备类型获取剪贴板历史

```
GET /api/clipboard/device-type/:device_type
```

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_type | string | 是 | 设备类型，可选值：phone, tablet, desktop, other |

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，从1开始，默认为1 |
| size | int | 否 | 每页记录数，默认为10，最大为50 |

## 更多接口

| 方法   | 路径                    | 描述             |
|--------|------------------------|------------------|
| GET    | /api/clipboard         | 获取最新剪贴板内容 |
| DELETE | /api/clipboard/:id     | 删除剪贴板项目    |
| PUT    | /api/clipboard/:id     | 更新剪贴板项目    |
| PUT    | /api/clipboard/:id/favorite | 切换收藏状态 |
| GET    | /api/clipboard/favorites | 获取收藏的剪贴板项目 |
| GET    | /api/clipboard/:id     | 获取单个剪贴板项目 |

## 前端调用示例

### 保存剪贴板内容

```javascript
// 保存代码片段
fetch('http://localhost:8080/api/clipboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'const hello = "world";',
    type: 'code',
    device_id: 'device-123',
    device_type: 'desktop',
    title: '示例代码'
  })
});

// 保存密码
fetch('http://localhost:8080/api/clipboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'p@ssw0rd123',
    type: 'password',
    device_id: 'device-456',
    device_type: 'phone'
  })
});
```

### 获取历史记录（带筛选）

```javascript
// 获取所有历史记录（分页）
fetch('http://localhost:8080/api/clipboard/history?page=1&size=20');

// 获取手机上的链接记录
fetch('http://localhost:8080/api/clipboard/history?type=link&device_type=phone&page=1&size=20');

// 获取所有代码片段
fetch('http://localhost:8080/api/clipboard/type/code?page=1&size=20');

// 获取所有平板设备的记录
fetch('http://localhost:8080/api/clipboard/device-type/tablet?page=1&size=20');
``` 