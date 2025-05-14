package db

import (
	"errors"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB 封装数据库连接
type DB struct {
	db *gorm.DB
}

// Init 初始化SQLite数据库
func Init(dbPath string) (*DB, error) {
	// 配置GORM
	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// 连接数据库
	db, err := gorm.Open(sqlite.Open(dbPath), config)
	if err != nil {
		return nil, err
	}

	// 检查表是否存在
	hasTable := db.Migrator().HasTable(&ClipboardItem{})

	// 如果表已存在且我们需要添加新列，先执行手动迁移
	if hasTable {
		// 检查是否存在device_id列
		if !db.Migrator().HasColumn(&ClipboardItem{}, "device_id") {
			// 手动添加device_id列，设置默认值为"unknown"
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN device_id text DEFAULT 'unknown' NOT NULL").Error
			if err != nil {
				return nil, err
			}
		}

		// 检查是否存在title列
		if !db.Migrator().HasColumn(&ClipboardItem{}, "title") {
			// 手动添加title列，设置默认值为空字符串
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN title text DEFAULT ''").Error
			if err != nil {
				return nil, err
			}
		}

		// 检查是否存在favorite列
		if !db.Migrator().HasColumn(&ClipboardItem{}, "favorite") {
			// 手动添加favorite列，设置默认值为0（false）
			err := db.Exec("ALTER TABLE clipboard_items ADD COLUMN favorite boolean DEFAULT 0").Error
			if err != nil {
				return nil, err
			}
		}
	}

	// 自动迁移表结构
	if err := db.AutoMigrate(&ClipboardItem{}); err != nil {
		return nil, err
	}

	return &DB{db: db}, nil
}

// Close 关闭数据库连接
func (d *DB) Close() error {
	sqlDB, err := d.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// SaveClipboardItem 保存剪贴板项目
func (d *DB) SaveClipboardItem(item *ClipboardItem) error {
	return d.db.Create(item).Error
}

// GetLatestClipboardItem 获取最新的剪贴板项目
func (d *DB) GetLatestClipboardItem() (*ClipboardItem, error) {
	var item ClipboardItem

	// 检查是否有剪贴板项目
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个默认的
	if count == 0 {
		return &ClipboardItem{
			ID:        "default",
			Content:   "欢迎使用跨设备剪贴板！复制一些内容到你的设备上吧。",
			Type:      TypeText,
			CreatedAt: time.Now(),
			DeviceID:  "system",
		}, nil
	}

	// 获取最新的项目
	if err := d.db.Order("created_at DESC").First(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

// GetClipboardHistory 获取剪贴板历史记录
func (d *DB) GetClipboardHistory(limit int, offset int) ([]*ClipboardItem, error) {
	var items []*ClipboardItem

	// 检查是否有剪贴板项目
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录，添加分页功能
	if err := d.db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// DeleteClipboardItem 删除剪贴板项目
func (d *DB) DeleteClipboardItem(id string) error {
	if id == "" {
		return errors.New("ID不能为空")
	}

	// 删除项目
	result := d.db.Where("id = ?", id).Delete(&ClipboardItem{})
	if result.Error != nil {
		return result.Error
	}

	// 检查是否找到并删除了项目
	if result.RowsAffected == 0 {
		return errors.New("找不到指定ID的项目")
	}

	return nil
}

// GetFavoriteClipboardItems 获取已收藏的剪贴板项目
func (d *DB) GetFavoriteClipboardItems(limit int) ([]*ClipboardItem, error) {
	var items []*ClipboardItem

	// 检查是否有收藏的剪贴板项目
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("favorite = ?", true).Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有收藏项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取收藏列表，按时间降序
	if err := d.db.Where("favorite = ?", true).Order("created_at DESC").Limit(limit).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// UpdateClipboardItem 更新剪贴板项目
func (d *DB) UpdateClipboardItem(id string, updates map[string]interface{}) error {
	if id == "" {
		return errors.New("ID不能为空")
	}

	// 更新项目
	result := d.db.Model(&ClipboardItem{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	// 检查是否找到并更新了项目
	if result.RowsAffected == 0 {
		return errors.New("找不到指定ID的项目")
	}

	return nil
}

// ToggleFavorite 切换收藏状态
func (d *DB) ToggleFavorite(id string) error {
	if id == "" {
		return errors.New("ID不能为空")
	}

	// 先获取当前项目
	var item ClipboardItem
	if err := d.db.Where("id = ?", id).First(&item).Error; err != nil {
		return err
	}

	// 切换收藏状态
	return d.db.Model(&ClipboardItem{}).Where("id = ?", id).Update("favorite", !item.Favorite).Error
}

// GetClipboardItemByID 通过ID获取剪贴板项目
func (d *DB) GetClipboardItemByID(id string) (*ClipboardItem, error) {
	if id == "" {
		return nil, errors.New("ID不能为空")
	}

	var item ClipboardItem
	if err := d.db.Where("id = ?", id).First(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

// GetClipboardHistoryCount 获取剪贴板历史记录总数
func (d *DB) GetClipboardHistoryCount() (int64, error) {
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// GetClipboardByType 按内容类型获取剪贴板历史记录
func (d *DB) GetClipboardByType(contentType string, limit, offset int) ([]*ClipboardItem, error) {
	var items []*ClipboardItem

	// 检查是否有符合条件的剪贴板项目
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("type = ?", contentType).Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录
	if err := d.db.Where("type = ?", contentType).Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetClipboardByTypeCount 获取指定内容类型的剪贴板记录总数
func (d *DB) GetClipboardByTypeCount(contentType string) (int64, error) {
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("type = ?", contentType).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
func (d *DB) GetClipboardByDeviceType(deviceType string, limit, offset int) ([]*ClipboardItem, error) {
	var items []*ClipboardItem

	// 检查是否有符合条件的剪贴板项目
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("device_type = ?", deviceType).Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录
	if err := d.db.Where("device_type = ?", deviceType).Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetClipboardByDeviceTypeCount 获取指定设备类型的剪贴板记录总数
func (d *DB) GetClipboardByDeviceTypeCount(deviceType string) (int64, error) {
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("device_type = ?", deviceType).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// GetClipboardByTypeAndDeviceType 同时按内容类型和设备类型获取剪贴板历史记录
func (d *DB) GetClipboardByTypeAndDeviceType(contentType string, deviceType string, limit, offset int) ([]*ClipboardItem, error) {
	var items []*ClipboardItem

	// 检查是否有符合条件的剪贴板项目
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("type = ? AND device_type = ?", contentType, deviceType).Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录
	if err := d.db.Where("type = ? AND device_type = ?", contentType, deviceType).Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetClipboardByTypeAndDeviceTypeCount 获取指定内容类型和设备类型的剪贴板记录总数
func (d *DB) GetClipboardByTypeAndDeviceTypeCount(contentType string, deviceType string) (int64, error) {
	var count int64
	if err := d.db.Model(&ClipboardItem{}).Where("type = ? AND device_type = ?", contentType, deviceType).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
