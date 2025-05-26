package model

import "time"

// ChannelStats 频道统计数据
// ChannelStats represents statistics information for a channel
type ChannelStats struct {
	// ChannelID 频道ID
	// ChannelID is the ID of the channel
	ChannelID string `json:"channel_id"`

	// ClipboardCount 剪贴板条目数量
	// ClipboardCount is the number of clipboard items in the channel
	ClipboardCount int64 `json:"clipboard_count"`

	// OnlineDevices 在线设备数量
	// OnlineDevices is the number of devices that are currently online
	OnlineDevices int64 `json:"online_devices"`

	// TotalDevices 总设备数量
	// TotalDevices is the total number of devices registered to the channel
	TotalDevices int64 `json:"total_devices"`

	// LastUpdated 最后更新时间
	// LastUpdated is the timestamp when these statistics were last updated
	LastUpdated time.Time `json:"last_updated"`
}
