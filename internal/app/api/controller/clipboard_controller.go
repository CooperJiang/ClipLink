package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/service"
)

// ClipboardController 剪贴板控制器
type ClipboardController struct {
	clipboardService service.ClipboardService
}

// NewClipboardController 创建新的剪贴板控制器
func NewClipboardController(clipboardService service.ClipboardService) *ClipboardController {
	return &ClipboardController{
		clipboardService: clipboardService,
	}
}

// SaveClipboard 保存剪贴板内容
func (c *ClipboardController) SaveClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 绑定请求体 - 适配前端发送的字段格式
	var req struct {
		Title      string `json:"title"`
		Content    string `json:"content" binding:"required"`
		Type       string `json:"type" binding:"required"`
		DeviceID   string `json:"device_id" binding:"required"`
		DeviceType string `json:"device_type" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 保存剪贴板内容
	item, err := c.clipboardService.SaveClipboard(
		req.Title,
		req.Content,
		req.Type,
		req.DeviceID,
		req.DeviceType,
		channelID.(string),
	)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, item)
}

// GetLatestClipboard 获取最新剪贴板内容
func (c *ClipboardController) GetLatestClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取查询参数
	limitStr := ctx.DefaultQuery("limit", "1") // 默认只返回1条，针对 /current 路径
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 1
	}

	// 获取最新剪贴板内容
	items, err := c.clipboardService.GetLatestClipboard(channelID.(string), limit)
	if err != nil {
		// 记录错误但返回空数组而不是错误
		ctx.JSON(http.StatusOK, []*model.ClipboardItem{})
		return
	}

	// 如果没有找到记录，返回空数组
	if len(items) == 0 {
		ctx.JSON(http.StatusOK, []*model.ClipboardItem{})
		return
	}

	// 针对 /current 路径，只返回第一个项目而不是数组
	if ctx.Request.URL.Path == "/api/clipboard/current" || ctx.Request.URL.Path == "/clipboard/current" {
		ctx.JSON(http.StatusOK, items[0])
		return
	}

	ctx.JSON(http.StatusOK, items)
}

// GetClipboardItem 获取特定剪贴板项目
func (c *ClipboardController) GetClipboardItem(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	itemID := ctx.Param("itemID")

	// 获取剪贴板项目
	item, err := c.clipboardService.GetClipboardItem(itemID, channelID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "clipboard item not found"})
		return
	}

	ctx.JSON(http.StatusOK, item)
}

// GetClipboardHistory 获取剪贴板历史记录
func (c *ClipboardController) GetClipboardHistory(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取分页参数
	pageStr := ctx.DefaultQuery("page", "1")
	sizeStr := ctx.DefaultQuery("size", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	size, err := strconv.Atoi(sizeStr)
	if err != nil || size < 1 || size > 100 {
		size = 20
	}

	// 获取历史记录
	items, total, totalPages, err := c.clipboardService.GetClipboardHistory(channelID.(string), page, size)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items":      items,
		"total":      total,
		"page":       page,
		"size":       size,
		"totalPages": totalPages,
	})
}

// DeleteClipboard 删除剪贴板项目
func (c *ClipboardController) DeleteClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	itemID := ctx.Param("itemID")

	// 删除剪贴板项目
	err := c.clipboardService.DeleteClipboard(itemID, channelID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "clipboard item deleted"})
}

// UpdateClipboard 更新剪贴板项目
func (c *ClipboardController) UpdateClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	itemID := ctx.Param("itemID")

	// 绑定请求体 - 适配前端发送的字段格式
	var req struct {
		Title      string `json:"title"`
		Content    string `json:"content"`
		Type       string `json:"type"`
		DeviceID   string `json:"device_id"`
		DeviceType string `json:"device_type"`
		IsFavorite *bool  `json:"isFavorite"` // 使用指针类型，允许为空
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新剪贴板项目
	item, err := c.clipboardService.UpdateClipboard(
		itemID,
		req.Title,
		req.Content,
		req.Type,
		req.DeviceID,
		req.DeviceType,
		channelID.(string),
	)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 如果提供了收藏状态，单独处理
	if req.IsFavorite != nil {
		item, err = c.clipboardService.ToggleFavorite(itemID, *req.IsFavorite, channelID.(string), req.DeviceID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	ctx.JSON(http.StatusOK, item)
}

// ToggleFavorite 切换收藏状态
func (c *ClipboardController) ToggleFavorite(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	itemID := ctx.Param("itemID")

	// 绑定请求体 - 适配前端发送的字段格式
	var req struct {
		IsFavorite bool   `json:"isFavorite" binding:"required"`
		DeviceID   string `json:"device_id"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 切换收藏状态
	item, err := c.clipboardService.ToggleFavorite(itemID, req.IsFavorite, channelID.(string), req.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, item)
}

