package db

import (
	"time"
)

// ClipboardItem 表示一个剪贴板项目
type ClipboardItem struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content" gorm:"not null"`
	Title     string    `json:"title" gorm:"default:''"`
	Type      string    `json:"type" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"index"`
	DeviceID  string    `json:"device_id" gorm:"not null"`
	Favorite  bool      `json:"favorite" gorm:"default:false"`
}

// ClipboardType 定义剪贴板内容类型常量
const (
	TypeText  = "text"
	TypeImage = "image"
	TypeFile  = "file"
)
