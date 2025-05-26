package controller

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// DeviceController 设备控制器
type DeviceController struct {
	deviceService service.DeviceService
}

// NewDeviceController 创建新的设备控制器
func NewDeviceController(deviceService service.DeviceService) *DeviceController {
	return &DeviceController{
		deviceService: deviceService,
	}
}

// RegisterDevice 注册设备并关联到通道
func (c *DeviceController) RegisterDevice(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 绑定请求体 - 适配前端发送的字段
	var req struct {
		DeviceID   string `json:"device_id" binding:"required"`
		DeviceName string `json:"device_name" binding:"required"`
		DeviceType string `json:"device_type" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. 注册设备到系统
	device, err := c.deviceService.RegisterDevice(req.DeviceName, req.DeviceType, req.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "设备注册失败: " + err.Error()})
		return
	}

	// 2. 将设备关联到当前通道
	err = c.deviceService.AddDeviceToChannel(device.ID, channelID.(string))
	if err != nil {
		// 如果关联失败，仍然返回设备信息，但记录日志
		// 客户端可以忽略这个错误，因为设备已经注册成功
	}

	// 构建设备DTO返回
	deviceDTO := &model.DeviceDTO{
		ID:        device.ID,
		Name:      device.Name,
		Type:      device.Type,
		ChannelID: channelID.(string),
		LastSeen:  device.LastSeen,
		IsOnline:  device.IsOnline,
		CreatedAt: device.CreatedAt,
		JoinedAt:  time.Now(),
	}

	ctx.JSON(http.StatusOK, deviceDTO)
}

// GetDevices 获取通道下的所有设备
func (c *DeviceController) GetDevices(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取设备列表
	devices, err := c.deviceService.GetDevicesByChannel(channelID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, devices)
}

// GetDeviceByID 获取特定设备
func (c *DeviceController) GetDeviceByID(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	deviceID := ctx.Param("deviceID")

	// 获取设备在通道中的信息
	device, err := c.deviceService.GetDeviceInChannel(deviceID, channelID.(string))
	if err != nil {
		if err == model.ErrDeviceNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "device not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, device)
}

// UpdateDeviceStatus 更新设备状态
func (c *DeviceController) UpdateDeviceStatus(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	deviceID := ctx.Param("deviceID")

	// 绑定请求体 - 适配前端发送的字段
	var req struct {
		IsOnline bool `json:"is_online" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. 更新设备全局状态
	device, err := c.deviceService.UpdateDeviceStatus(deviceID, req.IsOnline)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. 更新设备在通道中的状态
	err = c.deviceService.UpdateDeviceInChannel(deviceID, channelID.(string), req.IsOnline)
	if err != nil {
		// 忽略通道关联错误，继续返回设备信息
	}

	// 获取设备在通道中的完整信息
	deviceDTO, err := c.deviceService.GetDeviceInChannel(deviceID, channelID.(string))
	if err != nil {
		// 如果获取失败，返回基本设备信息
		deviceDTO = &model.DeviceDTO{
			ID:        device.ID,
			Name:      device.Name,
			Type:      device.Type,
			ChannelID: channelID.(string),
			LastSeen:  device.LastSeen,
			IsOnline:  device.IsOnline,
			CreatedAt: device.CreatedAt,
		}
	}

	ctx.JSON(http.StatusOK, deviceDTO)
}

// UpdateDeviceName 更新设备名称
func (c *DeviceController) UpdateDeviceName(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	deviceID := ctx.Param("deviceID")

	// 绑定请求体 - 使用snake_case命名风格保持一致性
	var req struct {
		Name string `json:"device_name" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新设备名称
	device, err := c.deviceService.UpdateDevice(deviceID, req.Name, "")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取设备在通道中的完整信息
	deviceDTO, err := c.deviceService.GetDeviceInChannel(deviceID, channelID.(string))
	if err != nil {
		// 如果获取失败，返回基本设备信息
		deviceDTO = &model.DeviceDTO{
			ID:        device.ID,
			Name:      device.Name,
			Type:      device.Type,
			ChannelID: channelID.(string),
			LastSeen:  device.LastSeen,
			IsOnline:  device.IsOnline,
			CreatedAt: device.CreatedAt,
		}
	}

	ctx.JSON(http.StatusOK, deviceDTO)
}

// RemoveDevice 移除设备
func (c *DeviceController) RemoveDevice(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	deviceID := ctx.Param("deviceID")

	// 从通道中移除设备关联
	err := c.deviceService.RemoveDeviceFromChannel(deviceID, channelID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "device removed from channel"})
}
