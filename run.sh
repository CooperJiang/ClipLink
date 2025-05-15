#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 应用程序名称
APP_NAME="clipboard"
# 应用程序二进制文件路径
APP_BIN="./${APP_NAME}"
# PID文件路径
PID_FILE="./clipboard.pid"
# 日志文件路径
LOG_FILE="./clipboard.log"
# 错误日志文件路径
ERROR_LOG_FILE="./clipboard_error.log"
# 应用程序端口 (如果需要检查端口是否在使用)
APP_PORT="8080"

# 检查应用程序是否正在运行
check_if_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            return 0 # 应用程序正在运行
        else
            # PID文件存在但进程不存在，清理PID文件
            rm -f "$PID_FILE"
        fi
    fi
    return 1 # 应用程序没有运行
}

# 查找可用的二进制文件
find_executable() {
    # 首先尝试当前目录下的clipboard
    if [ -f "./${APP_NAME}" ]; then
        APP_BIN="./${APP_NAME}"
        echo -e "${GREEN}找到二进制文件: ${APP_BIN}${NC}"
        return 0
    fi
    
    # 检查当前目录下的其他可能的二进制文件
    for file in ./clipboard_* ./app ./server; do
        if [ -f "$file" ] && [ -x "$file" ]; then
            APP_BIN="$file"
            echo -e "${GREEN}找到替代二进制文件: ${APP_BIN}${NC}"
            return 0
        fi
    done
    
    # 通用搜索任何可执行文件
    for file in *.exe clipboard_* *_linux_* *_darwin_* *_amd64 *_arm64; do
        if [ -f "$file" ] && [ -x "$file" ]; then
            APP_BIN="./$file"
            echo -e "${GREEN}找到可能的二进制文件: ${APP_BIN}${NC}"
            return 0
        fi
    done
    
    echo -e "${RED}错误: 找不到可执行的二进制文件${NC}"
    return 1
}

# 检查应用程序是否可执行
check_executable() {
    find_executable
    
    if [ ! -f "$APP_BIN" ]; then
        echo -e "${RED}错误: 应用程序二进制文件不存在: $APP_BIN${NC}"
        return 1
    fi
    
    if [ ! -x "$APP_BIN" ]; then
        echo -e "${YELLOW}设置可执行权限...${NC}"
        chmod +x "$APP_BIN"
    fi
    
    return 0
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i :$port -t &>/dev/null
        return $?
    elif command -v netstat &>/dev/null; then
        netstat -tuln | grep -q ":$port "
        return $?
    elif command -v ss &>/dev/null; then
        ss -tuln | grep -q ":$port "
        return $?
    fi
    # 如果没有可用命令，假设端口未被使用
    return 1
}

# 查找端口占用的进程
find_port_process() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i :$port -t
    elif command -v netstat &>/dev/null; then
        netstat -tuln | grep ":$port " | awk '{print $7}' | cut -d'/' -f1
    elif command -v ss &>/dev/null; then
        ss -tuln | grep ":$port " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2
    fi
}

# 杀死占用端口的进程
kill_port_process() {
    local port=$1
    local force=$2
    local PIDS=$(find_port_process $port)
    
    if [ -z "$PIDS" ]; then
        echo -e "${YELLOW}未找到占用端口 $port 的进程${NC}"
        return 0
    fi
    
    for PID in $PIDS; do
        if [ "$force" = true ]; then
            echo -e "${YELLOW}强制终止进程 (PID: $PID)${NC}"
            kill -9 $PID 2>/dev/null
        else
            echo -e "${YELLOW}尝试正常终止进程 (PID: $PID)${NC}"
            kill $PID 2>/dev/null
            
            # 等待进程结束
            TIMEOUT=5
            while [ $TIMEOUT -gt 0 ]; do
                if ! ps -p $PID > /dev/null 2>&1; then
                    break
                fi
                sleep 1
                TIMEOUT=$((TIMEOUT - 1))
            done
            
            # 如果进程仍在运行，强制终止
            if [ $TIMEOUT -eq 0 ] && ps -p $PID > /dev/null 2>&1; then
                echo -e "${YELLOW}进程未响应，强制终止...${NC}"
                kill -9 $PID 2>/dev/null
            fi
        fi
    done
    
    # 再次检查端口是否已被释放
    sleep 1
    if check_port $port; then
        echo -e "${RED}警告: 端口 $port 仍然被占用，请手动检查和释放端口${NC}"
        return 1
    fi
    
    echo -e "${GREEN}端口 $port 已释放${NC}"
    return 0
}

