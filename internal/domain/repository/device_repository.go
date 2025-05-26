package repository

import (
	"github.com/xiaojiu/cliplink/internal/domain/model"
)

// DeviceRepository 设备仓库接口
type DeviceRepository interface {
	// 设备基本操作
	Save(device *model.Device) error
	FindByID(deviceID string) (*model.Device, error)
	Update(deviceID string, updates map[string]interface{}) error
	Delete(deviceID string) error

	// 通道相关设备操作
	FindByChannel(channelID string) ([]*model.DeviceDTO, error)
	CountOnline(channelID string) (int64, error)
	CountTotal(channelID string) (int64, error)

	// 设备通道关联操作
	SaveDeviceChannel(deviceChannel *model.DeviceChannel) error
	FindDeviceChannelByDeviceAndChannel(deviceID, channelID string) (*model.DeviceChannel, error)
	UpdateDeviceChannel(deviceID, channelID string, updates map[string]interface{}) error
	DeleteDeviceChannel(deviceID, channelID string) error
	IsDeviceInChannel(deviceID, channelID string) (bool, error)
}
