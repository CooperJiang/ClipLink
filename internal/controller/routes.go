package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/middleware"
	"github.com/xiaojiu/clipboard/internal/repository"
	"github.com/xiaojiu/clipboard/internal/service"
	"gorm.io/gorm"
)

// RegisterRoutes 注册所有API路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// 初始化存储库
	clipboardRepo := repository.NewClipboardRepository(db)
	channelRepo := repository.NewChannelRepository(db)

	// 初始化服务
	clipboardService := service.NewClipboardService(clipboardRepo)
	channelService := service.NewChannelService(channelRepo)

	// 初始化控制器
	clipboardController := NewClipboardController(clipboardService)
	channelController := NewChannelController(channelService)

	// 定义需要跳过通道验证的路径
	skipPaths := []string{
		"/channel",
		"/channel/verify",
	}

	// 通道相关路由 - 不需要通道ID验证
	r.POST("/channel", channelController.CreateChannel)
	r.POST("/channel/verify", channelController.VerifyChannel)

	// 添加通道认证中间件，所有其他路由都需要验证通道ID
	r.Use(middleware.ChannelAuthMiddleware(channelRepo, skipPaths))

	// 剪贴板相关路由 - 已经通过中间件验证通道ID
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
