package service

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// ClipboardService 剪贴板服务接口
type ClipboardService interface {
	// SaveClipboard 保存剪贴板项目
	SaveClipboard(title, content, contentType, deviceID, deviceType, channelID string) (*model.ClipboardItem, error)

	// GetLatestClipboard 获取最新的剪贴板项目
	GetLatestClipboard(channelID string, limit int) ([]*model.ClipboardItem, error)

	// GetClipboardItem 获取剪贴板项目
	GetClipboardItem(id string, channelID string) (*model.ClipboardItem, error)

	// GetClipboardHistory 获取剪贴板历史记录
	GetClipboardHistory(channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)

	// DeleteClipboard 删除剪贴板项目
	DeleteClipboard(id string, channelID string) error

	// UpdateClipboard 更新剪贴板项目
	UpdateClipboard(id, title, content, contentType, deviceID, deviceType, channelID string) (*model.ClipboardItem, error)

	// ToggleFavorite 切换收藏状态
	ToggleFavorite(id string, isFavorite bool, channelID string, deviceID ...string) (*model.ClipboardItem, error)

	// GetFavoriteClipboard 获取收藏的剪贴板项目
	GetFavoriteClipboard(channelID string, limit int) ([]*model.ClipboardItem, error)

	// GetClipboardByType 按内容类型获取剪贴板历史记录
	GetClipboardByType(contentType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)

	// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
	GetClipboardByDeviceType(deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)

	// GetClipboardByTypeAndDeviceType 同时按内容类型和设备类型获取剪贴板历史记录
	GetClipboardByTypeAndDeviceType(contentType, deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)

	// SearchClipboard 按关键词搜索剪贴板项目
	SearchClipboard(keyword, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
}
