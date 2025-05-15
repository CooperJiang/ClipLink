package api

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/db"
)

func RegisterRoutes(r *gin.RouterGroup, database *db.DB) {
	handler := NewHandler(database)

	// 剪贴板基础操作
	r.POST("/clipboard", handler.SaveClipboard)
	r.GET("/clipboard", handler.GetLatestClipboard)
	r.GET("/clipboard/history", handler.GetClipboardHistory)
	r.DELETE("/clipboard/:id", handler.DeleteClipboard)
	r.PUT("/clipboard/:id", handler.UpdateClipboard)
	r.GET("/clipboard/:id", handler.GetClipboardItem)

	// 收藏功能
	r.PUT("/clipboard/:id/favorite", handler.ToggleFavorite)
	r.GET("/clipboard/favorites", handler.GetFavorites)

	// 筛选功能
	r.GET("/clipboard/type/:type", handler.GetClipboardByType)
	r.GET("/clipboard/device-type/:device_type", handler.GetClipboardByDeviceType)
}
