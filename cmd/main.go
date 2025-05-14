package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/bootstrap"
)

//go:embed web
var webFS embed.FS

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

	// 统一处理所有静态文件，不分开处理CSS和JS
	router.GET("/static/*filepath", func(c *gin.Context) {
		filepath := c.Param("filepath")
		if filepath == "" || filepath == "/" {
			c.String(http.StatusNotFound, "无效的文件路径")
			return
		}

		// 去掉前导斜杠
		if filepath[0] == '/' {
			filepath = filepath[1:]
		}

		data, err := fs.ReadFile(webRoot, "static/"+filepath)
		if err != nil {
			c.String(http.StatusNotFound, "找不到静态文件: "+filepath)
			return
		}

		// 根据文件扩展名设置适当的Content-Type
		contentType := "application/octet-stream"
		switch {
		case strings.HasSuffix(filepath, ".css"):
			contentType = "text/css; charset=utf-8"
		case strings.HasSuffix(filepath, ".js"):
			contentType = "application/javascript; charset=utf-8"
		case strings.HasSuffix(filepath, ".html"):
			contentType = "text/html; charset=utf-8"
		case strings.HasSuffix(filepath, ".png"):
			contentType = "image/png"
		case strings.HasSuffix(filepath, ".jpg"), strings.HasSuffix(filepath, ".jpeg"):
			contentType = "image/jpeg"
		case strings.HasSuffix(filepath, ".gif"):
			contentType = "image/gif"
		case strings.HasSuffix(filepath, ".svg"):
			contentType = "image/svg+xml"
		}

		c.Data(http.StatusOK, contentType, data)
	})
}
