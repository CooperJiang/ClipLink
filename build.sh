#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认设置
DEFAULT_OS="linux"
DEFAULT_ARCH="amd64"
# 移除CGO设置，我们始终使用CGO_ENABLED=0

# 参数设置
TARGET_OS=${DEFAULT_OS}
TARGET_ARCH=${DEFAULT_ARCH}
CUSTOM_OUTPUT=""
PORT="8080" # 默认端口设置

# 输出目录
RELEASE_DIR="release"
OUTPUT_NAME="clipboard"

# 显示标题
show_title() {
    clear
    echo -e "${BLUE}=======================================================${NC}"
    echo -e "${BLUE}        剪贴板应用构建脚本 - 统一构建工具            ${NC}"
    echo -e "${BLUE}=======================================================${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  all                  使用默认配置快速构建前后端"
    echo "  -f, --frontend       只构建前端"
    echo "  -b, --backend        只构建后端"
    echo "  -a, --all            构建前端和后端 (默认)"
    echo "  -o, --os <os>        设置目标操作系统 (linux, darwin, windows) 默认: ${DEFAULT_OS}"
    echo "  -r, --arch <arch>    设置目标架构 (amd64, arm64, 386) 默认: ${DEFAULT_ARCH}"
    echo "  -n, --name <name>    设置输出文件名 默认: ${OUTPUT_NAME}"
    echo "  -p, --port <port>    设置应用程序端口 默认: ${PORT}"
    echo "  -h, --help           显示此帮助信息"
    echo ""
    echo "例子:"
    echo "  $0                   # 显示交互式菜单"
    echo "  $0 all               # 使用默认配置快速构建前后端"
    echo "  $0 --frontend        # 只构建前端"
    echo "  $0 --backend --os darwin       # 只构建后端 (Mac)"
    echo "  $0 --backend --port 3000       # 只构建后端，设置端口为3000"
    echo "  $0 --all                       # 构建前端和后端"
    echo ""
}

# 构建前端
build_frontend() {
    echo -e "\n${YELLOW}开始构建前端项目...${NC}"

    # 进入前端项目目录
    cd web || { echo -e "${RED}无法进入web目录${NC}"; return 1; }

    # 安装依赖
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install

    # 构建项目
    echo -e "${YELLOW}构建前端项目...${NC}"
    npm run build

    # 检查构建是否成功
    if [ ! -d "dist" ]; then
        echo -e "${RED}前端构建失败，未找到dist目录${NC}"
        cd ..
        return 1
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

    echo -e "${GREEN}前端构建和复制完成!${NC}"
    return 0
}

