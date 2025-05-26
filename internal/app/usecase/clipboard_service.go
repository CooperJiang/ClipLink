package usecase

import (
	"time"

	"github.com/google/uuid"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// clipboardService 剪贴板服务实现
type clipboardService struct {
	clipboardRepo   repository.ClipboardRepository
	syncHistoryRepo repository.SyncHistoryRepository
}

// NewClipboardService 创建新的剪贴板服务
func NewClipboardService(
	clipboardRepo repository.ClipboardRepository,
	syncHistoryRepo repository.SyncHistoryRepository,
) service.ClipboardService {
	return &clipboardService{
		clipboardRepo:   clipboardRepo,
		syncHistoryRepo: syncHistoryRepo,
	}
}

// SaveClipboard 保存剪贴板项目
func (s *clipboardService) SaveClipboard(title, content, contentType, deviceID, deviceType, channelID string) (*model.ClipboardItem, error) {
	item := &model.ClipboardItem{
		ID:         uuid.New().String(),
		Title:      title,
		Content:    content,
		Type:       contentType,
		DeviceID:   deviceID,
		DeviceType: deviceType,
		ChannelID:  channelID,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// 保存到数据库
	if err := s.clipboardRepo.Save(item); err != nil {
		return nil, err
	}

	return item, nil
}

// GetLatestClipboard 获取最新的剪贴板项目
func (s *clipboardService) GetLatestClipboard(channelID string, limit int) ([]*model.ClipboardItem, error) {
	return s.clipboardRepo.FindLatest(channelID, limit)
}

// GetClipboardItem 获取剪贴板项目
func (s *clipboardService) GetClipboardItem(id string, channelID string) (*model.ClipboardItem, error) {
	return s.clipboardRepo.FindByID(id, channelID)
}

// GetClipboardHistory 获取剪贴板历史记录
func (s *clipboardService) GetClipboardHistory(channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	return s.clipboardRepo.FindWithPagination(channelID, page, size)
}

// DeleteClipboard 删除剪贴板项目
func (s *clipboardService) DeleteClipboard(id string, channelID string) error {
	// 记录同步历史
	item, err := s.clipboardRepo.FindByID(id, channelID)
	if err != nil {
		return err
	}

	// 从数据库删除
	if err := s.clipboardRepo.Delete(id, channelID); err != nil {
		return err
	}

	// 记录同步历史
	syncHistory := &model.SyncHistory{
		Action:    model.ActionDelete,
		Content:   "删除剪贴板内容: " + item.Type,
		DeviceID:  item.DeviceID,
		ChannelID: channelID,
		CreatedAt: time.Now(),
	}

	return s.syncHistoryRepo.Save(syncHistory)
}

// UpdateClipboard 更新剪贴板项目
func (s *clipboardService) UpdateClipboard(id, title, content, contentType, deviceID, deviceType, channelID string) (*model.ClipboardItem, error) {
	// 更新内容
	updates := map[string]interface{}{
		"title":       title,
		"content":     content,
		"type":        contentType,
		"device_id":   deviceID,
		"device_type": deviceType,
		"updated_at":  time.Now(),
	}

	// 更新到数据库
	if err := s.clipboardRepo.Update(id, channelID, updates); err != nil {
		return nil, err
	}

	// 记录同步历史
	syncHistory := &model.SyncHistory{
		Action:    model.ActionUpdate,
		Content:   "更新剪贴板内容: " + contentType,
		DeviceID:  deviceID,
		ChannelID: channelID,
		CreatedAt: time.Now(),
	}

	if err := s.syncHistoryRepo.Save(syncHistory); err != nil {
		return nil, err
	}

	// 获取更新后的数据
	return s.clipboardRepo.FindByID(id, channelID)
}

// ToggleFavorite 切换收藏状态
func (s *clipboardService) ToggleFavorite(id string, isFavorite bool, channelID string, deviceID ...string) (*model.ClipboardItem, error) {
	// 获取当前项目
	item, err := s.clipboardRepo.FindByID(id, channelID)
	if err != nil {
		return nil, err
	}

	// 设置收藏状态为指定值
	updates := map[string]interface{}{
		"favorite":   isFavorite,
		"updated_at": time.Now(),
	}

	// 更新到数据库
	if err := s.clipboardRepo.Update(id, channelID, updates); err != nil {
		return nil, err
	}

	// 记录同步历史（如果提供了设备ID）
	if len(deviceID) > 0 && deviceID[0] != "" {
		// 记录同步动作
		action := "收藏"
		if !isFavorite {
			action = "取消收藏"
		}
		syncHistory := &model.SyncHistory{
			Action:    action,
			Content:   item.Title,
			DeviceID:  deviceID[0],
			ChannelID: channelID,
			CreatedAt: time.Now(),
		}
		// 忽略同步历史保存错误，不影响主流程
		_ = s.syncHistoryRepo.Save(syncHistory)
	}

	// 获取更新后的数据
	return s.clipboardRepo.FindByID(id, channelID)
}

// GetFavoriteClipboard 获取收藏的剪贴板项目
func (s *clipboardService) GetFavoriteClipboard(channelID string, limit int) ([]*model.ClipboardItem, error) {
	return s.clipboardRepo.FindFavorites(channelID, limit)
}

// GetClipboardByType 按内容类型获取剪贴板历史记录
func (s *clipboardService) GetClipboardByType(contentType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	return s.clipboardRepo.FindByType(contentType, channelID, page, size)
}

// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
func (s *clipboardService) GetClipboardByDeviceType(deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	return s.clipboardRepo.FindByDeviceType(deviceType, channelID, page, size)
}

// GetClipboardByTypeAndDeviceType 同时按内容类型和设备类型获取剪贴板历史记录
func (s *clipboardService) GetClipboardByTypeAndDeviceType(contentType, deviceType string, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	return s.clipboardRepo.FindByTypeAndDeviceType(contentType, deviceType, channelID, page, size)
}

// SearchClipboard 按关键词搜索剪贴板项目
func (s *clipboardService) SearchClipboard(keyword, channelID string, page, size int) (items []*model.ClipboardItem, total int64, totalPages int, err error) {
	// 验证关键词不为空
	if keyword == "" {
		return []*model.ClipboardItem{}, 0, 0, nil
	}

	// 调用仓库层搜索方法
	return s.clipboardRepo.SearchByKeyword(keyword, channelID, page, size)
}
