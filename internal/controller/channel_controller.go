package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/common/response"
	"github.com/xiaojiu/cliplink/internal/service"
)

type ChannelController struct {
	channelService service.ChannelService
}

func NewChannelController(channelService service.ChannelService) *ChannelController {
	return &ChannelController{
		channelService: channelService,
	}
}

func (c *ChannelController) CreateChannel(ctx *gin.Context) {
	var request struct {
		ChannelID string `json:"channel_id"` // 可选，不提供则自动生成
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		response.BadRequest(ctx, "请求参数错误: "+err.Error())
		return
	}

	channel, err := c.channelService.CreateChannel(request.ChannelID)
	if err != nil {
		response.ServerError(ctx, "创建通道失败: "+err.Error())
		return
	}

	response.Success(ctx, channel, "创建通道成功")
}

func (c *ChannelController) VerifyChannel(ctx *gin.Context) {
	var request struct {
		ChannelID string `json:"channel_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		response.BadRequest(ctx, "请求参数错误: "+err.Error())
		return
	}

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
