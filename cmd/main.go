package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/bootstrap"
	"github.com/xiaojiu/cliplink/internal/middleware"
	"github.com/xiaojiu/cliplink/internal/static"
)

func main() {
	server, err := bootstrap.Setup()
	if err != nil {
		log.Fatalf("初始化应用失败: %v", err)
	}

	router := server.Router()

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}

	router.Use(cors.New(corsConfig))

	setupStaticRoutes(router)

	log.Println("服务器启动中...")
	log.Fatal(server.Run())
}

func setupStaticRoutes(router *gin.Engine) {
	webFS := static.GetWebFS()
	router.Use(middleware.StaticFileHandler(webFS))
}
