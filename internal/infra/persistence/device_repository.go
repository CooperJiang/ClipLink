package persistence

import (
	"errors"
	"time"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/infra/db"
	"gorm.io/gorm"
)

// deviceRepository 设备仓库实现
type deviceRepository struct{}

// NewDeviceRepository 创建新的设备仓库
func NewDeviceRepository() repository.DeviceRepository {
	return &deviceRepository{}
}

// Save 保存设备
func (r *deviceRepository) Save(device *model.Device) error {
	return db.GetDB().Create(device).Error
}

// FindByID 通过ID查找设备
func (r *deviceRepository) FindByID(deviceID string) (*model.Device, error) {
	var device model.Device
	err := db.GetDB().Where("id = ?", deviceID).First(&device).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, model.ErrDeviceNotFound
		}
		return nil, err
	}
	return &device, nil
}

// FindByChannel 查找通道下的所有设备
func (r *deviceRepository) FindByChannel(channelID string) ([]*model.DeviceDTO, error) {
	var deviceDTOs []*model.DeviceDTO

	// 使用连接查询查找通道下的所有设备
	err := db.GetDB().Table("devices").
		Select("devices.id, devices.name, devices.type, devices.last_seen, devices.is_online, devices.created_at, "+
			"device_channels.channel_id, device_channels.joined_at").
		Joins("JOIN device_channels ON devices.id = device_channels.device_id").
		Where("device_channels.channel_id = ?", channelID).
		Order("device_channels.last_seen_at DESC").
		Scan(&deviceDTOs).Error

	if err != nil {
		return nil, err
	}
	return deviceDTOs, nil
}

// Update 更新设备
func (r *deviceRepository) Update(deviceID string, updates map[string]interface{}) error {
	// 确保更新时间
	if updates["updated_at"] == nil {
		updates["updated_at"] = time.Now()
	}

	result := db.GetDB().Model(&model.Device{}).
		Where("id = ?", deviceID).
		Updates(updates)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return model.ErrDeviceNotFound
	}

	return nil
}

// Delete 删除设备
func (r *deviceRepository) Delete(deviceID string) error {
	// 先删除设备通道关联
	if err := db.GetDB().Where("device_id = ?", deviceID).Delete(&model.DeviceChannel{}).Error; err != nil {
		return err
	}

	// 再删除设备
	result := db.GetDB().Where("id = ?", deviceID).Delete(&model.Device{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return model.ErrDeviceNotFound
	}

	return nil
}

// CountOnline 统计通道下在线设备数量
func (r *deviceRepository) CountOnline(channelID string) (int64, error) {
	var count int64
	err := db.GetDB().Model(&model.DeviceChannel{}).
		Joins("JOIN devices ON devices.id = device_channels.device_id").
		Where("device_channels.channel_id = ? AND devices.is_online = ?", channelID, true).
		Count(&count).Error
	return count, err
}

// CountTotal 统计通道下所有设备数量
func (r *deviceRepository) CountTotal(channelID string) (int64, error) {
	var count int64
	err := db.GetDB().Model(&model.DeviceChannel{}).
		Where("channel_id = ?", channelID).
		Count(&count).Error
	return count, err
}

// SaveDeviceChannel 保存设备通道关联
func (r *deviceRepository) SaveDeviceChannel(deviceChannel *model.DeviceChannel) error {
	return db.GetDB().Create(deviceChannel).Error
}

// FindDeviceChannelByDeviceAndChannel 查找设备通道关联
func (r *deviceRepository) FindDeviceChannelByDeviceAndChannel(deviceID, channelID string) (*model.DeviceChannel, error) {
	var deviceChannel model.DeviceChannel
	err := db.GetDB().Where("device_id = ? AND channel_id = ?", deviceID, channelID).First(&deviceChannel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // 返回nil表示没有找到
		}
		return nil, err
	}
	return &deviceChannel, nil
}

// UpdateDeviceChannel 更新设备通道关联
func (r *deviceRepository) UpdateDeviceChannel(deviceID, channelID string, updates map[string]interface{}) error {
	// 确保更新时间
	if updates["updated_at"] == nil {
		updates["updated_at"] = time.Now()
	}

	result := db.GetDB().Model(&model.DeviceChannel{}).
		Where("device_id = ? AND channel_id = ?", deviceID, channelID).
		Updates(updates)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("device channel association not found")
	}

	return nil
}

// DeleteDeviceChannel 删除设备通道关联
func (r *deviceRepository) DeleteDeviceChannel(deviceID, channelID string) error {
	result := db.GetDB().Where("device_id = ? AND channel_id = ?", deviceID, channelID).
		Delete(&model.DeviceChannel{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("device channel association not found")
	}

	return nil
}

// IsDeviceInChannel 检查设备是否在通道中
func (r *deviceRepository) IsDeviceInChannel(deviceID, channelID string) (bool, error) {
	var count int64
	err := db.GetDB().Model(&model.DeviceChannel{}).
		Where("device_id = ? AND channel_id = ?", deviceID, channelID).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