# 构建后端
build_backend() {
    echo -e "\n${YELLOW}开始构建后端...${NC}"
    
    # 设置交叉编译环境
    export GOOS=${TARGET_OS}
    export GOARCH=${TARGET_ARCH}
    export CGO_ENABLED=0  # 始终禁用CGO

    # 调整输出文件名
    if [ -z "$CUSTOM_OUTPUT" ]; then
        FULL_OUTPUT_NAME="${OUTPUT_NAME}_${TARGET_OS}_${TARGET_ARCH}"
        if [ ${TARGET_OS} = "windows" ]; then
            FULL_OUTPUT_NAME="${FULL_OUTPUT_NAME}.exe"
        fi
    else
        FULL_OUTPUT_NAME="${CUSTOM_OUTPUT}"
        if [ ${TARGET_OS} = "windows" ] && [[ ! $FULL_OUTPUT_NAME =~ \.exe$ ]]; then
            FULL_OUTPUT_NAME="${FULL_OUTPUT_NAME}.exe"
        fi
    fi

    echo -e "${YELLOW}目标系统: ${TARGET_OS}${NC}"
    echo -e "${YELLOW}目标架构: ${TARGET_ARCH}${NC}"
    echo -e "${YELLOW}应用端口: ${PORT}${NC}"

    # 创建release目录（如果不存在）
    mkdir -p ${RELEASE_DIR}

    # 编译Go程序
    echo -e "${YELLOW}开始编译Go程序为${TARGET_OS}/${TARGET_ARCH}二进制文件...${NC}"
    echo -e "${YELLOW}不使用CGO${NC}"

    go build -o ${RELEASE_DIR}/${FULL_OUTPUT_NAME} ./cmd/main.go

    # 检查编译是否成功
    if [ ! -f "${RELEASE_DIR}/${FULL_OUTPUT_NAME}" ]; then
        echo -e "${RED}Go程序编译失败${NC}"
        return 1
    fi

    echo -e "${GREEN}二进制文件构建成功!${NC}"
    echo -e "${GREEN}输出文件: ${RELEASE_DIR}/${FULL_OUTPUT_NAME}${NC}"

    # 设置可执行权限
    chmod +x ${RELEASE_DIR}/${FULL_OUTPUT_NAME}

    # 复制运行脚本到release目录并根据端口设置进行修改
    cp run.sh ${RELEASE_DIR}/
    chmod +x ${RELEASE_DIR}/run.sh
    
    # 如果指定了非默认端口，则修改run.sh中的端口设置
    if [ "${PORT}" != "8080" ]; then
        echo -e "${YELLOW}更新运行脚本中的端口设置为: ${PORT}${NC}"
        sed -i.bak "s/APP_PORT=\"8080\"/APP_PORT=\"${PORT}\"/g" ${RELEASE_DIR}/run.sh
        rm -f ${RELEASE_DIR}/run.sh.bak
    fi

    # 创建部署目录
    DEPLOY_DIR="${TARGET_OS}_${TARGET_ARCH}"
    mkdir -p ${RELEASE_DIR}/${DEPLOY_DIR}

    # 复制文件到部署目录 - 确保二进制文件名称固定为clipboard
    cp ${RELEASE_DIR}/${FULL_OUTPUT_NAME} ${RELEASE_DIR}/${DEPLOY_DIR}/${OUTPUT_NAME}
    cp ${RELEASE_DIR}/run.sh ${RELEASE_DIR}/${DEPLOY_DIR}/

    # 打包部署文件
    DEPLOY_PACKAGE="${RELEASE_DIR}/${OUTPUT_NAME}_${TARGET_OS}_${TARGET_ARCH}.tar.gz"
    echo -e "${YELLOW}创建部署包: ${DEPLOY_PACKAGE}${NC}"
    # 在macOS上防止创建 ._ 元数据文件
    if [[ "$(uname)" == "Darwin" ]]; then
        echo -e "${YELLOW}检测到macOS系统，禁用元数据文件生成...${NC}"
        export COPYFILE_DISABLE=1
    fi
    tar -czf ${DEPLOY_PACKAGE} -C ${RELEASE_DIR}/${DEPLOY_DIR} .

    # 在部署包中添加README说明文件
    cat > ${RELEASE_DIR}/${DEPLOY_DIR}/README.txt << EOL
剪贴板应用程序部署说明:

1. 使用以下命令启动应用程序:
   - 启动: ./run.sh start
   - 停止: ./run.sh stop
   - 重启: ./run.sh restart
   - 查看状态: ./run.sh status
   - 查看日志: ./run.sh logs

2. 数据库将自动创建在用户主目录的 ~/.clipboard/ 目录下

3. 应用程序端口: ${PORT}
EOL

    echo -e "${GREEN}部署包已创建: ${DEPLOY_PACKAGE}${NC}"
    echo -e "${YELLOW}你可以使用以下命令将部署包上传到服务器:${NC}"
    echo -e "  scp ${DEPLOY_PACKAGE} user@server:/path/to/destination/"

    # 清理临时文件，只保留最终的压缩包
    echo -e "${YELLOW}清理临时文件...${NC}"
    rm -f ${RELEASE_DIR}/${FULL_OUTPUT_NAME}
    rm -f ${RELEASE_DIR}/run.sh
    rm -rf ${RELEASE_DIR}/${DEPLOY_DIR}
    
    echo -e "${GREEN}后端构建完成!${NC}"
    return 0
}

# 显示交互式菜单
show_menu() {
    show_title
    echo -e "请选择要执行的操作:"
    echo -e "  ${GREEN}1)${NC} 只构建前端"
    echo -e "  ${GREEN}2)${NC} 只构建后端"
    echo -e "  ${GREEN}3)${NC} 构建前端和后端"
    echo -e "  ${GREEN}0)${NC} 退出"
    echo ""
    read -p "请输入选项 (0-3): " option
    
    case $option in
        1)
            build_frontend
            ;;
        2)
            show_backend_menu
            ;;
        3)
            build_frontend && show_backend_menu
            ;;
        0)
            echo -e "${YELLOW}退出构建脚本${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项，请重新选择${NC}"
            sleep 1
            show_menu
            ;;
    esac
}

