package db

import (
	"sync"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	// 使用纯Go实现的SQLite驱动
	"github.com/glebarez/sqlite" // 这是基于modernc.org/sqlite的GORM适配器
)

// 定义全局单例
var (
	instance *gorm.DB
	once     sync.Once
	initErr  error
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

// Init 初始化SQLite数据库
func Init(dbPath string) (*DB, error) {
	once.Do(func() {
		// 配置GORM
		config := &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		}

		// 连接数据库
		var db *gorm.DB
		db, initErr = gorm.Open(sqlite.Open(dbPath), config)
		if initErr != nil {
			return
		}

		// 设置全局实例
		instance = db

		// 执行数据库迁移
		initErr = MigrateDB()
	})

	// 检查初始化是否成功
	if initErr != nil {
		return nil, initErr
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
