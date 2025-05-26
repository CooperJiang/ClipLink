package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/xiaojiu/cliplink/internal/app"
)

func main() {
	// 定义命令行参数
	port := flag.String("port", "8080", "服务器端口号")
	flag.Parse()

	// 初始化所有依赖（数据库、API 路由等）
	router, err := app.BuildRouter()
	if err != nil {
		log.Fatalf("初始化服务失败: %v", err)
	}

	// 设置静态文件路由 - 使用正确的静态文件处理逻辑
	app.SetupStaticRoutes(router)

	// 构建监听地址
	addr := fmt.Sprintf(":%s", *port)

	log.Printf("服务器启动中，监听端口: %s", *port)
	log.Fatal(http.ListenAndServe(addr, router))
}