# 显示后端构建菜单
show_backend_menu() {
    show_title
    echo -e "后端构建配置:"
    echo -e ""
    echo -e "目标操作系统:"
    echo -e "  ${GREEN}1)${NC} Linux (默认)"
    echo -e "  ${GREEN}2)${NC} macOS (Darwin)"
    echo -e "  ${GREEN}3)${NC} Windows"
    echo -e ""
    read -p "请选择目标操作系统 (1-3) [默认:1]: " os_option
    
    case $os_option in
        2)
            TARGET_OS="darwin"
            ;;
        3)
            TARGET_OS="windows"
            ;;
        *)
            TARGET_OS="linux"
            ;;
    esac
    
    echo -e ""
    echo -e "目标架构:"
    echo -e "  ${GREEN}1)${NC} amd64 - x86_64 (默认)"
    echo -e "  ${GREEN}2)${NC} arm64 - ARM 64位"
    echo -e "  ${GREEN}3)${NC} 386 - x86 32位"
    echo -e ""
    read -p "请选择目标架构 (1-3) [默认:1]: " arch_option
    
    case $arch_option in
        2)
            TARGET_ARCH="arm64"
            ;;
        3)
            TARGET_ARCH="386"
            ;;
        *)
            TARGET_ARCH="amd64"
            ;;
    esac
    
    echo -e ""
    echo -e "应用端口设置:"
    echo -e "  当前端口: ${PORT}"
    read -p "请输入应用端口 [默认:${PORT}]: " port_input
    if [[ ! -z "$port_input" ]]; then
        PORT=$port_input
    fi
    
    # 确认设置
    show_title
    echo -e "${YELLOW}后端构建配置确认:${NC}"
    echo -e "目标系统: ${GREEN}${TARGET_OS}${NC}"
    echo -e "目标架构: ${GREEN}${TARGET_ARCH}${NC}"
    echo -e "应用端口: ${GREEN}${PORT}${NC}"
    echo -e ""
    read -p "确认以上设置并开始构建? (y/n) [默认:y]: " -n 1 -r confirm
    echo
    
    if [[ -z "$confirm" || $confirm =~ ^[Yy]$ ]]; then
        build_backend
    else
        echo -e "${YELLOW}已取消构建${NC}"
        show_menu
    fi
}

# 解析命令行参数
if [ $# -eq 0 ]; then
    show_menu
    exit 0
fi

# 快速构建命令
if [ "$1" = "all" ]; then
    echo -e "${YELLOW}使用默认配置快速构建前后端...${NC}"
    # 使用默认值，无需交互
    TARGET_OS=${DEFAULT_OS}
    TARGET_ARCH=${DEFAULT_ARCH}
    PORT="8080"
    build_frontend && build_backend
    echo -e "\n${GREEN}构建任务完成!${NC}"
    exit 0
fi

# 构建类型
BUILD_TYPE="all"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--frontend)
            BUILD_TYPE="frontend"
            shift
            ;;
        -b|--backend)
            BUILD_TYPE="backend"
            shift
            ;;
        -a|--all)
            BUILD_TYPE="all"
            shift
            ;;
        -o|--os)
            TARGET_OS="$2"
            shift 2
            ;;
        -r|--arch)
            TARGET_ARCH="$2"
            shift 2
            ;;
        -n|--name)
            OUTPUT_NAME="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
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

# 验证目标系统
case ${TARGET_OS} in
    linux|darwin|windows)
        ;;
    *)
        echo -e "${RED}错误: 不支持的操作系统 '${TARGET_OS}'${NC}"
        echo -e "${YELLOW}支持的操作系统: linux, darwin, windows${NC}"
        exit 1
        ;;
esac

# 验证目标架构
case ${TARGET_ARCH} in
    amd64|arm64|386)
        ;;
    *)
        echo -e "${RED}错误: 不支持的架构 '${TARGET_ARCH}'${NC}"
        echo -e "${YELLOW}支持的架构: amd64, arm64, 386${NC}"
        exit 1
        ;;
esac

# 执行相应的构建类型
case ${BUILD_TYPE} in
    frontend)
        build_frontend
        ;;
    backend)
        build_backend
        ;;
    all)
        build_frontend && build_backend
        ;;
esac

echo -e "\n${GREEN}构建任务完成!${NC}" 