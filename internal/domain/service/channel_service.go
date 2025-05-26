package service

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// ChannelService 频道服务接口
// ChannelService defines operations for managing channels
type ChannelService interface {
	// CreateChannel 创建新的频道
	// CreateChannel creates a new channel with given ID, or generates a new ID if empty
	CreateChannel(channelID string) (*model.Channel, error)

	// GetChannel 通过ID获取频道
	// GetChannel retrieves a channel by its ID
	GetChannel(channelID string) (*model.Channel, error)

	// ChannelExists 检查频道是否存在
	// ChannelExists checks if a channel exists by its ID
	ChannelExists(channelID string) (bool, error)

	// VerifyChannel 验证频道存在且有效
	// VerifyChannel verifies if a channel exists and is valid
	VerifyChannel(channelID string) (bool, error)

	// GetChannelStats 获取频道统计信息
	// GetChannelStats retrieves statistics for a channel
	GetChannelStats(channelID string) (*model.ChannelStats, error)
}
