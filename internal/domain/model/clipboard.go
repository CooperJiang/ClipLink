package model

import (
	"time"
)

// 内容类型常量
const (
	TypeText     = "text"     // 文本
	TypeLink     = "link"     // 链接
	TypeCode     = "code"     // 代码
	TypePassword = "password" // 密码
	TypeImage    = "image"    // 图片
	TypeFile     = "file"     // 文件
)

// ClipboardItem 剪贴板项目模型
type ClipboardItem struct {
	ID         string    `json:"id" gorm:"primarykey"`    // 唯一标识符
	Content    string    `json:"content"`                 // 内容
	Type       string    `json:"type"`                    // 类型（text, link, code, password, image, file）
	Title      string    `json:"title"`                   // 标题
	CreatedAt  time.Time `json:"created_at"`              // 创建时间
	DeviceID   string    `json:"device_id"`               // 设备ID
	DeviceType string    `json:"device_type"`             // 设备类型（phone, tablet, desktop, other）
	Favorite   bool      `json:"favorite"`                // 是否收藏
	ChannelID  string    `json:"channel_id" gorm:"index"` // 通道ID，用于隔离不同用户的内容
	UpdatedAt  time.Time `json:"updated_at"`              // 更新时间
}
