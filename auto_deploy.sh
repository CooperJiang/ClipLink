#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 版本号
VERSION="v1.0"

# 基础下载URL
BASE_URL="https://sh.mmmss.com/f/cliplink/${VERSION}"

# 默认安装目录（当前目录）
INSTALL_DIR="."

# 默认端口
DEFAULT_PORT="8080"

# 默认强制覆盖选项
FORCE_OVERRIDE="y"

# 显示标题
show_title() {
    echo -e "${BLUE}=======================================================${NC}"
    echo -e "${BLUE}        剪贴板应用自动部署脚本                        ${NC}"
    echo -e "${BLUE}=======================================================${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -d, --dir <目录>       指定安装目录 (默认: 当前目录)"
    echo "  -p, --port <端口>      指定应用端口 (默认: 8080)"
    echo "  -v, --version <版本>   指定版本号 (默认: v1.0)"
    echo "  -f, --force <y/n>      端口冲突时是否强制覆盖 (默认: y)"
    echo "  -h, --help             显示此帮助信息"
    echo ""
    echo "例子:"
    echo "  $0                     # 当前目录安装，默认强制覆盖"
    echo "  $0 --dir /opt/cliplink # 安装到指定目录"
    echo "  $0 --port 3000         # 使用指定端口"
    echo "  $0 --force n           # 端口冲突时不强制覆盖"
    echo ""
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if command -v netstat &>/dev/null; then
        netstat -tuln | grep ":$port " &>/dev/null
    elif command -v ss &>/dev/null; then
        ss -tuln | grep ":$port " &>/dev/null
    elif command -v lsof &>/dev/null; then
        lsof -i :$port &>/dev/null
    else
        # 如果没有可用的端口检查工具，假设端口未被占用
        return 1
    fi
}

# 处理端口冲突
handle_port_conflict() {
    local port=$1
    
    echo -e "${YELLOW}检测到端口 $port 已被占用${NC}"
    
    if [ "$FORCE_OVERRIDE" = "y" ] || [ "$FORCE_OVERRIDE" = "Y" ]; then
        echo -e "${YELLOW}强制覆盖模式已启用，将尝试停止占用端口的服务...${NC}"
        
        # 尝试停止当前目录下的cliplink服务
        if [ -f "run.sh" ]; then
            echo -e "${YELLOW}尝试停止现有的cliplink服务...${NC}"
            ./run.sh stop 2>/dev/null || true
            sleep 2
        fi
        
        # 再次检查端口
        if check_port "$port"; then
            echo -e "${YELLOW}端口仍被占用，尝试强制终止占用进程...${NC}"
            
            # 查找并终止占用端口的进程
            if command -v lsof &>/dev/null; then
                local pids=$(lsof -ti :$port 2>/dev/null)
                if [ -n "$pids" ]; then
                    echo -e "${YELLOW}找到占用端口的进程: $pids${NC}"
                    echo "$pids" | xargs kill -9 2>/dev/null || true
                    sleep 1
                fi
            elif command -v fuser &>/dev/null; then
                fuser -k $port/tcp 2>/dev/null || true
                sleep 1
            fi
            
            # 最终检查
            if check_port "$port"; then
                echo -e "${RED}无法释放端口 $port，请手动停止占用该端口的服务${NC}"
                return 1
            else
                echo -e "${GREEN}端口 $port 已成功释放${NC}"
                return 0
            fi
        else
            echo -e "${GREEN}端口 $port 已释放${NC}"
            return 0
        fi
    else
        echo -e "${RED}端口冲突处理已禁用，部署取消${NC}"
        echo -e "${YELLOW}您可以：${NC}"
        echo -e "${YELLOW}  1. 使用 --force y 参数强制覆盖${NC}"
        echo -e "${YELLOW}  2. 手动停止占用端口的服务${NC}"
        echo -e "${YELLOW}  3. 使用 --port 参数指定其他端口${NC}"
        return 1
    fi
}

# 检测系统类型和架构
detect_system() {
    echo -e "${YELLOW}检测系统类型和架构...${NC}"
    
    # 检测操作系统类型
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="darwin"
    else
        echo -e "${RED}错误: 不支持的操作系统类型: $OSTYPE${NC}"
        echo -e "${RED}当前只支持Linux和macOS系统${NC}"
        exit 1
    fi
    
    # 检测系统架构
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        ARCH="amd64"
    elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        ARCH="arm64"
    elif [[ "$ARCH" == "i386" || "$ARCH" == "i686" ]]; then
        ARCH="386"
    else
        echo -e "${RED}错误: 不支持的系统架构: $ARCH${NC}"
        echo -e "${RED}当前只支持amd64, arm64和386架构${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}检测到系统类型: $OS, 架构: $ARCH${NC}"
    
    # 构建下载文件名
    DOWNLOAD_FILE="cliplink_${OS}_${ARCH}.tar.gz"
    DOWNLOAD_URL="${BASE_URL}/${DOWNLOAD_FILE}"
    
    echo -e "${GREEN}将下载: $DOWNLOAD_URL${NC}"
}

