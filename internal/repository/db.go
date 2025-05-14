package repository

import (
	"github.com/xiaojiu/clipboard/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB 初始化SQLite数据库
func InitDB(dbPath string) (*gorm.DB, error) {
	// 配置GORM
	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// 连接数据库
	db, err := gorm.Open(sqlite.Open(dbPath), config)
	if err != nil {
		return nil, err
	}

	// 检查剪贴板表是否存在
	hasClipboardTable := db.Migrator().HasTable(&model.ClipboardItem{})

	// 如果表已存在且我们需要添加新列，先执行手动迁移
	if hasClipboardTable {
		// 检查是否存在device_id列
		if !db.Migrator().HasColumn(&model.ClipboardItem{}, "device_id") {
			// 手动添加device_id列，设置默认值为"unknown"
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN device_id text DEFAULT 'unknown' NOT NULL").Error
			if err != nil {
				return nil, err
			}
		}

		// 检查是否存在title列
		if !db.Migrator().HasColumn(&model.ClipboardItem{}, "title") {
			// 手动添加title列，设置默认值为空字符串
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN title text DEFAULT ''").Error
			if err != nil {
				return nil, err
			}
		}

		// 检查是否存在favorite列
		if !db.Migrator().HasColumn(&model.ClipboardItem{}, "favorite") {
			// 手动添加favorite列，设置默认值为0（false）
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN favorite boolean DEFAULT 0").Error
			if err != nil {
				return nil, err
			}
		}

		// 检查是否存在device_type列
		if !db.Migrator().HasColumn(&model.ClipboardItem{}, "device_type") {
			// 手动添加device_type列，设置默认值为"other"
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN device_type text DEFAULT 'other' NOT NULL").Error
			if err != nil {
				return nil, err
			}
		}

		// 检查是否存在channel_id列
		if !db.Migrator().HasColumn(&model.ClipboardItem{}, "channel_id") {
			// 手动添加channel_id列，设置默认值为空字符串
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN channel_id text DEFAULT ''").Error
			if err != nil {
				return nil, err
			}

			// 为channel_id列添加索引以提高查询性能
			err = db.Exec("CREATE INDEX idx_clipboard_items_channel_id ON clipboard_items(channel_id)").Error
			if err != nil {
				return nil, err
			}
		}
	}

	// 自动迁移表结构
	if err := db.AutoMigrate(&model.ClipboardItem{}, &model.Channel{}); err != nil {
		return nil, err
	}

	return db, nil
}
