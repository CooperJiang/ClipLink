package service

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// DeviceService 设备服务接口
// DeviceService defines operations for managing devices
type DeviceService interface {
	// 设备基本操作
	RegisterDevice(name, deviceType, deviceID string) (*model.Device, error)
	GetDeviceByID(deviceID string) (*model.Device, error)
	UpdateDevice(deviceID string, name string, deviceType string) (*model.Device, error)
	UpdateDeviceStatus(deviceID string, isOnline bool) (*model.Device, error)
	RemoveDevice(deviceID string) error

	// 设备通道关联操作
	AddDeviceToChannel(deviceID, channelID string) error
	RemoveDeviceFromChannel(deviceID, channelID string) error
	UpdateDeviceInChannel(deviceID, channelID string, isActive bool) error
	IsDeviceInChannel(deviceID, channelID string) (bool, error)

	// 通道设备查询
	GetDevicesByChannel(channelID string) ([]*model.DeviceDTO, error)
	GetDeviceInChannel(deviceID, channelID string) (*model.DeviceDTO, error)
	CountOnlineDevices(channelID string) (int64, error)
	CountTotalDevices(channelID string) (int64, error)
}
