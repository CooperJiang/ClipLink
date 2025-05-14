package bootstrap

import (
	"log"

	"github.com/xiaojiu/clipboard/internal/config"
	"github.com/xiaojiu/clipboard/internal/server"
)

// Setup 初始化应用程序
func Setup() (*server.Server, error) {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
		return nil, err
	}

	// 创建服务器
	srv, err := server.NewServer(cfg)
	if err != nil {
		log.Fatalf("创建服务器失败: %v", err)
		return nil, err
	}

	return srv, nil
}
