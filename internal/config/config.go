package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Config 存储应用程序配置
type Config struct {
	// 主机名，例如 "localhost" 或 "0.0.0.0"
	Host string
	// 端口号，例如 8080
	Port int
	// 服务器地址，例如 ":8080"（向后兼容）
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
		Host:          "0.0.0.0",
		Port:          8080,
		ServerAddress: ":8080",
		DBPath:        filepath.Join(appDir, "clipboard.db"),
	}

	return cfg, nil
}

// GetServerAddress 获取服务器地址
// 为了向后兼容，同时支持新旧配置方式
func (c *Config) GetServerAddress() string {
	// 如果ServerAddress已定义且不是默认格式（即不是简单的端口号）
	if c.ServerAddress != "" && !strings.HasPrefix(c.ServerAddress, ":") {
		return c.ServerAddress
	}

	// 使用新的Host和Port配置
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// LoadFromFile 从指定文件路径加载配置
func LoadFromFile(configPath string) (*Config, error) {
	// 先获取默认配置
	cfg, err := Load()
	if err != nil {
		return nil, err
	}

	// 如果配置文件不存在，直接返回默认配置
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return cfg, nil
	}

	// 读取配置文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	// 解析配置文件（JSON格式）
	if err := json.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	return cfg, nil
}

// SaveToFile 将配置保存到文件
func SaveToFile(cfg *Config, configPath string) error {
	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return fmt.Errorf("创建配置目录失败: %w", err)
	}

	// 转换为JSON
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化配置失败: %w", err)
	}

	// 写入文件
	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %w", err)
	}

	return nil
}
