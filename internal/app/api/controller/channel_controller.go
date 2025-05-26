package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// ChannelController 频道控制器
type ChannelController struct {
	channelService service.ChannelService
}

// NewChannelController 创建新的频道控制器
func NewChannelController(channelService service.ChannelService) *ChannelController {
	return &ChannelController{
		channelService: channelService,
	}
}

// CreateChannel 创建新频道
func (c *ChannelController) CreateChannel(ctx *gin.Context) {
	// 绑定请求体 - 适配前端API格式
	var req struct {
		ChannelID string `json:"channel_id"` // 允许客户端指定channelID
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		// 如果没有请求体或请求体解析错误，使用空值创建随机频道ID
		req.ChannelID = ""
	}

	// 创建频道（使用指定的ID或生成随机ID）
	channel, err := c.channelService.CreateChannel(req.ChannelID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回新创建的频道信息
	ctx.JSON(http.StatusOK, gin.H{
		"id":         channel.ID,
		"created_at": channel.CreatedAt,
	})
}

// GetChannel 获取频道信息
func (c *ChannelController) GetChannel(ctx *gin.Context) {
	// 优先从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	if channelID == nil || channelID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "channel ID is required"})
		return
	}

	// 获取频道
	channel, err := c.channelService.GetChannel(channelID.(string))
	if err != nil {
		if err == model.ErrChannelNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, channel)
}

// GetChannelStats 获取频道统计信息
func (c *ChannelController) GetChannelStats(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取统计信息
	stats, err := c.channelService.GetChannelStats(channelID.(string))
	if err != nil {
		if err == model.ErrChannelNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

// VerifyChannel 验证频道存在且有效 - 适配前端POST请求格式
func (c *ChannelController) VerifyChannel(ctx *gin.Context) {
	// 优先从header注入的ctx.Get("channelID")获取
	if channelID, exists := ctx.Get("channelID"); exists && channelID != nil && channelID != "" {
		exists, err := c.channelService.VerifyChannel(channelID.(string))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !exists {
			ctx.JSON(http.StatusNotFound, gin.H{"success": false, "error": "channel not found"})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	// 其次尝试POST body
	var req struct {
		ChannelID string `json:"channel_id"`
	}
	if err := ctx.ShouldBindJSON(&req); err == nil && req.ChannelID != "" {
		exists, err := c.channelService.VerifyChannel(req.ChannelID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !exists {
			ctx.JSON(http.StatusNotFound, gin.H{"success": false, "error": "channel not found"})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	// 最后兼容路径参数
	channelID := ctx.Param("channelID")
	if channelID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "channel ID is required"})
		return
	}

	exists, err := c.channelService.VerifyChannel(channelID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !exists {
		ctx.JSON(http.StatusNotFound, gin.H{"success": false, "error": "channel not found"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"success": true})
}

// 所有通道相关接口均支持header传递channelId，优先从header获取，兼容旧路由。
