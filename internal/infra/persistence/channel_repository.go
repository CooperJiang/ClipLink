package persistence

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/infra/db"
)

// channelRepository 通道仓库实现
type channelRepository struct{}

// NewChannelRepository 创建新的通道仓库
func NewChannelRepository() repository.ChannelRepository {
	return &channelRepository{}
}

// Save 保存通道
func (r *channelRepository) Save(channel *model.Channel) error {
	return db.GetDB().Create(channel).Error
}

// FindByID 通过ID查找通道
func (r *channelRepository) FindByID(channelID string) (*model.Channel, error) {
	var channel model.Channel
	err := db.GetDB().Where("id = ?", channelID).First(&channel).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
}

// Exists 检查通道是否存在
func (r *channelRepository) Exists(channelID string) (bool, error) {
	var count int64
	err := db.GetDB().Model(&model.Channel{}).Where("id = ?", channelID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
