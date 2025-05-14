package controller

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/clipboard/internal/common/response"
	"github.com/xiaojiu/clipboard/internal/model"
	"github.com/xiaojiu/clipboard/internal/service"
)

// ClipboardController 剪贴板控制器
type ClipboardController struct {
	clipboardService service.ClipboardService
}

// NewClipboardController 创建剪贴板控制器
func NewClipboardController(clipboardService service.ClipboardService) *ClipboardController {
	return &ClipboardController{
		clipboardService: clipboardService,
	}
}

// 从请求头中获取通道ID
func getChannelIDFromHeader(ctx *gin.Context) string {
	return ctx.GetHeader("X-Channel-ID")
}

// SaveClipboard 保存剪贴板内容
func (c *ClipboardController) SaveClipboard(ctx *gin.Context) {
	var request struct {
		Content    string `json:"content" binding:"required"`
		Type       string `json:"type" binding:"required"`
		DeviceID   string `json:"device_id" binding:"required"`
		DeviceType string `json:"device_type"`
		Title      string `json:"title"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		response.BadRequest(ctx, "请求参数错误: "+err.Error())
		return
	}

	// 设置默认值
	if request.DeviceType == "" {
		request.DeviceType = "other"
	}

	// 验证内容类型
	validTypes := map[string]bool{
		"text":     true,
		"link":     true,
		"code":     true,
		"password": true,
		"image":    true,
		"file":     true,
	}

	if !validTypes[request.Type] {
		request.Type = "text" // 默认为文本类型
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 保存剪贴板内容
	item, err := c.clipboardService.SaveClipboard(request.Content, request.Type, request.DeviceID, request.DeviceType, request.Title, channelID)
	if err != nil {
		response.ServerError(ctx, "保存剪贴板内容失败: "+err.Error())
		return
	}

	response.Success(ctx, item, "保存成功")
}

// GetLatestClipboard 获取最新的剪贴板内容
func (c *ClipboardController) GetLatestClipboard(ctx *gin.Context) {
	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 获取最新的剪贴板内容
	item, err := c.clipboardService.GetLatestClipboard(channelID)
	if err != nil {
		response.ServerError(ctx, "获取最新剪贴板内容失败: "+err.Error())
		return
	}

	response.Success(ctx, item, "获取成功")
}

// GetClipboardHistory 获取剪贴板历史记录
func (c *ClipboardController) GetClipboardHistory(ctx *gin.Context) {
	// 默认分页参数
	page := 1
	size := 10

	// 解析页码参数
	if pageParam := ctx.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	// 解析每页大小参数
	if sizeParam := ctx.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= 50 {
			size = parsedSize
		}
	}

	// 获取筛选参数
	contentType := ctx.Query("type")
	deviceType := ctx.Query("device_type")

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 验证内容类型
	if contentType != "" {
		validTypes := map[string]bool{
			"text":     true,
			"link":     true,
			"code":     true,
			"password": true,
			"image":    true,
			"file":     true,
		}

		if !validTypes[contentType] {
			contentType = "" // 如果不合法，不筛选
		}
	}

	// 验证设备类型
	if deviceType != "" {
		validDeviceTypes := map[string]bool{
			"phone":   true,
			"tablet":  true,
			"desktop": true,
			"other":   true,
		}

		if !validDeviceTypes[deviceType] {
			deviceType = "" // 如果不合法，不筛选
		}
	}

	// 根据参数获取不同类型的历史记录
	var items []*model.ClipboardItem
	var total int64
	var totalPages int
	var err error

	if contentType != "" && deviceType != "" {
		// 同时筛选内容类型和设备类型
		items, total, totalPages, err = c.clipboardService.GetClipboardByTypeAndDeviceType(contentType, deviceType, channelID, page, size)
	} else if contentType != "" {
		// 仅筛选内容类型
		items, total, totalPages, err = c.clipboardService.GetClipboardByType(contentType, channelID, page, size)
	} else if deviceType != "" {
		// 仅筛选设备类型
		items, total, totalPages, err = c.clipboardService.GetClipboardByDeviceType(deviceType, channelID, page, size)
	} else {
		// 不筛选
		items, total, totalPages, err = c.clipboardService.GetClipboardHistory(channelID, page, size)
	}

	if err != nil {
		response.ServerError(ctx, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	// 返回分页数据
	response.SuccessWithPage(ctx, items, total, page, size, totalPages)
}

// DeleteClipboard 删除剪贴板项目
func (c *ClipboardController) DeleteClipboard(ctx *gin.Context) {
	id := ctx.Param("id")
	if id == "" {
		response.BadRequest(ctx, "ID参数必须提供")
		return
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 删除项目
	if err := c.clipboardService.DeleteClipboard(id, channelID); err != nil {
		response.ServerError(ctx, "删除剪贴板项目失败: "+err.Error())
		return
	}

	response.SuccessWithMessage(ctx, "删除成功")
}

// UpdateClipboard 更新剪贴板项目
func (c *ClipboardController) UpdateClipboard(ctx *gin.Context) {
	id := ctx.Param("id")
	if id == "" {
		response.BadRequest(ctx, "ID参数必须提供")
		return
	}

	// 解析请求体
	var request struct {
		Title      string `json:"title"`
		Content    string `json:"content"`
		DeviceType string `json:"device_type"`
		Type       string `json:"type"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		response.BadRequest(ctx, "请求参数错误: "+err.Error())
		return
	}

	// 验证内容类型
	if request.Type != "" {
		validTypes := map[string]bool{
			"text":     true,
			"link":     true,
			"code":     true,
			"password": true,
			"image":    true,
			"file":     true,
		}

		if !validTypes[request.Type] {
			response.BadRequest(ctx, "无效的内容类型")
			return
		}
	}

	// 验证设备类型
	if request.DeviceType != "" {
		validDeviceTypes := map[string]bool{
			"phone":   true,
			"tablet":  true,
			"desktop": true,
			"other":   true,
		}

		if !validDeviceTypes[request.DeviceType] {
			response.BadRequest(ctx, "无效的设备类型")
			return
		}
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 更新项目
	item, err := c.clipboardService.UpdateClipboard(id, request.Title, request.Content, request.Type, request.DeviceType, channelID)
	if err != nil {
		response.ServerError(ctx, "更新剪贴板项目失败: "+err.Error())
		return
	}

	if item == nil {
		response.BadRequest(ctx, "未提供任何更新内容")
		return
	}

	response.Success(ctx, item, "更新成功")
}

// ToggleFavorite 切换收藏状态
func (c *ClipboardController) ToggleFavorite(ctx *gin.Context) {
	id := ctx.Param("id")
	if id == "" {
		response.BadRequest(ctx, "ID参数必须提供")
		return
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 切换收藏状态
	item, err := c.clipboardService.ToggleFavorite(id, channelID)
	if err != nil {
		response.ServerError(ctx, "切换收藏状态失败: "+err.Error())
		return
	}

	response.Success(ctx, item, "操作成功")
}

// GetFavorites 获取收藏的剪贴板项目
func (c *ClipboardController) GetFavorites(ctx *gin.Context) {
	limit := 50 // 默认限制

	// 如果提供了限制参数，解析它
	if limitParam := ctx.Query("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
			if parsedLimit > 0 && parsedLimit <= 100 {
				limit = parsedLimit
			}
		}
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 获取收藏列表
	items, err := c.clipboardService.GetFavorites(channelID, limit)
	if err != nil {
		response.ServerError(ctx, "获取收藏列表失败: "+err.Error())
		return
	}

	response.Success(ctx, items, "获取成功")
}

// GetClipboardItem 获取单个剪贴板项目
func (c *ClipboardController) GetClipboardItem(ctx *gin.Context) {
	id := ctx.Param("id")
	if id == "" {
		response.BadRequest(ctx, "ID参数必须提供")
		return
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 获取项目
	item, err := c.clipboardService.GetClipboardItem(id, channelID)
	if err != nil {
		if err.Error() == "record not found" {
			response.NotFound(ctx, "找不到指定ID的项目")
		} else {
			response.ServerError(ctx, "获取剪贴板项目失败: "+err.Error())
		}
		return
	}

	response.Success(ctx, item, "获取成功")
}

// GetClipboardByType 按内容类型获取剪贴板历史记录
func (c *ClipboardController) GetClipboardByType(ctx *gin.Context) {
	contentType := ctx.Param("type")
	if contentType == "" {
		response.BadRequest(ctx, "内容类型参数必须提供")
		return
	}

	// 验证内容类型
	validTypes := map[string]bool{
		"text":     true,
		"link":     true,
		"code":     true,
		"password": true,
		"image":    true,
		"file":     true,
	}

	if !validTypes[contentType] {
		response.BadRequest(ctx, "无效的内容类型")
		return
	}

	// 默认分页参数
	page := 1
	size := 10

	// 解析页码参数
	if pageParam := ctx.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	// 解析每页大小参数
	if sizeParam := ctx.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= 50 {
			size = parsedSize
		}
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 获取分页数据
	items, total, totalPages, err := c.clipboardService.GetClipboardByType(contentType, channelID, page, size)
	if err != nil {
		response.ServerError(ctx, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	// 返回分页数据
	response.SuccessWithPage(ctx, items, total, page, size, totalPages)
}

// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
func (c *ClipboardController) GetClipboardByDeviceType(ctx *gin.Context) {
	deviceType := ctx.Param("device_type")
	if deviceType == "" {
		response.BadRequest(ctx, "设备类型参数必须提供")
		return
	}

	// 验证设备类型
	validDeviceTypes := map[string]bool{
		"phone":   true,
		"tablet":  true,
		"desktop": true,
		"other":   true,
	}

	if !validDeviceTypes[deviceType] {
		response.BadRequest(ctx, "无效的设备类型")
		return
	}

	// 默认分页参数
	page := 1
	size := 10

	// 解析页码参数
	if pageParam := ctx.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	// 解析每页大小参数
	if sizeParam := ctx.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= 50 {
			size = parsedSize
		}
	}

	// 获取通道ID
	channelID := getChannelIDFromHeader(ctx)

	// 获取分页数据
	items, total, totalPages, err := c.clipboardService.GetClipboardByDeviceType(deviceType, channelID, page, size)
	if err != nil {
		response.ServerError(ctx, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	// 返回分页数据
	response.SuccessWithPage(ctx, items, total, page, size, totalPages)
}
