package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/app/api/controller"
	"github.com/xiaojiu/cliplink/internal/app/api/middleware"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// SetupRouter 设置路由
func SetupRouter(
	router *gin.Engine,
	channelService service.ChannelService,
	clipboardService service.ClipboardService,
	deviceService service.DeviceService,
	statsService service.StatsService,
	syncService service.SyncService,
) {
	// 创建控制器
	channelController := controller.NewChannelController(channelService)
	clipboardController := controller.NewClipboardController(clipboardService)
	deviceController := controller.NewDeviceController(deviceService)
	statsController := controller.NewStatsController(statsService, channelService)
	syncController := controller.NewSyncController(syncService)

	// 创建中间件
	channelAuthMiddleware := middleware.NewChannelAuthMiddleware(channelService)

	// 注册路由
	api := router.Group("/api")
	{
		// 通道相关路由 - 匹配前端API调用格式
		api.POST("/channel", channelController.CreateChannel)        // 修改为/channel以匹配前端
		api.POST("/channel/verify", channelController.VerifyChannel) // 修改为POST /channel/verify以匹配前端

		// 以下路由都需要通道认证 - 从请求头中提取channelID
		authenticatedRoutes := api.Group("")
		authenticatedRoutes.Use(channelAuthMiddleware.ExtractChannelFromHeader())
		{
			// 注册剪贴板路由
			RegisterClipboardRoutes(authenticatedRoutes, clipboardController)

			// 注册设备路由
			RegisterDeviceRoutes(authenticatedRoutes, deviceController)

			// 注册统计路由
			RegisterStatsRoutes(authenticatedRoutes, statsController)

			// 注册同步路由
			RegisterSyncRoutes(authenticatedRoutes, syncController)
		}

		// 保留原有的路由以确保兼容性
		channelGroup := api.Group("/channels/:channelID")
		channelGroup.Use(channelAuthMiddleware.VerifyChannel())
		{
			channelGroup.GET("", channelController.GetChannel)
			channelGroup.GET("/verify", channelController.VerifyChannel)
		}
	}
}

// RegisterClipboardRoutes 注册剪贴板路由
func RegisterClipboardRoutes(router *gin.RouterGroup, c *controller.ClipboardController) {
	clipboard := router.Group("/clipboard")
	{
		clipboard.POST("", c.SaveClipboard)
		clipboard.GET("", c.GetLatestClipboard)
		clipboard.GET("/current", c.GetCurrentClipboard)
		clipboard.GET("/history", c.GetClipboardHistory)
		clipboard.GET("/favorites", c.GetFavoriteClipboard)
		clipboard.GET("/search", c.SearchClipboard)
		clipboard.GET("/type/:type", c.GetClipboardByType)
		clipboard.GET("/device/:deviceType", c.GetClipboardByDeviceType)
		clipboard.GET("/:itemID", c.GetClipboardItem)
		clipboard.PUT("/:itemID", c.UpdateClipboard)
		clipboard.DELETE("/:itemID", c.DeleteClipboard)
		clipboard.PUT("/:itemID/favorite", c.ToggleFavorite)
	}
}

// RegisterDeviceRoutes 注册设备路由
func RegisterDeviceRoutes(router *gin.RouterGroup, c *controller.DeviceController) {
	devices := router.Group("/devices")
	{
		devices.POST("", c.RegisterDevice)
		devices.GET("", c.GetDevices)
		devices.GET("/:deviceID", c.GetDeviceByID)
		devices.PUT("/:deviceID/status", c.UpdateDeviceStatus)
		devices.PUT("/:deviceID/name", c.UpdateDeviceName)
		devices.DELETE("/:deviceID", c.RemoveDevice)
	}
}

// RegisterStatsRoutes 注册统计路由
func RegisterStatsRoutes(router *gin.RouterGroup, c *controller.StatsController) {
	stats := router.Group("/stats")
	{
		stats.GET("", c.GetChannelStats)
	}
}

// RegisterSyncRoutes 注册同步路由
func RegisterSyncRoutes(router *gin.RouterGroup, c *controller.SyncController) {
	sync := router.Group("/sync")
	{
		sync.GET("/history", c.GetSyncHistory)
		sync.POST("/log", c.LogSyncAction)
	}
}
