package usecase

import (
	"time"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// syncService 同步服务实现
type syncService struct {
	syncHistoryRepo repository.SyncHistoryRepository
}

// NewSyncService 创建新的同步服务
func NewSyncService(syncHistoryRepo repository.SyncHistoryRepository) service.SyncService {
	return &syncService{
		syncHistoryRepo: syncHistoryRepo,
	}
}

// GetSyncHistory 获取同步历史记录
func (s *syncService) GetSyncHistory(channelID string, limit, offset int) ([]*model.SyncHistory, error) {
	return s.syncHistoryRepo.FindByChannel(channelID, limit, offset)
}

// LogSyncAction 记录同步操作
func (s *syncService) LogSyncAction(deviceID, channelID, content string) error {
	history := &model.SyncHistory{
		Action:    model.ActionSync,
		Content:   content,
		DeviceID:  deviceID,
		ChannelID: channelID,
		CreatedAt: time.Now(),
	}

	return s.syncHistoryRepo.Save(history)
}
