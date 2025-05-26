package repository

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// ClipboardRepository 剪贴板仓库接口
type ClipboardRepository interface {
	// Save 保存剪贴板项目
	Save(item *model.ClipboardItem) error

	// FindByID 通过ID查找剪贴板项目
	FindByID(id, channelID string) (*model.ClipboardItem, error)

	// FindLatest 获取最新的剪贴板项目
	FindLatest(channelID string, limit int) ([]*model.ClipboardItem, error)

	// FindWithPagination 分页获取剪贴板项目
	FindWithPagination(channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error)

	// FindByType 按类型查找剪贴板项目
	FindByType(contentType, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error)

	// FindByDeviceType 按设备类型查找剪贴板项目
	FindByDeviceType(deviceType, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error)

	// FindByTypeAndDeviceType 同时按内容类型和设备类型查找剪贴板项目
	FindByTypeAndDeviceType(contentType, deviceType, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error)

	// FindFavorites 查找收藏的剪贴板项目
	FindFavorites(channelID string, limit int) ([]*model.ClipboardItem, error)

	// Update 更新剪贴板项目
	Update(id, channelID string, updates map[string]interface{}) error

	// Delete 删除剪贴板项目
	Delete(id, channelID string) error

	// Count 统计剪贴板项目数量
	Count(channelID string) (int64, error)

	// CountByType 按类型统计剪贴板项目数量
	CountByType(contentType, channelID string) (int64, error)

	// SearchByKeyword 按关键词搜索剪贴板项目（支持标题和内容搜索）
	SearchByKeyword(keyword, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error)
}
