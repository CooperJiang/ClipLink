package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/app/api/controller"
	"github.com/xiaojiu/cliplink/internal/app/api/middleware"
	"github.com/xiaojiu/cliplink/internal/app/usecase"
	"github.com/xiaojiu/cliplink/internal/infra/persistence"
)

// RegisterRoutes 注册所有API路由
func RegisterRoutes(router *gin.Engine) {
	// API组
	api := router.Group("/api")
	{
		// 重用已有的路由设置函数
		setupSubRoutes(api)
	}
}

// setupSubRoutes 设置子路由
func setupSubRoutes(api *gin.RouterGroup) {
	// 创建存储库
	channelRepo := persistence.NewChannelRepository()
	clipboardRepo := persistence.NewClipboardRepository()
	deviceRepo := persistence.NewDeviceRepository()
	syncHistoryRepo := persistence.NewSyncHistoryRepository()

	// 创建服务
	channelService := usecase.NewChannelService(channelRepo, clipboardRepo, deviceRepo)
	clipboardService := usecase.NewClipboardService(clipboardRepo, syncHistoryRepo)
	deviceService := usecase.NewDeviceService(deviceRepo)
	statsService := usecase.NewStatsService(deviceRepo, clipboardRepo, channelRepo, syncHistoryRepo)
	syncService := usecase.NewSyncService(syncHistoryRepo)

	// 创建控制器
	channelController := controller.NewChannelController(channelService)
	clipboardController := controller.NewClipboardController(clipboardService)
	deviceController := controller.NewDeviceController(deviceService)
	statsController := controller.NewStatsController(statsService, channelService)
	syncController := controller.NewSyncController(syncService)

	// 创建中间件
	channelAuthMiddleware := middleware.NewChannelAuthMiddleware(channelService)

	// 通道相关路由 - 匹配前端API调用格式
	api.POST("/channel", channelController.CreateChannel)
	api.POST("/channel/verify", channelController.VerifyChannel)

	// 以下路由都需要通道认证 - 从请求头中提取channelID
	authenticatedRoutes := api.Group("")
	authenticatedRoutes.Use(channelAuthMiddleware.ExtractChannelFromHeader())
	{
		// 注册剪贴板路由
		clipboard := authenticatedRoutes.Group("/clipboard")
		{
			clipboard.POST("", clipboardController.SaveClipboard)
			clipboard.GET("", clipboardController.GetLatestClipboard)
			clipboard.GET("/current", clipboardController.GetCurrentClipboard)
			clipboard.GET("/history", clipboardController.GetClipboardHistory)
			clipboard.GET("/favorites", clipboardController.GetFavoriteClipboard)
			clipboard.GET("/type/:type", clipboardController.GetClipboardByType)
			clipboard.GET("/device/:deviceType", clipboardController.GetClipboardByDeviceType)
			clipboard.GET("/:itemID", clipboardController.GetClipboardItem)
			clipboard.PUT("/:itemID", clipboardController.UpdateClipboard)
			clipboard.DELETE("/:itemID", clipboardController.DeleteClipboard)
			clipboard.PUT("/:itemID/favorite", clipboardController.ToggleFavorite)
		}

		// 注册设备路由
		devices := authenticatedRoutes.Group("/devices")
		{
			devices.POST("", deviceController.RegisterDevice)
			devices.GET("", deviceController.GetDevices)
			devices.GET("/:deviceID", deviceController.GetDeviceByID)
			devices.PUT("/:deviceID/status", deviceController.UpdateDeviceStatus)
			devices.PUT("/:deviceID/name", deviceController.UpdateDeviceName)
			devices.DELETE("/:deviceID", deviceController.RemoveDevice)
		}

		// 注册统计路由
		stats := authenticatedRoutes.Group("/stats")
		{
			stats.GET("", statsController.GetChannelStats)
		}

		// 注册同步路由
		sync := authenticatedRoutes.Group("/sync")
		{
			sync.GET("/history", syncController.GetSyncHistory)
			sync.POST("/log", syncController.LogSyncAction)
		}
	}

	// 保留原有的路由以确保兼容性
	channelGroup := api.Group("/channels/:channelID")
	channelGroup.Use(channelAuthMiddleware.VerifyChannel())
	{
		channelGroup.GET("", channelController.GetChannel)
		channelGroup.GET("/verify", channelController.VerifyChannel)
	}
}
