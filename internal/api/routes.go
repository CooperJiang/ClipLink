package api

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/db"
)

// RegisterRoutes 注册所有API路由
func RegisterRoutes(r *gin.RouterGroup, database *db.DB) {
	handler := NewHandler(database)

	// 剪贴板相关路由
	r.POST("/clipboard", handler.SaveClipboard)
	r.GET("/clipboard", handler.GetLatestClipboard)
	r.GET("/clipboard/history", handler.GetClipboardHistory)
	r.DELETE("/clipboard/:id", handler.DeleteClipboard)

	// 新增API
	r.PUT("/clipboard/:id", handler.UpdateClipboard)
	r.PUT("/clipboard/:id/favorite", handler.ToggleFavorite)
	r.GET("/clipboard/favorites", handler.GetFavorites)

	// 新增获取单个剪贴板项目的API路由
	r.GET("/clipboard/:id", handler.GetClipboardItem)
}
