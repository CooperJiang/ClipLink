package repository

import (
	"time"

	"github.com/xiaojiu/cliplink/internal/model"
	"gorm.io/gorm"
)

// ChannelRepository 通道仓库接口
type ChannelRepository interface {
	// CreateChannel 创建通道
	CreateChannel(id string) (*model.Channel, error)
	// ChannelExists 检查通道是否存在
	ChannelExists(id string) (bool, error)
	// GetChannel 获取通道
	GetChannel(id string) (*model.Channel, error)
}

// ChannelRepositoryImpl 通道仓库实现
type ChannelRepositoryImpl struct {
	db *gorm.DB
}

// NewChannelRepository 创建通道仓库
func NewChannelRepository(db *gorm.DB) ChannelRepository {
	return &ChannelRepositoryImpl{
		db: db,
	}
}

// CreateChannel 创建通道
func (r *ChannelRepositoryImpl) CreateChannel(id string) (*model.Channel, error) {
	channel := &model.Channel{
		ID:        id,
		CreatedAt: time.Now(),
	}

	err := r.db.Create(channel).Error
	if err != nil {
		return nil, err
	}

	return channel, nil
}

// ChannelExists 检查通道是否存在
func (r *ChannelRepositoryImpl) ChannelExists(id string) (bool, error) {
	var count int64
	err := r.db.Model(&model.Channel{}).Where("id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetChannel 获取通道
func (r *ChannelRepositoryImpl) GetChannel(id string) (*model.Channel, error) {
	var channel model.Channel
	err := r.db.Where("id = ?", id).First(&channel).Error
	if err != nil {
		return nil, err
	}

	return &channel, nil
}