# 启动应用程序
start() {
    if check_if_running; then
        echo -e "${YELLOW}应用程序已在运行中 (PID: $(cat ${PID_FILE}))${NC}"
        return
    fi
    
    # 检查可执行文件
    if ! check_executable; then
        echo -e "${RED}启动失败: 应用程序文件检查失败${NC}"
        return 1
    fi
    
    # 检查端口是否被占用
    if check_port "$APP_PORT"; then
        echo -e "${YELLOW}警告: 端口 $APP_PORT 已被占用${NC}"
        read -p "是否终止占用端口的进程并继续? (y/n) [默认:n]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}启动已取消${NC}"
            return 1
        fi
        
        # 尝试杀死占用端口的进程
        if ! kill_port_process "$APP_PORT" false; then
            read -p "是否强制终止占用端口的进程? (y/n) [默认:n]: " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}启动已取消${NC}"
                return 1
            fi
            kill_port_process "$APP_PORT" true
        fi
    fi
    
    echo -e "${YELLOW}启动应用程序...${NC}"
    # 确保日志目录存在
    mkdir -p $(dirname "$LOG_FILE")
    mkdir -p $(dirname "$ERROR_LOG_FILE")
    
    # 添加端口参数
    PORT_PARAM=""
    if [ ! -z "$APP_PORT" ]; then
        PORT_PARAM="--port $APP_PORT"
        echo -e "${YELLOW}应用程序将使用端口: ${APP_PORT}${NC}"
    fi
    
    nohup "$APP_BIN" $PORT_PARAM > "$LOG_FILE" 2> "$ERROR_LOG_FILE" &
    echo $! > "$PID_FILE"
    sleep 2
    
    if check_if_running; then
        echo -e "${GREEN}应用程序已成功启动 (PID: $(cat ${PID_FILE}))${NC}"
        
        # 等待应用程序完全启动
        echo -e "${YELLOW}等待应用程序初始化...${NC}"
        for i in {1..10}; do
            if grep -q "server started" "$LOG_FILE" 2>/dev/null; then
                echo -e "${GREEN}应用程序已完全初始化${NC}"
                break
            fi
            # 检查端口是否正在监听
            if ! check_port "$APP_PORT"; then
                echo -e "${YELLOW}等待端口 $APP_PORT 监听...${NC}"
            else
                echo -e "${GREEN}端口 $APP_PORT 已开始监听${NC}"
                break
            fi
            sleep 1
        done
        
        # 检查是否有错误
        if grep -q "error\|失败\|failed" "$ERROR_LOG_FILE" 2>/dev/null; then
            echo -e "${RED}警告: 检测到可能的错误，请查看错误日志:${NC}"
            cat "$ERROR_LOG_FILE"
        fi
    else
        echo -e "${RED}启动应用程序失败，请检查错误日志:${NC}"
        cat "$ERROR_LOG_FILE"
    fi
}

# 停止应用程序
stop() {
    if ! check_if_running; then
        echo -e "${YELLOW}应用程序未在运行${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}停止应用程序...${NC}"
    PID=$(cat "$PID_FILE")
    kill "$PID" 2>/dev/null
    
    # 等待进程结束
    TIMEOUT=10
    while [ $TIMEOUT -gt 0 ]; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 1
        TIMEOUT=$((TIMEOUT - 1))
    done
    
    # 如果进程仍在运行，强制终止
    if [ $TIMEOUT -eq 0 ]; then
        echo -e "${YELLOW}应用程序未响应，强制终止...${NC}"
        kill -9 "$PID" 2>/dev/null
        sleep 1
    fi
    
    # 最后检查一次
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${RED}警告: 无法终止应用程序 (PID: $PID)${NC}"
        return 1
    else
        rm -f "$PID_FILE"
        echo -e "${GREEN}应用程序已停止${NC}"
        return 0
    fi
}

# 重启应用程序
restart() {
    echo -e "${YELLOW}重启应用程序...${NC}"
    
    # 先尝试停止应用
    stop
    
    # 确保应用完全停止
    sleep 2
    
    # 检查端口是否被释放
    if check_port "$APP_PORT"; then
        echo -e "${YELLOW}警告: 端口 $APP_PORT 仍然被占用${NC}"
        read -p "是否强制释放端口并继续? (y/n) [默认:y]: " -n 1 -r
        echo
        if [[ -z "$REPLY" || $REPLY =~ ^[Yy]$ ]]; then
            kill_port_process "$APP_PORT" true
        else
            echo -e "${YELLOW}重启已取消${NC}"
            return 1
        fi
    fi
    
    # 启动应用
    start
}

