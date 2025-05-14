package service

import (
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/xiaojiu/clipboard/internal/model"
	"github.com/xiaojiu/clipboard/internal/repository"
)

// ClipboardService 剪贴板服务接口
type ClipboardService interface {
	SaveClipboard(content, clipType, deviceID, deviceType, title, channelID string) (*model.ClipboardItem, error)
	GetLatestClipboard(channelID string) (*model.ClipboardItem, error)
	GetClipboardItem(id string, channelID string) (*model.ClipboardItem, error)
	GetClipboardHistory(channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
	DeleteClipboard(id string, channelID string) error
	UpdateClipboard(id, title, content, contentType, deviceType, channelID string) (*model.ClipboardItem, error)
	ToggleFavorite(id string, channelID string) (*model.ClipboardItem, error)
	GetFavorites(channelID string, limit int) ([]*model.ClipboardItem, error)
	GetClipboardByType(contentType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
	GetClipboardByDeviceType(deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
	GetClipboardByTypeAndDeviceType(contentType, deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
}

// ClipboardServiceImpl 剪贴板服务实现
type ClipboardServiceImpl struct {
	repo repository.ClipboardRepository
}

// NewClipboardService 创建剪贴板服务
func NewClipboardService(repo repository.ClipboardRepository) ClipboardService {
	return &ClipboardServiceImpl{
		repo: repo,
	}
}

// SaveClipboard 保存剪贴板内容
func (s *ClipboardServiceImpl) SaveClipboard(content, clipType, deviceID, deviceType, title, channelID string) (*model.ClipboardItem, error) {
	// 创建新的剪贴板项目
	item := &model.ClipboardItem{
		ID:         uuid.New().String(),
		Content:    content,
		Type:       clipType,
		Title:      title,
		CreatedAt:  time.Now(),
		DeviceID:   deviceID,
		DeviceType: deviceType,
		ChannelID:  channelID,
	}

	// 保存到数据库
	if err := s.repo.Save(item); err != nil {
		return nil, err
	}

	return item, nil
}

// GetLatestClipboard 获取最新的剪贴板内容
func (s *ClipboardServiceImpl) GetLatestClipboard(channelID string) (*model.ClipboardItem, error) {
	return s.repo.GetLatest(channelID)
}

// GetClipboardItem 获取单个剪贴板项目
func (s *ClipboardServiceImpl) GetClipboardItem(id string, channelID string) (*model.ClipboardItem, error) {
	return s.repo.GetByID(id, channelID)
}

// GetClipboardHistory 获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardHistory(channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 获取总记录数
	total, err = s.repo.GetHistoryCount(channelID)
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetHistory(channelID, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// DeleteClipboard 删除剪贴板项目
func (s *ClipboardServiceImpl) DeleteClipboard(id string, channelID string) error {
	return s.repo.Delete(id, channelID)
}

// UpdateClipboard 更新剪贴板项目
func (s *ClipboardServiceImpl) UpdateClipboard(id, title, content, contentType, deviceType, channelID string) (*model.ClipboardItem, error) {
	// 构建更新参数
	updates := make(map[string]interface{})
	if title != "" {
		updates["title"] = title
	}
	if content != "" {
		updates["content"] = content
	}
	if contentType != "" {
		updates["type"] = contentType
	}
	if deviceType != "" {
		updates["device_type"] = deviceType
	}

	// 如果没有更新项，直接返回
	if len(updates) == 0 {
		return nil, nil
	}

	// 更新项目
	if err := s.repo.Update(id, channelID, updates); err != nil {
		return nil, err
	}

	// 获取更新后的项目并返回
	return s.repo.GetByID(id, channelID)
}

// ToggleFavorite 切换收藏状态
func (s *ClipboardServiceImpl) ToggleFavorite(id string, channelID string) (*model.ClipboardItem, error) {
	// 切换收藏状态
	if err := s.repo.ToggleFavorite(id, channelID); err != nil {
		return nil, err
	}

	// 获取更新后的项目并返回
	return s.repo.GetByID(id, channelID)
}

// GetFavorites 获取收藏的剪贴板项目
func (s *ClipboardServiceImpl) GetFavorites(channelID string, limit int) ([]*model.ClipboardItem, error) {
	return s.repo.GetFavorites(channelID, limit)
}

// GetClipboardByType 按内容类型获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardByType(contentType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 获取总记录数
	total, err = s.repo.GetByTypeCount(channelID, contentType)
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetByType(channelID, contentType, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardByDeviceType(deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 获取总记录数
	total, err = s.repo.GetByDeviceTypeCount(channelID, deviceType)
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetByDeviceType(channelID, deviceType, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// GetClipboardByTypeAndDeviceType 同时按内容类型和设备类型获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardByTypeAndDeviceType(contentType, deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 先创建一个临时的查询条件
	conditions := make(map[string]interface{})
	conditions["type"] = contentType
	conditions["device_type"] = deviceType
	if channelID != "" {
		conditions["channel_id"] = channelID
	}

	// 获取总记录数
	total, err = s.repo.GetCountWithConditions(conditions)
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetWithConditions(conditions, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}
