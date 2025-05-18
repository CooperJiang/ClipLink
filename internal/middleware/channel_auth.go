package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/common/response"
	"github.com/xiaojiu/cliplink/internal/repository"
)

// ChannelAuthMiddleware 通道认证中间件，验证请求头中的X-Channel-ID是否合法
func ChannelAuthMiddleware(channelRepo repository.ChannelRepository, skipPaths []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取完整路径
		fullPath := c.Request.URL.Path

		// 检查是否需要跳过验证
		for _, skipPath := range skipPaths {
			if strings.HasSuffix(fullPath, skipPath) {
				c.Next()
				return
			}
		}

		// 获取通道ID
		channelID := c.GetHeader("X-Channel-ID")
		if channelID == "" {
			response.Unauthorized(c, "请求头中缺少X-Channel-ID")
			c.Abort()
			return
		}

		// 验证通道ID是否存在
		exists, err := channelRepo.ChannelExists(channelID)
		if err != nil {
			response.ServerError(c, "验证通道ID失败: "+err.Error())
			c.Abort()
			return
		}

		if !exists {
			response.Unauthorized(c, "无效的通道ID")
			c.Abort()
			return
		}

		// 继续处理请求
		c.Next()
	}
}
