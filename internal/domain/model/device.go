package model

import (
	"time"
)

// Device 设备模型，用于记录设备基本信息
type Device struct {
	ID        string    `json:"id" gorm:"primarykey"` // 设备ID，主键
	Name      string    `json:"name"`                 // 设备名称
	Type      string    `json:"type"`                 // 设备类型（phone, tablet, desktop, other）
	LastSeen  time.Time `json:"last_seen"`            // 最后一次活跃时间
	IsOnline  bool      `json:"is_online"`            // 是否在线
	CreatedAt time.Time `json:"created_at"`           // 首次创建时间
	UpdatedAt time.Time `json:"updated_at"`           // 更新时间
}

// DeviceDTO 设备数据传输对象，包含设备在特定通道的状态
type DeviceDTO struct {
	ID        string    `json:"id"`         // 设备ID
	Name      string    `json:"name"`       // 设备名称
	Type      string    `json:"type"`       // 设备类型
	ChannelID string    `json:"channel_id"` // 关联的通道ID
	LastSeen  time.Time `json:"last_seen"`  // 最后一次活跃时间
	IsOnline  bool      `json:"is_online"`  // 是否在线
	CreatedAt time.Time `json:"created_at"` // 首次创建时间
	JoinedAt  time.Time `json:"joined_at"`  // 加入通道时间
}

// SyncHistory 同步历史模型，用于记录内容同步历史
type SyncHistory struct {
	ID        uint      `json:"id" gorm:"primarykey"`    // 自增ID
	Action    string    `json:"action"`                  // 动作类型（sync, connect, disconnect, update, delete）
	Content   string    `json:"content"`                 // 操作内容，对于sync是同步的内容摘要
	DeviceID  string    `json:"device_id"`               // 执行设备ID
	ChannelID string    `json:"channel_id" gorm:"index"` // 关联的通道ID
	CreatedAt time.Time `json:"created_at"`              // 操作时间
}

// 同步动作类型常量
const (
	ActionSync       = "sync"       // 同步内容
	ActionConnect    = "connect"    // 设备连接
	ActionDisconnect = "disconnect" // 设备断开连接
	ActionUpdate     = "update"     // 更新内容
	ActionDelete     = "delete"     // 删除内容
)
