package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// SyncController 同步控制器
type SyncController struct {
	syncService service.SyncService
}

// NewSyncController 创建新的同步控制器
func NewSyncController(syncService service.SyncService) *SyncController {
	return &SyncController{
		syncService: syncService,
	}
}

// GetSyncHistory 获取同步历史记录
func (c *SyncController) GetSyncHistory(ctx *gin.Context) {
	// 获取路径参数
	channelID := ctx.Param("channelID")

	// 获取分页参数
	limitStr := ctx.DefaultQuery("limit", "20")
	offsetStr := ctx.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// 获取同步历史记录
	history, err := c.syncService.GetSyncHistory(channelID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, history)
}

// LogSyncAction 记录同步操作
func (c *SyncController) LogSyncAction(ctx *gin.Context) {
	// 获取路径参数
	channelID := ctx.Param("channelID")

	// 绑定请求体
	var req struct {
		DeviceID string `json:"deviceId" binding:"required"`
		Content  string `json:"content" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 记录同步操作
	err := c.syncService.LogSyncAction(req.DeviceID, channelID, req.Content)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "sync action logged"})
}
