package main

import (
	"flag"
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"github.com/xiaojiu/clipboard/internal/config"
	"github.com/xiaojiu/clipboard/internal/db/migrations"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	dbPath   string
	resetDb  bool
	clearDb  bool
	confPath string
)

func init() {
	// 定义命令行参数
	flag.StringVar(&dbPath, "db", "", "数据库文件路径（如果不指定，将使用配置文件中的路径）")
	flag.BoolVar(&resetDb, "reset", false, "重置数据库（清空并添加初始数据）")
	flag.BoolVar(&clearDb, "clear", false, "清空数据库（不添加初始数据）")
	flag.StringVar(&confPath, "config", "", "配置文件路径")
	flag.Parse()

	// 如果没有指定任何操作，默认重置数据库
	if !resetDb && !clearDb {
		resetDb = true
	}
}

func main() {
	var cfg *config.Config
	var err error

	// 加载配置
	if confPath != "" {
		cfg, err = config.LoadFromFile(confPath)
	} else {
		cfg, err = config.Load()
	}

	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 如果指定了数据库路径，使用指定的路径
	if dbPath != "" {
		cfg.DBPath = dbPath
	}

	log.Printf("使用数据库: %s", cfg.DBPath)

	// 确保数据库文件所在目录存在
	dbDir := filepath.Dir(cfg.DBPath)
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			log.Fatalf("创建数据库目录失败: %v", err)
		}
	}

	// 初始化数据库连接
	gormDB, err := gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}

	// 获取原始数据库连接以便关闭
	sqlDB, err := gormDB.DB()
	if err != nil {
		log.Fatalf("获取数据库连接失败: %v", err)
	}
	defer sqlDB.Close()

	// 执行数据库操作
	if resetDb {
		log.Println("正在重置数据库...")
		if err := migrations.ResetDatabase(gormDB); err != nil {
			log.Fatalf("重置数据库失败: %v", err)
		}
		log.Println("数据库重置完成！")
	} else if clearDb {
		log.Println("正在清空数据库...")
		if err := migrations.ClearDatabase(gormDB); err != nil {
			log.Fatalf("清空数据库失败: %v", err)
		}
		log.Println("数据库清空完成！")
	}
}
