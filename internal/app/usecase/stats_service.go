package usecase

import (
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// statsService 统计服务实现
type statsService struct {
	deviceRepo      repository.DeviceRepository
	clipboardRepo   repository.ClipboardRepository
	channelRepo     repository.ChannelRepository
	syncHistoryRepo repository.SyncHistoryRepository
}

// NewStatsService 创建新的统计服务
func NewStatsService(
	deviceRepo repository.DeviceRepository,
	clipboardRepo repository.ClipboardRepository,
	channelRepo repository.ChannelRepository,
	syncHistoryRepo repository.SyncHistoryRepository,
) service.StatsService {
	return &statsService{
		deviceRepo:      deviceRepo,
		clipboardRepo:   clipboardRepo,
		channelRepo:     channelRepo,
		syncHistoryRepo: syncHistoryRepo,
	}
}

// GetChannelStats 获取通道统计数据
func (s *statsService) GetChannelStats(channelID string) (map[string]interface{}, error) {
	// 检查通道是否存在
	exists, err := s.channelRepo.Exists(channelID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, nil
	}

	// 获取剪贴板统计
	clipboardCount, err := s.clipboardRepo.Count(channelID)
	if err != nil {
		return nil, err
	}

	// 按类型统计剪贴板
	textCount, err := s.clipboardRepo.CountByType("text", channelID)
	if err != nil {
		return nil, err
	}

	linkCount, err := s.clipboardRepo.CountByType("link", channelID)
	if err != nil {
		return nil, err
	}

	codeCount, err := s.clipboardRepo.CountByType("code", channelID)
	if err != nil {
		return nil, err
	}

	passwordCount, err := s.clipboardRepo.CountByType("password", channelID)
	if err != nil {
		return nil, err
	}

	imageCount, err := s.clipboardRepo.CountByType("image", channelID)
	if err != nil {
		return nil, err
	}

	fileCount, err := s.clipboardRepo.CountByType("file", channelID)
	if err != nil {
		return nil, err
	}

	// 获取设备统计
	onlineDevices, err := s.deviceRepo.CountOnline(channelID)
	if err != nil {
		return nil, err
	}

	totalDevices, err := s.deviceRepo.CountTotal(channelID)
	if err != nil {
		return nil, err
	}

	// 获取同步次数
	syncCount, err := s.syncHistoryRepo.Count(channelID)
	if err != nil {
		return nil, err
	}

	// 构建返回结果
	result := map[string]interface{}{
		"clipboard": map[string]interface{}{
			"total":    clipboardCount,
			"text":     textCount,
			"link":     linkCount,
			"code":     codeCount,
			"password": passwordCount,
			"image":    imageCount,
			"file":     fileCount,
		},
		"devices": map[string]interface{}{
			"online": onlineDevices,
			"total":  totalDevices,
		},
		"sync_count": syncCount,
	}

	return result, nil
}
