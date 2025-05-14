package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/repository"
	"github.com/xiaojiu/clipboard/internal/service"
	"gorm.io/gorm"
)

// RegisterRoutes 注册所有API路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// 初始化存储库
	clipboardRepo := repository.NewClipboardRepository(db)

	// 初始化服务
	clipboardService := service.NewClipboardService(clipboardRepo)

	// 初始化控制器
	clipboardController := NewClipboardController(clipboardService)

	// 剪贴板相关路由
	r.POST("/clipboard", clipboardController.SaveClipboard)
	r.GET("/clipboard", clipboardController.GetLatestClipboard)
	r.GET("/clipboard/history", clipboardController.GetClipboardHistory)
	r.DELETE("/clipboard/:id", clipboardController.DeleteClipboard)
	r.PUT("/clipboard/:id", clipboardController.UpdateClipboard)
	r.PUT("/clipboard/:id/favorite", clipboardController.ToggleFavorite)
	r.GET("/clipboard/favorites", clipboardController.GetFavorites)

	// 按内容类型和设备类型筛选的路由
	r.GET("/clipboard/type/:type", clipboardController.GetClipboardByType)
	r.GET("/clipboard/device-type/:device_type", clipboardController.GetClipboardByDeviceType)

	r.GET("/clipboard/:id", clipboardController.GetClipboardItem)
}
