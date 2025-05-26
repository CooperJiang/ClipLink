package api

import (
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/app/api/routes"
)

// RegisterRoutes 注册所有API路由
func RegisterRoutes(router *gin.Engine) {
	routes.RegisterRoutes(router)
}
