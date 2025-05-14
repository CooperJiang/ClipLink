package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/bootstrap"
	"github.com/xiaojiu/clipboard/internal/middleware"
	"github.com/xiaojiu/clipboard/internal/static"
)

func main() {
	// 使用bootstrap初始化应用
	server, err := bootstrap.Setup()
	if err != nil {
		log.Fatalf("初始化应用失败: %v", err)
	}

	// 获取路由
	router := server.Router()

	// 配置CORS中间件
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true // 允许所有来源
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	// 注意：使用AllowAllOrigins=true时，不能设置AllowCredentials=true

	router.Use(cors.New(corsConfig))

	// 设置静态文件路由
	setupStaticRoutes(router)

	// 启动服务器
	log.Println("服务器启动中...")
	log.Fatal(server.Run())
}

// 设置静态文件路由
func setupStaticRoutes(router *gin.Engine) {
	// 从static包获取静态文件系统
	webFS := static.GetWebFS()

	// 使用静态文件处理中间件
	router.Use(middleware.StaticFileHandler(webFS))
}