# 下载并安装
download_and_install() {
    # 如果安装目录不是当前目录，则创建并进入
    if [ "$INSTALL_DIR" != "." ]; then
        mkdir -p "$INSTALL_DIR"
        cd "$INSTALL_DIR" || { echo -e "${RED}无法进入安装目录${NC}"; exit 1; }
        echo -e "${GREEN}已创建并进入目录: $INSTALL_DIR${NC}"
    fi
    
    echo -e "${YELLOW}下载应用程序包...${NC}"
    
    # 检查是否有wget或curl
    if command -v wget &>/dev/null; then
        wget -q --show-progress "$DOWNLOAD_URL" -O "$DOWNLOAD_FILE"
    elif command -v curl &>/dev/null; then
        curl -L --progress-bar "$DOWNLOAD_URL" -o "$DOWNLOAD_FILE"
    else
        echo -e "${RED}错误: 需要wget或curl来下载文件${NC}"
        exit 1
    fi
    
    # 检查下载是否成功
    if [ ! -f "$DOWNLOAD_FILE" ]; then
        echo -e "${RED}下载失败: 无法获取文件${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}解压文件...${NC}"
    tar -xzf "$DOWNLOAD_FILE"
    
    # 检查解压是否成功
    if [ ! -f "cliplink" ] && [ ! -f "cliplink.exe" ]; then
        echo -e "${RED}解压失败: 未找到应用程序可执行文件${NC}"
        exit 1
    fi
    
    # 确保run.sh有执行权限
    if [ -f "run.sh" ]; then
        chmod +x run.sh
        echo -e "${GREEN}已设置run.sh可执行权限${NC}"
    else
        echo -e "${RED}警告: 未找到run.sh文件${NC}"
    fi
    
    # 确保cliplink有执行权限
    if [ -f "cliplink" ]; then
        chmod +x cliplink
        echo -e "${GREEN}已设置cliplink可执行权限${NC}"
    fi
    
    # 清理下载的压缩包
    rm -f "$DOWNLOAD_FILE"
    
    echo -e "${GREEN}安装完成!${NC}"
}

# 配置端口
configure_port() {
    if [ -f "run.sh" ]; then
        echo -e "${YELLOW}配置应用端口为: $PORT${NC}"
        # 使用sed修改run.sh中的端口设置
        sed -i.bak "s/APP_PORT=\"[0-9]*\"/APP_PORT=\"$PORT\"/g" run.sh
        rm -f run.sh.bak
    fi
}

# 启动应用
start_app() {
    echo -e "${YELLOW}启动应用程序...${NC}"
    
    # 检查端口是否被占用
    if check_port "$PORT"; then
        if ! handle_port_conflict "$PORT"; then
            echo -e "${RED}部署失败: 无法解决端口冲突${NC}"
            exit 1
        fi
    fi
    
    if [ -f "run.sh" ]; then
        if ./run.sh start; then
            echo -e "${GREEN}应用程序已成功启动!${NC}"
            
            # 尝试获取服务器IP，支持多种系统
            SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1 || echo "服务器IP")
            
            echo -e "${GREEN}您可以通过 http://${SERVER_IP}:$PORT 访问应用${NC}"
            echo -e "${YELLOW}--------------------------------------------------${NC}"
            echo -e "${YELLOW}常用命令:${NC}"
            
            # 获取安装的绝对路径
            ABSOLUTE_PATH=$(pwd)
            
            echo -e "${YELLOW}  启动: ${NC}cd $ABSOLUTE_PATH && ./run.sh start"
            echo -e "${YELLOW}  停止: ${NC}cd $ABSOLUTE_PATH && ./run.sh stop"
            echo -e "${YELLOW}  状态: ${NC}cd $ABSOLUTE_PATH && ./run.sh status"
            echo -e "${YELLOW}  日志: ${NC}cd $ABSOLUTE_PATH && ./run.sh logs"
            echo -e "${YELLOW}--------------------------------------------------${NC}"
        else
            echo -e "${RED}应用程序启动失败!${NC}"
            exit 1
        fi
    else
        echo -e "${RED}错误: 未找到run.sh${NC}"
        exit 1
    fi
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_OVERRIDE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 设置端口
PORT=${PORT:-$DEFAULT_PORT}

# 主程序
show_title
detect_system
download_and_install
configure_port
start_app 