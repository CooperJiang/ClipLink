package db

import (
	"fmt"
	"sync"

	"github.com/xiaojiu/cliplink/internal/config"
	"github.com/xiaojiu/cliplink/internal/domain/model"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	// 数据库驱动
	"github.com/glebarez/sqlite" // SQLite驱动
	"gorm.io/driver/mysql"       // MySQL驱动
)

// 定义全局单例
var (
	instance *gorm.DB
	mu       sync.Mutex
)

// DB 封装数据库连接（保留向后兼容）
type DB struct {
	db *gorm.DB
}

// GetDB 返回内部的gorm.DB实例
func (d *DB) GetDB() *gorm.DB {
	return d.db
}

// GetDB 返回全局gorm.DB实例
func GetDB() *gorm.DB {
	if instance == nil {
		panic("数据库未初始化，请先调用Init函数")
	}
	return instance
}

// Init 初始化数据库（向后兼容的接口）
func Init(dbPath string) (*DB, error) {
	// 创建一个默认的SQLite配置
	cfg := &config.Config{
		Host: "0.0.0.0",
		Port: 8080,
	}
	return InitWithConfig(cfg)
}

// InitWithConfig 使用配置初始化数据库
func InitWithConfig(cfg *config.Config) (*DB, error) {
	mu.Lock()
	defer mu.Unlock()

	// 配置GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// 根据数据库类型选择对应的驱动
	var dialector gorm.Dialector
	dsn := cfg.GetDSN()
	dbType := cfg.GetDatabaseType()

	switch dbType {
	case "mysql":
		dialector = mysql.Open(dsn)
	case "sqlite":
		dialector = sqlite.Open(dsn)
	default:
		return nil, fmt.Errorf("不支持的数据库类型: %s", dbType)
	}

	// 连接数据库
	db, err := gorm.Open(dialector, gormConfig)
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %w", err)
	}

	// 设置全局实例
	instance = db

	// 执行数据库迁移
	if err := MigrateDB(); err != nil {
		return nil, fmt.Errorf("数据库迁移失败: %w", err)
	}

	// 返回兼容的DB结构体
	return &DB{db: instance}, nil
}

// MigrateDB 执行数据库表迁移
func MigrateDB() error {
	// 统一迁移所有表结构
	return instance.AutoMigrate(
		&model.ClipboardItem{},
		&model.Channel{},
		&model.Device{},
		&model.DeviceChannel{},
		&model.SyncHistory{},
	)
}

// Close 关闭数据库连接
func (d *DB) Close() error {
	sqlDB, err := d.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
