package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// StatsController 统计控制器
type StatsController struct {
	statsService   service.StatsService
	channelService service.ChannelService
}

// NewStatsController 创建新的统计控制器
func NewStatsController(statsService service.StatsService, channelService service.ChannelService) *StatsController {
	return &StatsController{
		statsService:   statsService,
		channelService: channelService,
	}
}

// GetChannelStats 获取通道统计数据
func (c *StatsController) GetChannelStats(ctx *gin.Context) {
	// 从上下文中获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists || channelID == nil || channelID == "" {
		// 尝试从路径参数获取
		channelID = ctx.Param("channelID")
		if channelID == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "channel ID is required"})
			return
		}
	}

	// 获取通道信息
	channel, err := c.channelService.GetChannel(channelID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取统计数据
	stats, err := c.statsService.GetChannelStats(channelID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if stats == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
		return
	}

	// 重新格式化，以符合前端期望的格式
	formattedStats := gin.H{
		"total_devices":        stats["devices"].(map[string]interface{})["total"],
		"online_devices":       stats["devices"].(map[string]interface{})["online"],
		"clipboard_item_count": stats["clipboard"].(map[string]interface{})["total"],
		"sync_count":           stats["sync_count"],
		"created_at":           channel.CreatedAt,
	}

	ctx.JSON(http.StatusOK, formattedStats)
}
