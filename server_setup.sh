#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始安装剪贴板应用所需的依赖...${NC}"

# 检测Linux发行版
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si)
else
    OS=$(uname -s)
fi

# 安装SQLite依赖
echo -e "${YELLOW}安装SQLite3开发库...${NC}"

if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Ubuntu/Debian系统
    apt-get update
    apt-get install -y sqlite3 libsqlite3-dev

elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    # CentOS/RHEL/Fedora系统
    yum install -y sqlite sqlite-devel

elif [[ "$OS" == *"Alpine"* ]]; then
    # Alpine Linux
    apk add --no-cache sqlite sqlite-dev

else
    echo -e "${RED}无法识别的操作系统: $OS${NC}"
    echo -e "${YELLOW}请手动安装SQLite3及其开发库${NC}"
    exit 1
fi

# 创建应用目录
echo -e "${YELLOW}创建应用目录...${NC}"
mkdir -p /opt/clipboard

# 设置环境变量(可选)
echo -e "${YELLOW}设置环境变量...${NC}"
if [ ! -f /etc/profile.d/clipboard.sh ]; then
    echo 'export PATH=$PATH:/opt/clipboard' > /etc/profile.d/clipboard.sh
    chmod +x /etc/profile.d/clipboard.sh
fi

echo -e "${GREEN}依赖安装完成!${NC}"
echo -e "${YELLOW}现在您可以将clipboard二进制文件和run.sh复制到/opt/clipboard目录下${NC}"
echo -e "${YELLOW}然后使用 cd /opt/clipboard && ./run.sh start 启动应用${NC}" 