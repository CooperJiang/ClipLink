# 跨平台剪贴板项目

该项目包含一个Go后端和一个NextJS前端，使用Go的embed模块将前端静态资源嵌入到Go二进制文件中，实现前后端一体化部署。

## 项目结构

```
project/
├── cmd/                    # Go主程序目录
│   ├── main.go             # Go主程序入口
│   └── web/                # 前端构建文件（由构建脚本自动生成）
├── internal/               # Go内部包
├── web/                    # NextJS前端项目
│   ├── src/                # 前端源代码
│   ├── public/             # 静态资源
│   ├── dist/               # 构建输出目录
│   ├── package.json        # 前端依赖配置
│   └── next.config.js      # NextJS配置
└── build.sh                # 构建脚本
```

## 开发环境准备

### 前提条件

- Go 1.16+
- Node.js 16+ 和 npm
- 一个支持Linux/macOS的终端环境

### 前端开发

在开发模式下运行前端：

```bash
cd web
npm install
npm run dev
```

### 后端开发

在开发模式下运行后端：

```bash
go run cmd/main.go
```

## 构建和部署

### 一键构建

使用提供的构建脚本一键完成前端构建和文件复制：

```bash
# 确保脚本有执行权限
chmod +x build.sh

# 运行构建脚本
./build.sh
```

这个脚本会：
1. 构建NextJS前端项目
2. 将构建产物复制到cmd/web目录
3. 准备好Go项目进行编译

### 手动构建

如果需要手动构建，请按以下步骤操作：

1. 构建前端：
```bash
cd web
npm install
npm run build
```

2. 复制构建文件到Go项目：
```bash
mkdir -p cmd/web
cp -r web/dist/* cmd/web/
```

3. 编译Go程序：
```bash
go build -o clipboard cmd/main.go
```

### 部署

编译后的二进制文件可以直接在目标环境运行：

```bash
./clipboard
```

默认情况下，应用将在 http://localhost:8080 上运行。

## 项目特性

- 跨平台剪贴板同步
- 离线访问历史剪贴板内容
- 收藏夹功能
- 多设备同步
