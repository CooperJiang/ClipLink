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
	SaveClipboard(content, clipType, deviceID, deviceType, title string) (*model.ClipboardItem, error)
	GetLatestClipboard() (*model.ClipboardItem, error)
	GetClipboardItem(id string) (*model.ClipboardItem, error)
	GetClipboardHistory(page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
	DeleteClipboard(id string) error
	UpdateClipboard(id, title, content, contentType, deviceType string) (*model.ClipboardItem, error)
	ToggleFavorite(id string) (*model.ClipboardItem, error)
	GetFavorites(limit int) ([]*model.ClipboardItem, error)
	GetClipboardByType(contentType string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
	GetClipboardByDeviceType(deviceType string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
	GetClipboardByTypeAndDeviceType(contentType, deviceType string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error)
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
func (s *ClipboardServiceImpl) SaveClipboard(content, clipType, deviceID, deviceType, title string) (*model.ClipboardItem, error) {
	// 创建新的剪贴板项目
	item := &model.ClipboardItem{
		ID:         uuid.New().String(),
		Content:    content,
		Type:       clipType,
		Title:      title,
		CreatedAt:  time.Now(),
		DeviceID:   deviceID,
		DeviceType: deviceType,
	}

	// 保存到数据库
	if err := s.repo.Save(item); err != nil {
		return nil, err
	}

	return item, nil
}

// GetLatestClipboard 获取最新的剪贴板内容
func (s *ClipboardServiceImpl) GetLatestClipboard() (*model.ClipboardItem, error) {
	return s.repo.GetLatest()
}

// GetClipboardItem 获取单个剪贴板项目
func (s *ClipboardServiceImpl) GetClipboardItem(id string) (*model.ClipboardItem, error) {
	return s.repo.GetByID(id)
}

// GetClipboardHistory 获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardHistory(page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 获取总记录数
	total, err = s.repo.GetHistoryCount()
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetHistory(size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// DeleteClipboard 删除剪贴板项目
func (s *ClipboardServiceImpl) DeleteClipboard(id string) error {
	return s.repo.Delete(id)
}

// UpdateClipboard 更新剪贴板项目
func (s *ClipboardServiceImpl) UpdateClipboard(id, title, content, contentType, deviceType string) (*model.ClipboardItem, error) {
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
	if err := s.repo.Update(id, updates); err != nil {
		return nil, err
	}

	// 获取更新后的项目并返回
	return s.repo.GetByID(id)
}

// ToggleFavorite 切换收藏状态
func (s *ClipboardServiceImpl) ToggleFavorite(id string) (*model.ClipboardItem, error) {
	// 切换收藏状态
	if err := s.repo.ToggleFavorite(id); err != nil {
		return nil, err
	}

	// 获取更新后的项目并返回
	return s.repo.GetByID(id)
}

// GetFavorites 获取收藏的剪贴板项目
func (s *ClipboardServiceImpl) GetFavorites(limit int) ([]*model.ClipboardItem, error) {
	return s.repo.GetFavorites(limit)
}

// GetClipboardByType 按内容类型获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardByType(contentType string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 获取总记录数
	total, err = s.repo.GetByTypeCount(contentType)
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetByType(contentType, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardByDeviceType(deviceType string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 获取总记录数
	total, err = s.repo.GetByDeviceTypeCount(deviceType)
	if err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages = int(math.Ceil(float64(total) / float64(size)))

	// 获取历史记录
	items, err = s.repo.GetByDeviceType(deviceType, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// GetClipboardByTypeAndDeviceType 同时按内容类型和设备类型获取剪贴板历史记录
func (s *ClipboardServiceImpl) GetClipboardByTypeAndDeviceType(contentType, deviceType string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	// 先创建一个临时的查询条件
	conditions := make(map[string]interface{})
	conditions["type"] = contentType
	conditions["device_type"] = deviceType

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
