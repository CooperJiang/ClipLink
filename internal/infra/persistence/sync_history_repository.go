package persistence

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/infra/db"
)

// syncHistoryRepository 同步历史仓库实现
type syncHistoryRepository struct{}

// NewSyncHistoryRepository 创建新的同步历史仓库
func NewSyncHistoryRepository() repository.SyncHistoryRepository {
	return &syncHistoryRepository{}
}

// Save 保存同步历史
func (r *syncHistoryRepository) Save(history *model.SyncHistory) error {
	return db.GetDB().Create(history).Error
}

// FindByChannel 查找通道下的同步历史
func (r *syncHistoryRepository) FindByChannel(channelID string, limit, offset int) ([]*model.SyncHistory, error) {
	var histories []*model.SyncHistory
	query := db.GetDB().Model(&model.SyncHistory{})

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&histories).Error
	return histories, err
}

// Count 统计通道下的同步历史数量
func (r *syncHistoryRepository) Count(channelID string) (int64, error) {
	var count int64
	query := db.GetDB().Model(&model.SyncHistory{})

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	err := query.Count(&count).Error
	return count, err
}