# 查看应用程序状态
status() {
    if check_if_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}应用程序正在运行 (PID: $PID)${NC}"
        
        # 显示运行时间
        if command -v ps &>/dev/null; then
            UPTIME=$(ps -p $PID -o etime= 2>/dev/null)
            if [ -n "$UPTIME" ]; then
                echo -e "${GREEN}运行时间: $UPTIME${NC}"
            fi
        fi
        
        # 检查端口是否在监听
        if check_port "$APP_PORT"; then
            echo -e "${GREEN}端口 $APP_PORT 正在监听${NC}"
        else
            echo -e "${YELLOW}警告: 端口 $APP_PORT 未在监听${NC}"
        fi
    else
        echo -e "${YELLOW}应用程序未在运行${NC}"
        
        # 检查端口是否被其他程序占用
        if check_port "$APP_PORT"; then
            echo -e "${YELLOW}警告: 端口 $APP_PORT 被其他程序占用${NC}"
            PIDS=$(find_port_process "$APP_PORT")
            if [ -n "$PIDS" ]; then
                echo -e "${YELLOW}占用进程 PID: $PIDS${NC}"
            fi
        fi
    fi
}

# 查看日志
logs() {
    local lines=${1:-50}
    if [ -f "$LOG_FILE" ]; then
        tail -n "$lines" "$LOG_FILE"
    else
        echo -e "${RED}日志文件不存在${NC}"
    fi
}

# 查看错误日志
error_logs() {
    local lines=${1:-50}
    if [ -f "$ERROR_LOG_FILE" ]; then
        tail -n "$lines" "$ERROR_LOG_FILE"
    else
        echo -e "${RED}错误日志文件不存在${NC}"
    fi
}

# 实时查看日志
follow_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo -e "${RED}日志文件不存在${NC}"
    fi
}

# 实时查看错误日志
follow_error_logs() {
    if [ -f "$ERROR_LOG_FILE" ]; then
        tail -f "$ERROR_LOG_FILE"
    else
        echo -e "${RED}错误日志文件不存在${NC}"
    fi
}

# 显示数据库信息
db_info() {
    # 获取用户主目录
    homeDir=$(eval echo ~$USER)
    # 构建默认数据库路径
    DB_DEFAULT_PATH="${homeDir}/.clipboard/clipboard.db"
    
    echo -e "${YELLOW}应用程序使用的默认数据库路径: ${DB_DEFAULT_PATH}${NC}"
    
    if [ -f "$DB_DEFAULT_PATH" ]; then
        echo -e "${GREEN}数据库存在，文件大小: $(du -h "$DB_DEFAULT_PATH" | cut -f1)${NC}"
        
        # 检查是否安装了sqlite3命令
        if command -v sqlite3 &> /dev/null; then
            echo -e "${YELLOW}数据库表结构:${NC}"
            sqlite3 "$DB_DEFAULT_PATH" ".tables"
            echo
            sqlite3 "$DB_DEFAULT_PATH" ".schema clipboard_items"
            
            echo -e "\n${YELLOW}数据记录数量:${NC}"
            sqlite3 "$DB_DEFAULT_PATH" "SELECT COUNT(*) AS 记录数量 FROM clipboard_items;"
        else
            echo -e "${YELLOW}未安装sqlite3命令行工具，无法显示详细信息${NC}"
        fi
    else
        echo -e "${YELLOW}数据库文件不存在，将在应用程序首次启动时自动创建${NC}"
    fi
}

# 显示帮助信息
show_help() {
    echo "使用方法: $0 {start|stop|restart|status|logs|error_logs|follow|follow_error|db_info|help}"
    echo ""
    echo "选项:"
    echo "  start [--port|-p 端口]  启动应用程序 (可选指定端口，默认: ${APP_PORT})"
    echo "  stop                   停止应用程序"
    echo "  restart                重启应用程序"
    echo "  status                 查看应用程序状态"
    echo "  logs [行数]            查看应用程序日志 (默认50行)"
    echo "  error_logs [行数]      查看错误日志 (默认50行)"
    echo "  follow                 实时查看应用程序日志"
    echo "  follow_error           实时查看错误日志"
    echo "  db_info                显示数据库信息"
    echo "  help                   显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start              # 使用默认端口 ${APP_PORT} 启动"
    echo "  $0 start --port 3000  # 使用端口 3000 启动"
    echo "  $0 start -p 9090      # 使用端口 9090 启动"
}

# 主逻辑
case "$1" in
    start)
        shift
        # 解析额外的命令行参数
        while [[ $# -gt 0 ]]; do
            case "$1" in
                --port|-p)
                    if [[ $# -gt 1 ]]; then
                        APP_PORT="$2"
                        echo -e "${YELLOW}使用命令行指定的端口: ${APP_PORT}${NC}"
                        shift 2
                    else
                        echo -e "${RED}错误: --port/-p 选项需要一个参数${NC}"
                        exit 1
                    fi
                    ;;
                *)
                    echo -e "${RED}错误: 未知选项 $1${NC}"
                    shift
                    ;;
            esac
        done
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    error_logs)
        error_logs "$2"
        ;;
    follow)
        follow_logs
        ;;
    follow_error)
        follow_error_logs
        ;;
    db_info)
        db_info
        ;;
    help|*)
        show_help
        ;;
esac

exit 0 