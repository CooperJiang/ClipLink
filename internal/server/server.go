package server

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/config"
	"github.com/xiaojiu/clipboard/internal/controller"
	"github.com/xiaojiu/clipboard/internal/repository"
)

// Server API服务器
type Server struct {
	router *gin.Engine
	cfg    *config.Config
}

// NewServer 创建新的服务器实例
func NewServer(cfg *config.Config) (*Server, error) {
	// 初始化数据库
	db, err := repository.InitDB(cfg.DBPath)
	if err != nil {
		return nil, fmt.Errorf("初始化数据库失败: %w", err)
	}

	// 创建gin路由
	router := gin.Default()

	// 创建API路由组
	apiGroup := router.Group("/api")

	// 注册API路由
	controller.RegisterRoutes(apiGroup, db)

	return &Server{
		router: router,
		cfg:    cfg,
	}, nil
}

// Run 启动服务器
func (s *Server) Run() error {
	// 启动HTTP服务器
	return s.router.Run(s.cfg.GetServerAddress())
}

// Router 获取路由引擎
func (s *Server) Router() *gin.Engine {
	return s.router
}
