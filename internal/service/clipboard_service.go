package service

import (
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/xiaojiu/cliplink/internal/model"
	"github.com/xiaojiu/cliplink/internal/repository"
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

type ClipboardServiceImpl struct {
	repo repository.ClipboardRepository
}

func NewClipboardService(repo repository.ClipboardRepository) ClipboardService {
	return &ClipboardServiceImpl{
		repo: repo,
	}
}

func (s *ClipboardServiceImpl) SaveClipboard(content, clipType, deviceID, deviceType, title, channelID string) (*model.ClipboardItem, error) {
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

	if err := s.repo.Save(item); err != nil {
		return nil, err
	}

	return item, nil
}

func (s *ClipboardServiceImpl) GetLatestClipboard(channelID string) (*model.ClipboardItem, error) {
	return s.repo.GetLatest(channelID)
}

func (s *ClipboardServiceImpl) GetClipboardItem(id string, channelID string) (*model.ClipboardItem, error) {
	return s.repo.GetByID(id, channelID)
}

func (s *ClipboardServiceImpl) GetClipboardHistory(channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	offset := (page - 1) * size

	total, err = s.repo.GetHistoryCount(channelID)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages = int(math.Ceil(float64(total) / float64(size)))

	items, err = s.repo.GetHistory(channelID, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

func (s *ClipboardServiceImpl) DeleteClipboard(id string, channelID string) error {
	return s.repo.Delete(id, channelID)
}

func (s *ClipboardServiceImpl) UpdateClipboard(id, title, content, contentType, deviceType, channelID string) (*model.ClipboardItem, error) {
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

	if len(updates) == 0 {
		return nil, nil
	}

	if err := s.repo.Update(id, channelID, updates); err != nil {
		return nil, err
	}

	return s.repo.GetByID(id, channelID)
}

func (s *ClipboardServiceImpl) ToggleFavorite(id string, channelID string) (*model.ClipboardItem, error) {
	if err := s.repo.ToggleFavorite(id, channelID); err != nil {
		return nil, err
	}

	return s.repo.GetByID(id, channelID)
}

func (s *ClipboardServiceImpl) GetFavorites(channelID string, limit int) ([]*model.ClipboardItem, error) {
	return s.repo.GetFavorites(channelID, limit)
}

func (s *ClipboardServiceImpl) GetClipboardByType(contentType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	offset := (page - 1) * size

	total, err = s.repo.GetByTypeCount(channelID, contentType)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages = int(math.Ceil(float64(total) / float64(size)))

	items, err = s.repo.GetByType(channelID, contentType, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

func (s *ClipboardServiceImpl) GetClipboardByDeviceType(deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 计算偏移量
	offset := (page - 1) * size

	total, err = s.repo.GetByDeviceTypeCount(channelID, deviceType)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages = int(math.Ceil(float64(total) / float64(size)))

	items, err = s.repo.GetByDeviceType(channelID, deviceType, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

func (s *ClipboardServiceImpl) GetClipboardByTypeAndDeviceType(contentType, deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	offset := (page - 1) * size

	conditions := make(map[string]interface{})
	conditions["type"] = contentType
	conditions["device_type"] = deviceType
	if channelID != "" {
		conditions["channel_id"] = channelID
	}

	total, err = s.repo.GetCountWithConditions(conditions)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages = int(math.Ceil(float64(total) / float64(size)))

	items, err = s.repo.GetWithConditions(conditions, size, offset)
	if err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}
