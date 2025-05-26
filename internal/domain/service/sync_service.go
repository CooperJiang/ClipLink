package service

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// SyncService 同步服务接口
type SyncService interface {
	// GetSyncHistory 获取同步历史记录
	GetSyncHistory(channelID string, limit, offset int) ([]*model.SyncHistory, error)

	// LogSyncAction 记录同步操作
	LogSyncAction(deviceID, channelID, content string) error
}
