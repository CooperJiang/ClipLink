package bootstrap

import (
	"log"

	"github.com/xiaojiu/cliplink/internal/config"
	"github.com/xiaojiu/cliplink/internal/server"
)

func Setup() (*server.Server, error) {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
		return nil, err
	}

	srv, err := server.NewServer(cfg)
	if err != nil {
		log.Fatalf("创建服务器失败: %v", err)
		return nil, err
	}

	return srv, nil
}
