package usecase

import (
	"time"

	"github.com/google/uuid"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// deviceService 设备服务实现
type deviceService struct {
	deviceRepo repository.DeviceRepository
}

// NewDeviceService 创建新的设备服务
func NewDeviceService(deviceRepo repository.DeviceRepository) service.DeviceService {
	return &deviceService{
		deviceRepo: deviceRepo,
	}
}

// RegisterDevice 注册新设备
func (s *deviceService) RegisterDevice(name, deviceType, deviceID string) (*model.Device, error) {
	// 如果没有提供deviceID，则生成一个新的
	if deviceID == "" {
		deviceID = uuid.New().String()
	}

	// 先检查设备是否已经存在
	existingDevice, err := s.deviceRepo.FindByID(deviceID)
	if err == nil && existingDevice != nil {
		// 设备已存在，更新最后在线时间
		updates := map[string]interface{}{
			"name":       name,
			"type":       deviceType,
			"last_seen":  time.Now(),
			"is_online":  true,
			"updated_at": time.Now(),
		}

		if err := s.deviceRepo.Update(deviceID, updates); err != nil {
			return nil, err
		}

		return s.deviceRepo.FindByID(deviceID)
	}

	// 创建新设备
	now := time.Now()
	device := &model.Device{
		ID:        deviceID,
		Name:      name,
		Type:      deviceType,
		LastSeen:  now,
		IsOnline:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// 保存设备
	if err := s.deviceRepo.Save(device); err != nil {
		return nil, err
	}

	return device, nil
}

// GetDeviceByID 通过ID获取设备
func (s *deviceService) GetDeviceByID(deviceID string) (*model.Device, error) {
	return s.deviceRepo.FindByID(deviceID)
}

// UpdateDevice 更新设备信息
func (s *deviceService) UpdateDevice(deviceID string, name string, deviceType string) (*model.Device, error) {
	// 构建更新内容
	updates := map[string]interface{}{
		"name":       name,
		"type":       deviceType,
		"updated_at": time.Now(),
	}

	// 更新设备
	if err := s.deviceRepo.Update(deviceID, updates); err != nil {
		return nil, err
	}

	// 获取更新后的设备
	return s.deviceRepo.FindByID(deviceID)
}

// UpdateDeviceStatus 更新设备状态
func (s *deviceService) UpdateDeviceStatus(deviceID string, isOnline bool) (*model.Device, error) {
	// 构建更新内容
	updates := map[string]interface{}{
		"is_online": isOnline,
		"last_seen": time.Now(),
	}

	// 更新设备
	if err := s.deviceRepo.Update(deviceID, updates); err != nil {
		return nil, err
	}

	// 获取更新后的设备
	return s.deviceRepo.FindByID(deviceID)
}

// RemoveDevice 移除设备（从所有通道）
func (s *deviceService) RemoveDevice(deviceID string) error {
	return s.deviceRepo.Delete(deviceID)
}

// AddDeviceToChannel 添加设备到通道
func (s *deviceService) AddDeviceToChannel(deviceID, channelID string) error {
	// 检查设备是否已经在通道中
	existing, err := s.deviceRepo.FindDeviceChannelByDeviceAndChannel(deviceID, channelID)
	if err != nil {
		return err
	}

	if existing != nil {
		// 设备已经在通道中，更新状态为活跃
		updates := map[string]interface{}{
			"is_active":    true,
			"last_seen_at": time.Now(),
			"updated_at":   time.Now(),
		}
		return s.deviceRepo.UpdateDeviceChannel(deviceID, channelID, updates)
	}

	// 创建新的设备通道关联
	now := time.Now()
	deviceChannel := &model.DeviceChannel{
		DeviceID:   deviceID,
		ChannelID:  channelID,
		IsActive:   true,
		JoinedAt:   now,
		LastSeenAt: now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	return s.deviceRepo.SaveDeviceChannel(deviceChannel)
}

// RemoveDeviceFromChannel 从通道中移除设备
func (s *deviceService) RemoveDeviceFromChannel(deviceID, channelID string) error {
	return s.deviceRepo.DeleteDeviceChannel(deviceID, channelID)
}

// UpdateDeviceInChannel 更新设备在通道中的状态
func (s *deviceService) UpdateDeviceInChannel(deviceID, channelID string, isActive bool) error {
	updates := map[string]interface{}{
		"is_active":    isActive,
		"last_seen_at": time.Now(),
	}
	return s.deviceRepo.UpdateDeviceChannel(deviceID, channelID, updates)
}

// IsDeviceInChannel 检查设备是否在通道中
func (s *deviceService) IsDeviceInChannel(deviceID, channelID string) (bool, error) {
	return s.deviceRepo.IsDeviceInChannel(deviceID, channelID)
}

// GetDevicesByChannel 获取通道下的所有设备
func (s *deviceService) GetDevicesByChannel(channelID string) ([]*model.DeviceDTO, error) {
	return s.deviceRepo.FindByChannel(channelID)
}

// GetDeviceInChannel 获取设备在特定通道的信息
func (s *deviceService) GetDeviceInChannel(deviceID, channelID string) (*model.DeviceDTO, error) {
	// 获取设备基本信息
	device, err := s.deviceRepo.FindByID(deviceID)
	if err != nil {
		return nil, err
	}

	if device == nil {
		return nil, model.ErrDeviceNotFound
	}

	// 获取设备通道关联信息
	deviceChannel, err := s.deviceRepo.FindDeviceChannelByDeviceAndChannel(deviceID, channelID)
	if err != nil {
		return nil, err
	}

	if deviceChannel == nil {
		return nil, model.ErrDeviceNotFound
	}

	// 构建DTO
	deviceDTO := &model.DeviceDTO{
		ID:        device.ID,
		Name:      device.Name,
		Type:      device.Type,
		ChannelID: channelID,
		LastSeen:  device.LastSeen,
		IsOnline:  device.IsOnline,
		CreatedAt: device.CreatedAt,
		JoinedAt:  deviceChannel.JoinedAt,
	}

	return deviceDTO, nil
}

// CountOnlineDevices 计算在线设备数量
func (s *deviceService) CountOnlineDevices(channelID string) (int64, error) {
	return s.deviceRepo.CountOnline(channelID)
}

// CountTotalDevices 计算设备总数
func (s *deviceService) CountTotalDevices(channelID string) (int64, error) {
	return s.deviceRepo.CountTotal(channelID)
}
