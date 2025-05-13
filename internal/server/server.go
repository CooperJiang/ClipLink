package server

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

// Server 表示HTTP服务器
type Server struct {
	router   *gin.Engine
	config   *config.Config
	db       *db.DB
	staticFS embed.FS
}

// New 创建新的服务器实例
func New(cfg *config.Config, database *db.DB, staticFS embed.FS) *Server {
	// 设置为发布模式，避免一些调试警告
	gin.SetMode(gin.ReleaseMode)

	// 创建不带中间件的引擎
	r := gin.New()

	// 手动添加恢复中间件
	r.Use(gin.Recovery())

	server := &Server{
		router:   r,
		config:   cfg,
		db:       database,
		staticFS: staticFS,
	}

	// 设置路由
	server.setupRoutes()

	return server
}

// setupRoutes 设置所有路由
func (s *Server) setupRoutes() {
	// 禁用重定向
	s.router.RedirectTrailingSlash = false
	s.router.RedirectFixedPath = false

	// API路由
	apiRoutes := s.router.Group("/api")
	{
		api.RegisterRoutes(apiRoutes, s.db)
	}

	// 静态文件服务
	fsys, err := fs.Sub(s.staticFS, "web")
	if err != nil {
		log.Fatalf("无法获取嵌入式文件系统: %v", err)
	}

	// 主页路由 - 同时处理 / 和 /index.html
	s.router.GET("/", func(c *gin.Context) {
		c.FileFromFS("index.html", http.FS(fsys))
	})

	s.router.GET("/index.html", func(c *gin.Context) {
		c.FileFromFS("index.html", http.FS(fsys))
	})

	// 静态资源
	s.router.GET("/static/*filepath", func(c *gin.Context) {
		c.FileFromFS(c.Param("filepath")[1:], http.FS(fsys))
	})
}

// Start 启动HTTP服务器
func (s *Server) Start() error {
	return s.router.Run(s.config.ServerAddress)
}
