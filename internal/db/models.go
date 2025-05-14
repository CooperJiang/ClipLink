package db

import (
	"time"
)

// ClipboardItem 表示一个剪贴板项目
type ClipboardItem struct {
	ID         string    `json:"id" gorm:"primaryKey"`
	Content    string    `json:"content" gorm:"not null"`
	Title      string    `json:"title" gorm:"default:''"`
	Type       string    `json:"type" gorm:"not null"`
	CreatedAt  time.Time `json:"created_at" gorm:"index"`
	DeviceID   string    `json:"device_id" gorm:"not null"`
	DeviceType string    `json:"device_type" gorm:"not null;default:'other'"`
	Favorite   bool      `json:"favorite" gorm:"default:false"`
}

// ClipboardType 定义剪贴板内容类型常量
const (
	TypeText     = "text"     // 普通文本
	TypeLink     = "link"     // 链接
	TypeCode     = "code"     // 代码
	TypePassword = "password" // 密码
	TypeImage    = "image"    // 图片
	TypeFile     = "file"     // 文件
)

// DeviceType 定义设备类型常量
const (
	DeviceTypePhone   = "phone"   // 手机
	DeviceTypeTablet  = "tablet"  // 平板
	DeviceTypeDesktop = "desktop" // 电脑
	DeviceTypeOther   = "other"   // 其他
)
