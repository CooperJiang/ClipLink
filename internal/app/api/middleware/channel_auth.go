package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// ChannelAuthMiddleware 频道认证中间件
type ChannelAuthMiddleware struct {
	channelService service.ChannelService
}

// NewChannelAuthMiddleware 创建新的频道认证中间件
func NewChannelAuthMiddleware(channelService service.ChannelService) *ChannelAuthMiddleware {
	return &ChannelAuthMiddleware{
		channelService: channelService,
	}
}

// ExtractChannelFromHeader 从请求头提取频道ID并验证
func (m *ChannelAuthMiddleware) ExtractChannelFromHeader() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.GetHeader("X-Channel-ID")
		if channelID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-Channel-ID header is required"})
			c.Abort()
			return
		}

		// 验证频道是否存在
		exists, err := m.channelService.VerifyChannel(channelID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
			c.Abort()
			return
		}

		// 将channelID存入上下文
		c.Set("channelID", channelID)

		// 继续处理请求
		c.Next()
	}
}

// VerifyChannel 验证频道是否存在且有效 (路径参数版)
func (m *ChannelAuthMiddleware) VerifyChannel() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.Param("channelID")
		if channelID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "channel ID is required"})
			c.Abort()
			return
		}

		// 验证频道是否存在
		exists, err := m.channelService.VerifyChannel(channelID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
			c.Abort()
			return
		}

		// 继续处理请求
		c.Next()
	}
}
