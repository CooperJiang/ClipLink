package repository

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// ChannelRepository 通道仓库接口
type ChannelRepository interface {
	// Save 保存通道
	Save(channel *model.Channel) error

	// FindByID 通过ID查找通道
	FindByID(channelID string) (*model.Channel, error)

	// Exists 检查通道是否存在
	Exists(channelID string) (bool, error)
}
