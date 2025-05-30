package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/xiaojiu/cliplink/internal/app"
	"github.com/xiaojiu/cliplink/internal/config"
)

func main() {
	// 定义命令行参数
	configFile := flag.String("config", "", "配置文件路径 (默认: ./config.yml)")
	flag.Parse()

	// 加载配置
	var cfg *config.Config
	var err error

	if *configFile != "" {
		// 使用指定的配置文件
		cfg, err = config.LoadFromFile(*configFile)
	} else {
		// 使用默认配置文件路径（当前目录）
		defaultConfigPath := "config.yml"
		cfg, err = config.LoadFromFile(defaultConfigPath)
	}

	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 输出当前配置信息
	log.Printf("数据库类型: %s", cfg.GetDatabaseType())
	switch cfg.GetDatabaseType() {
	case "mysql":
		log.Printf("MySQL 连接: %s@%s:%d/%s", cfg.MySQL.Username, cfg.MySQL.Host, cfg.MySQL.Port, cfg.MySQL.Database)
	case "sqlite":
		log.Printf("SQLite 数据库: %s", cfg.GetDSN())
	}

	// 初始化所有依赖（数据库、API 路由等）
	router, err := app.BuildRouterWithConfig(cfg)
	if err != nil {
		log.Fatalf("初始化服务失败: %v", err)
	}

	// 设置静态文件路由 - 使用正确的静态文件处理逻辑
	app.SetupStaticRoutes(router)

	// 构建监听地址
	addr := fmt.Sprintf(":%d", cfg.Port)

	log.Printf("服务器启动中，监听端口: %d", cfg.Port)
	log.Fatal(http.ListenAndServe(addr, router))
}
