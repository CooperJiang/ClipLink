.PHONY: build run test clear-db reset-db help

# 默认目标
all: build

# 编译项目
build:
	go build -o bin/cliplink ./cmd/main.go

# 编译数据库工具
build-db-tools:
	go build -o bin/dbclear ./cmd/dbclear/main.go

# 运行项目
run:
	go run ./cmd/main.go

# 清空数据库（不添加初始数据）
clear-db: build-db-tools
	./bin/dbclear -clear

# 重置数据库（清空并添加初始数据）
reset-db: build-db-tools
	./bin/dbclear -reset

# 测试
test:
	go test -v ./...

# 帮助信息
help:
	@echo "可用的命令:"
	@echo "  make build      - 编译项目"
	@echo "  make run        - 运行项目"
	@echo "  make test       - 运行测试"
	@echo "  make clear-db   - 清空数据库（不添加初始数据）"
	@echo "  make reset-db   - 重置数据库（清空并添加初始数据）"
	@echo "  make help       - 显示此帮助信息" 