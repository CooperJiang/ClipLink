package repository

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// SyncHistoryRepository 同步历史仓库接口
type SyncHistoryRepository interface {
	// Save 保存同步历史
	Save(history *model.SyncHistory) error

	// FindByChannel 查找通道下的同步历史
	FindByChannel(channelID string, limit, offset int) ([]*model.SyncHistory, error)

	// Count 统计通道下的同步历史数量
	Count(channelID string) (int64, error)
}
