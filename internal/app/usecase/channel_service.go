package usecase

import (
	"time"

	"github.com/google/uuid"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// channelService 频道服务实现
type channelService struct {
	channelRepo   repository.ChannelRepository
	clipboardRepo repository.ClipboardRepository
	deviceRepo    repository.DeviceRepository
}

// NewChannelService 创建新的频道服务
func NewChannelService(
	channelRepo repository.ChannelRepository,
	clipboardRepo repository.ClipboardRepository,
	deviceRepo repository.DeviceRepository,
) service.ChannelService {
	return &channelService{
		channelRepo:   channelRepo,
		clipboardRepo: clipboardRepo,
		deviceRepo:    deviceRepo,
	}
}

// CreateChannel 创建新的频道
func (s *channelService) CreateChannel(channelID string) (*model.Channel, error) {
	// 支持指定channelID创建频道
	// 如果channelID为空，生成新的UUID
	id := channelID
	if id == "" {
		id = uuid.New().String()
	}

	// 检查指定ID的频道是否已存在
	if channelID != "" {
		exists, err := s.channelRepo.Exists(channelID)
		if err != nil {
			return nil, err
		}
		// 如果已存在，直接返回该频道
		if exists {
			return s.channelRepo.FindByID(channelID)
		}
	}

	// 创建新频道
	channel := &model.Channel{
		ID:        id,
		CreatedAt: time.Now(),
	}

	if err := s.channelRepo.Save(channel); err != nil {
		return nil, err
	}

	return channel, nil
}

// GetChannel 通过ID获取频道
func (s *channelService) GetChannel(channelID string) (*model.Channel, error) {
	return s.channelRepo.FindByID(channelID)
}

// ChannelExists 检查频道是否存在
func (s *channelService) ChannelExists(channelID string) (bool, error) {
	return s.channelRepo.Exists(channelID)
}

// VerifyChannel 验证频道存在且有效
func (s *channelService) VerifyChannel(channelID string) (bool, error) {
	// 检查频道是否存在
	exists, err := s.channelRepo.Exists(channelID)
	if err != nil {
		return false, err
	}
	return exists, nil
}

// GetChannelStats 获取频道统计信息
func (s *channelService) GetChannelStats(channelID string) (*model.ChannelStats, error) {
	// 检查频道是否存在
	exists, err := s.channelRepo.Exists(channelID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, model.ErrChannelNotFound
	}

	// 获取剪贴板数量
	clipboardCount, err := s.clipboardRepo.Count(channelID)
	if err != nil {
		return nil, err
	}

	// 获取在线设备数量
	onlineCount, err := s.deviceRepo.CountOnline(channelID)
	if err != nil {
		return nil, err
	}

	// 获取总设备数量
	totalDeviceCount, err := s.deviceRepo.CountTotal(channelID)
	if err != nil {
		return nil, err
	}

	// 构建统计信息
	stats := &model.ChannelStats{
		ChannelID:      channelID,
		ClipboardCount: clipboardCount,
		OnlineDevices:  onlineCount,
		TotalDevices:   totalDeviceCount,
		LastUpdated:    time.Now(),
	}

	return stats, nil
}
