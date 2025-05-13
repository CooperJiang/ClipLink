package config

import (
	"os"
	"path/filepath"
)

// Config 存储应用程序配置
type Config struct {
	// 服务器地址，例如 ":8080"
	ServerAddress string
	// 数据库文件路径
	DBPath string
}

// Load 加载应用程序配置
func Load() (*Config, error) {
	// 获取用户主目录
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	// 创建应用程序数据目录（如果不存在）
	appDir := filepath.Join(homeDir, ".clipboard")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, err
	}

	// 默认配置
	cfg := &Config{
		ServerAddress: ":8080",
		DBPath:        filepath.Join(appDir, "clipboard.db"),
	}

	return cfg, nil
}
