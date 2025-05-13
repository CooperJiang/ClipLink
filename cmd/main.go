package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/api"
	"github.com/xiaojiu/clipboard/internal/config"
	"github.com/xiaojiu/clipboard/internal/db"
)

//go:embed web
var webFS embed.FS

func main() {
	// 初始化配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化数据库
	database, err := db.Init(cfg.DBPath)
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer database.Close()

	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	// 创建router
	router := gin.Default()

	// 设置API路由
	setupAPIRoutes(router, database)

	// 设置静态文件路由
	setupStaticRoutes(router)

	// 启动服务器
	log.Printf("服务器启动在 %s\n", cfg.ServerAddress)
	log.Fatal(router.Run(cfg.ServerAddress))
}

// 设置API路由
func setupAPIRoutes(router *gin.Engine, database *db.DB) {
	apiGroup := router.Group("/api")
	{
		// 使用API包中的路由注册函数
		api.RegisterRoutes(apiGroup, database)
	}
}

// 设置静态文件路由
func setupStaticRoutes(router *gin.Engine) {
	// 从嵌入式文件系统获取web子目录
	webRoot, err := fs.Sub(webFS, "web")
	if err != nil {
		log.Printf("警告: 无法获取web子目录: %v", err)
		// 尝试使用完整的文件系统
		webRoot = webFS
	}

	// 测试嵌入式文件系统是否包含index.html
	_, err = fs.Stat(webRoot, "index.html")
	if err != nil {
		log.Printf("警告: 无法找到index.html: %v", err)
		// 列出文件系统内容以便调试
		entries, _ := fs.ReadDir(webRoot, ".")
		for _, entry := range entries {
			log.Printf("文件系统中的项目: %s", entry.Name())
		}
	}

	// 设置主页路由
	router.GET("/", func(c *gin.Context) {
		data, err := fs.ReadFile(webRoot, "index.html")
		if err != nil {
			c.String(http.StatusNotFound, "找不到主页文件")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})

	// 设置收藏页面路由
	router.GET("/favorites", func(c *gin.Context) {
		data, err := fs.ReadFile(webRoot, "favorites.html")
		if err != nil {
			c.String(http.StatusNotFound, "找不到收藏页面文件")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})

	// 设置静态文件服务
	staticServer := http.FileServer(http.FS(webRoot))
	router.GET("/static/*filepath", func(c *gin.Context) {
		// 移除'/static'前缀
		c.Request.URL.Path = c.Param("filepath")
		staticServer.ServeHTTP(c.Writer, c.Request)
	})
}