// GetFavoriteClipboard 获取收藏的剪贴板项目
func (c *ClipboardController) GetFavoriteClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取查询参数
	limitStr := ctx.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	// 获取收藏项目
	items, err := c.clipboardService.GetFavoriteClipboard(channelID.(string), limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, items)
}

// GetClipboardByType 按类型获取剪贴板项目
func (c *ClipboardController) GetClipboardByType(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	clipType := ctx.Param("type")

	// 获取分页参数
	pageStr := ctx.DefaultQuery("page", "1")
	sizeStr := ctx.DefaultQuery("size", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	size, err := strconv.Atoi(sizeStr)
	if err != nil || size < 1 || size > 100 {
		size = 20
	}

	// 按类型获取项目
	var items []*model.ClipboardItem
	var total int64
	var totalPages int

	items, total, totalPages, err = c.clipboardService.GetClipboardByType(clipType, channelID.(string), page, size)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items":      items,
		"total":      total,
		"page":       page,
		"size":       size,
		"totalPages": totalPages,
	})
}

// GetClipboardByDeviceType 按设备类型获取剪贴板项目
func (c *ClipboardController) GetClipboardByDeviceType(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}
	deviceType := ctx.Param("deviceType")

	// 获取分页参数
	pageStr := ctx.DefaultQuery("page", "1")
	sizeStr := ctx.DefaultQuery("size", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	size, err := strconv.Atoi(sizeStr)
	if err != nil || size < 1 || size > 100 {
		size = 20
	}

	// 按设备类型获取项目
	items, total, totalPages, err := c.clipboardService.GetClipboardByDeviceType(deviceType, channelID.(string), page, size)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items":      items,
		"total":      total,
		"page":       page,
		"size":       size,
		"totalPages": totalPages,
	})
}

// GetCurrentClipboard 获取当前剪贴板内容（专用接口，避免路由冲突）
func (c *ClipboardController) GetCurrentClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取最新的一条剪贴板内容
	items, err := c.clipboardService.GetLatestClipboard(channelID.(string), 1)
	if err != nil {
		// 返回空对象而不是报错
		ctx.JSON(http.StatusOK, gin.H{})
		return
	}

	// 如果没有找到记录，返回空对象
	if len(items) == 0 {
		ctx.JSON(http.StatusOK, gin.H{})
		return
	}

	// 返回第一条记录
	ctx.JSON(http.StatusOK, items[0])
}

// SearchClipboard 搜索剪贴板项目
func (c *ClipboardController) SearchClipboard(ctx *gin.Context) {
	// 从上下文获取channelID
	channelID, exists := ctx.Get("channelID")
	if !exists {
		channelID = ctx.Param("channelID") // 兼容旧路由
	}

	// 获取搜索关键词
	keyword := ctx.Query("q")
	if keyword == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "搜索关键词不能为空"})
		return
	}

	// 获取分页参数
	pageStr := ctx.DefaultQuery("page", "1")
	sizeStr := ctx.DefaultQuery("size", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	size, err := strconv.Atoi(sizeStr)
	if err != nil || size < 1 || size > 100 {
		size = 20
	}

	// 执行搜索
	items, total, totalPages, err := c.clipboardService.SearchClipboard(keyword, channelID.(string), page, size)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items":      items,
		"total":      total,
		"page":       page,
		"size":       size,
		"totalPages": totalPages,
		"keyword":    keyword,
	})
}
