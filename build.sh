#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始构建前端项目...${NC}"

# 进入前端项目目录
cd web

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

# 确保目标目录存在
mkdir -p ../internal/static/dist

# 清空目标目录内容
echo -e "${YELLOW}清理之前的构建文件...${NC}"
rm -rf ../internal/static/dist/*

# 复制dist目录内容到internal/static/dist目录
echo -e "${YELLOW}复制构建文件到Go项目...${NC}"
cp -r dist/* ../internal/static/dist/

# 为了向后兼容，也复制到cmd/web
mkdir -p ../cmd/web
rm -rf ../cmd/web/*
cp -r dist/* ../cmd/web/

echo -e "${GREEN}构建和复制完成!${NC}"
echo -e "${YELLOW}现在可以通过以下命令运行Go应用:${NC}"
echo -e "cd .. && go run cmd/main.go" 