#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 设置目标操作系统和架构
export GOOS=linux
export GOARCH=amd64
# 启用CGO以支持go-sqlite3
export CGO_ENABLED=1
# 设置交叉编译工具链(如果有的话)
# export CC=x86_64-linux-gnu-gcc

# 二进制输出目录
OUTPUT_DIR="bin"
OUTPUT_NAME="clipboard"

echo -e "${YELLOW}开始构建前端项目...${NC}"

# 进入前端项目目录
cd web || { echo -e "${RED}无法进入web目录${NC}"; exit 1; }

# 安装依赖
echo -e "${YELLOW}安装前端依赖...${NC}"
npm install

# 构建项目
echo -e "${YELLOW}构建前端项目...${NC}"
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
  echo -e "${RED}前端构建失败，未找到dist目录${NC}"
  exit 1
fi

echo -e "${GREEN}前端构建成功!${NC}"

# 返回项目根目录
cd ..

# 确保目标目录存在
mkdir -p internal/static/dist

# 清空目标目录内容
echo -e "${YELLOW}清理之前的构建文件...${NC}"
rm -rf internal/static/dist/*

# 复制dist目录内容到internal/static/dist目录
echo -e "${YELLOW}复制构建文件到Go项目...${NC}"
cp -r web/dist/* internal/static/dist/

# 为了向后兼容，也复制到cmd/web
mkdir -p cmd/web
rm -rf cmd/web/*
cp -r web/dist/* cmd/web/

# 创建输出目录（如果不存在）
mkdir -p ${OUTPUT_DIR}

# 编译Go程序为Linux二进制文件
echo -e "${YELLOW}开始编译Go程序为Linux二进制文件...${NC}"
echo -e "${YELLOW}使用CGO_ENABLED=1以支持SQLite...${NC}"
go build -o ${OUTPUT_DIR}/${OUTPUT_NAME} ./cmd/main.go

# 检查编译是否成功
if [ ! -f "${OUTPUT_DIR}/${OUTPUT_NAME}" ]; then
  echo -e "${RED}Go程序编译失败${NC}"
  exit 1
fi

echo -e "${GREEN}Linux二进制文件构建成功!${NC}"
echo -e "${GREEN}输出文件: ${OUTPUT_DIR}/${OUTPUT_NAME}${NC}"

# 设置可执行权限
chmod +x ${OUTPUT_DIR}/${OUTPUT_NAME}

echo -e "${YELLOW}现在可以将${OUTPUT_DIR}/${OUTPUT_NAME}部署到Linux服务器上${NC}"
echo -e "${YELLOW}注意：由于使用了CGO，你需要确保目标Linux服务器上安装了SQLite3开发库${NC}" 