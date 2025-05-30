package migrations

import (
	"log"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"gorm.io/gorm"
)

// ClearDatabase 清空数据库中的所有表数据
func ClearDatabase(db *gorm.DB) error {
	log.Println("开始清空数据库...")

	// 删除剪贴板表中的所有数据
	if err := db.Exec("DELETE FROM clipboard_items").Error; err != nil {
		log.Printf("清空剪贴板表失败: %v", err)
		return err
	}

	// 如果需要重置自增ID（如果使用了自增ID）
	// 注意: SQLite不支持重置序列，但下面的方法对于其他数据库如PostgreSQL有效
	// if err := db.Exec("DELETE FROM sqlite_sequence WHERE name='clipboard_items'").Error; err != nil {
	//     log.Printf("重置自增ID失败: %v", err)
	//     // 这里我们不返回错误，因为不是所有数据库都有这个表
	// }

	// 如果后续添加了其他表，可以在这里添加相应的清空操作

	log.Println("数据库清空完成")
	return nil
}

// ResetDatabase 清空并重新初始化数据库
func ResetDatabase(db *gorm.DB) error {
	// 清空数据库
	if err := ClearDatabase(db); err != nil {
		return err
	}

	// 重新迁移表结构（如果需要）
	if err := db.AutoMigrate(&model.ClipboardItem{}); err != nil {
		log.Printf("重新迁移表结构失败: %v", err)
		return err
	}

	// 添加一条欢迎数据
	welcomeItem := model.ClipboardItem{
		ID:         "welcome-123",
		Content:    "欢迎使用跨设备剪贴板！我们只需要在不同设备打开此网页，通过网页进行通信，完成剪切板内容共享。",
		Type:       model.TypeText,
		DeviceID:   "system",
		DeviceType: "other",
		Title:      "欢迎消息",
	}

	if err := db.Create(&welcomeItem).Error; err != nil {
		log.Printf("添加欢迎数据失败: %v", err)
		return err
	}

	log.Println("数据库重置完成，并添加了欢迎数据")
	return nil
}
