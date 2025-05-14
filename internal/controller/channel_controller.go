package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/common/response"
	"github.com/xiaojiu/clipboard/internal/service"
)

// ChannelController 通道控制器
type ChannelController struct {
	channelService service.ChannelService
}

// NewChannelController 创建通道控制器
func NewChannelController(channelService service.ChannelService) *ChannelController {
	return &ChannelController{
		channelService: channelService,
	}
}

// CreateChannel 创建通道
func (c *ChannelController) CreateChannel(ctx *gin.Context) {
	var request struct {
		ChannelID string `json:"channel_id"` // 可选，不提供则自动生成
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		response.BadRequest(ctx, "请求参数错误: "+err.Error())
		return
	}

	// 创建通道
	channel, err := c.channelService.CreateChannel(request.ChannelID)
	if err != nil {
		response.ServerError(ctx, "创建通道失败: "+err.Error())
		return
	}

	response.Success(ctx, channel, "创建通道成功")
}

// VerifyChannel 验证通道
func (c *ChannelController) VerifyChannel(ctx *gin.Context) {
	var request struct {
		ChannelID string `json:"channel_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		response.BadRequest(ctx, "请求参数错误: "+err.Error())
		return
	}

	// 验证通道
	exists, err := c.channelService.VerifyChannel(request.ChannelID)
	if err != nil {
		response.ServerError(ctx, "验证通道失败: "+err.Error())
		return
	}

	if !exists {
		response.NotFound(ctx, "通道不存在")
		return
	}

	response.SuccessWithMessage(ctx, "通道验证成功")
}
