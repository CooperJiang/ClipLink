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

# 启动应用程序
start() {
    if check_if_running; then
        echo -e "${YELLOW}应用程序已在运行中 (PID: $(cat ${PID_FILE}))${NC}"
        return
    fi
    
    echo -e "${YELLOW}启动应用程序...${NC}"
    nohup "$APP_BIN" > "$LOG_FILE" 2> "$ERROR_LOG_FILE" &
    echo $! > "$PID_FILE"
    sleep 2
    
    if check_if_running; then
        echo -e "${GREEN}应用程序已成功启动 (PID: $(cat ${PID_FILE}))${NC}"
    else
        echo -e "${RED}启动应用程序失败，请检查错误日志:${NC}"
        tail -n 10 "$ERROR_LOG_FILE"
    fi
}

# 停止应用程序
stop() {
    if ! check_if_running; then
        echo -e "${YELLOW}应用程序未在运行${NC}"
        return
    fi
    
    echo -e "${YELLOW}停止应用程序...${NC}"
    PID=$(cat "$PID_FILE")
    kill "$PID"
    
    # 等待进程结束
    TIMEOUT=10
    while [ $TIMEOUT -gt 0 ]; do
        if ! ps -p "$PID" > /dev/null; then
            break
        fi
        sleep 1
        TIMEOUT=$((TIMEOUT - 1))
    done
    
    # 如果进程仍在运行，强制终止
    if [ $TIMEOUT -eq 0 ]; then
        echo -e "${YELLOW}应用程序未响应，强制终止...${NC}"
        kill -9 "$PID"
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}应用程序已停止${NC}"
}

# 重启应用程序
restart() {
    echo -e "${YELLOW}重启应用程序...${NC}"
    stop
    start
}

# 查看应用程序状态
status() {
    if check_if_running; then
        echo -e "${GREEN}应用程序正在运行 (PID: $(cat ${PID_FILE}))${NC}"
    else
        echo -e "${YELLOW}应用程序未在运行${NC}"
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

# 显示帮助信息
show_help() {
    echo "使用方法: $0 {start|stop|restart|status|logs|error_logs|follow|follow_error|help}"
    echo ""
    echo "选项:"
    echo "  start         启动应用程序"
    echo "  stop          停止应用程序"
    echo "  restart       重启应用程序"
    echo "  status        查看应用程序状态"
    echo "  logs [行数]   查看应用程序日志 (默认50行)"
    echo "  error_logs [行数] 查看错误日志 (默认50行)"
    echo "  follow        实时查看应用程序日志"
    echo "  follow_error  实时查看错误日志"
    echo "  help          显示帮助信息"
}

# 主逻辑
case "$1" in
    start)
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
    help|*)
        show_help
        ;;
esac

exit 0 