package api

import (
	"math"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xiaojiu/clipboard/internal/common/response"
	"github.com/xiaojiu/clipboard/internal/db"
)

// Handler 处理API请求
type Handler struct {
	db *db.DB
}

// NewHandler 创建一个新的处理器
func NewHandler(database *db.DB) *Handler {
	return &Handler{db: database}
}

// SaveClipboard 保存剪贴板内容
func (h *Handler) SaveClipboard(c *gin.Context) {
	var request struct {
		Content    string `json:"content" binding:"required"`
		Type       string `json:"type" binding:"required"`
		DeviceID   string `json:"device_id" binding:"required"`
		DeviceType string `json:"device_type"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		response.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 设置默认设备类型
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

	// 创建新的剪贴板项目
	item := &db.ClipboardItem{
		ID:         uuid.New().String(),
		Content:    request.Content,
		Type:       request.Type,
		CreatedAt:  time.Now(),
		DeviceID:   request.DeviceID,
		DeviceType: request.DeviceType,
	}

	// 保存到数据库
	if err := h.db.SaveClipboardItem(item); err != nil {
		response.ServerError(c, "保存剪贴板内容失败: "+err.Error())
		return
	}

	response.Success(c, item, "保存成功")
}

// GetLatestClipboard 获取最新的剪贴板内容
func (h *Handler) GetLatestClipboard(c *gin.Context) {
	item, err := h.db.GetLatestClipboardItem()
	if err != nil {
		response.ServerError(c, "获取最新剪贴板内容失败: "+err.Error())
		return
	}

	response.Success(c, item, "获取成功")
}

// GetClipboardHistory 获取剪贴板历史记录
func (h *Handler) GetClipboardHistory(c *gin.Context) {
	// 默认分页参数
	page := 1
	size := 10

	// 解析页码参数
	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	// 解析每页大小参数
	if sizeParam := c.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= 50 {
			size = parsedSize
		}
	}

	// 计算偏移量
	offset := (page - 1) * size

	// 获取筛选参数
	contentType := c.Query("type")
	deviceType := c.Query("device_type")

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

	// 获取历史记录
	var items []*db.ClipboardItem
	var err error
	var total int64

	if contentType != "" && deviceType != "" {
		// 同时筛选内容类型和设备类型
		items, err = h.db.GetClipboardByTypeAndDeviceType(contentType, deviceType, size, offset)
		if err == nil {
			total, err = h.db.GetClipboardByTypeAndDeviceTypeCount(contentType, deviceType)
		}
	} else if contentType != "" {
		// 仅筛选内容类型
		items, err = h.db.GetClipboardByType(contentType, size, offset)
		if err == nil {
			total, err = h.db.GetClipboardByTypeCount(contentType)
		}
	} else if deviceType != "" {
		// 仅筛选设备类型
		items, err = h.db.GetClipboardByDeviceType(deviceType, size, offset)
		if err == nil {
			total, err = h.db.GetClipboardByDeviceTypeCount(deviceType)
		}
	} else {
		// 不筛选
		items, err = h.db.GetClipboardHistory(size, offset)
		if err == nil {
			total, err = h.db.GetClipboardHistoryCount()
		}
	}

	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(size)))

	// 返回分页数据
	response.SuccessWithPage(c, items, total, page, size, totalPages)
}

// DeleteClipboard 删除剪贴板项目
func (h *Handler) DeleteClipboard(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	// 删除项目
	if err := h.db.DeleteClipboardItem(id); err != nil {
		response.ServerError(c, "删除剪贴板项目失败: "+err.Error())
		return
	}

	response.SuccessWithMessage(c, "删除成功")
}

// UpdateClipboard 更新剪贴板项目
func (h *Handler) UpdateClipboard(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	// 解析请求体
	var request struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		response.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 构建更新参数
	updates := make(map[string]interface{})
	if request.Title != "" {
		updates["title"] = request.Title
	}
	if request.Content != "" {
		updates["content"] = request.Content
	}

	// 如果没有更新项，直接返回
	if len(updates) == 0 {
		response.BadRequest(c, "未提供任何更新内容")
		return
	}

	// 更新项目
	if err := h.db.UpdateClipboardItem(id, updates); err != nil {
		response.ServerError(c, "更新剪贴板项目失败: "+err.Error())
		return
	}

	// 获取更新后的项目并返回
	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		response.ServerError(c, "更新成功但获取更新项目失败")
		return
	}

	response.Success(c, item, "更新成功")
}

// ToggleFavorite 切换收藏状态
func (h *Handler) ToggleFavorite(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	// 切换收藏状态
	if err := h.db.ToggleFavorite(id); err != nil {
		response.ServerError(c, "切换收藏状态失败: "+err.Error())
		return
	}

	// 获取更新后的项目并返回
	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		response.ServerError(c, "操作成功但获取更新项目失败")
		return
	}

	response.Success(c, item, "操作成功")
}

// GetFavorites 获取收藏的剪贴板项目
func (h *Handler) GetFavorites(c *gin.Context) {
	limit := 50 // 默认限制

	// 如果提供了限制参数，解析它
	if limitParam := c.Query("limit"); limitParam != "" {
		// 尝试将参数转换为整数
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
			// 设置合理的限制范围
			if parsedLimit > 0 && parsedLimit <= 100 {
				limit = parsedLimit
			}
		}
	}

	// 获取收藏列表
	items, err := h.db.GetFavoriteClipboardItems(limit)
	if err != nil {
		response.ServerError(c, "获取收藏列表失败: "+err.Error())
		return
	}

	response.Success(c, items, "获取成功")
}

// GetClipboardItem 获取单个剪贴板项目
func (h *Handler) GetClipboardItem(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	// 获取项目
	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			response.NotFound(c, "找不到指定ID的项目")
		} else {
			response.ServerError(c, "获取剪贴板项目失败: "+err.Error())
		}
		return
	}

	response.Success(c, item, "获取成功")
}

// GetClipboardByType 按内容类型获取剪贴板历史记录
func (h *Handler) GetClipboardByType(c *gin.Context) {
	contentType := c.Param("type")
	if contentType == "" {
		response.BadRequest(c, "内容类型参数必须提供")
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
		response.BadRequest(c, "无效的内容类型")
		return
	}

	// 默认分页参数
	page := 1
	size := 10

	// 解析页码参数
	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	// 解析每页大小参数
	if sizeParam := c.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= 50 {
			size = parsedSize
		}
	}

	// 计算偏移量
	offset := (page - 1) * size

	// 获取历史记录
	items, err := h.db.GetClipboardByType(contentType, size, offset)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	// 获取总记录数
	total, err := h.db.GetClipboardByTypeCount(contentType)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录总数失败: "+err.Error())
		return
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(size)))

	// 返回分页数据
	response.SuccessWithPage(c, items, total, page, size, totalPages)
}

// GetClipboardByDeviceType 按设备类型获取剪贴板历史记录
func (h *Handler) GetClipboardByDeviceType(c *gin.Context) {
	deviceType := c.Param("device_type")
	if deviceType == "" {
		response.BadRequest(c, "设备类型参数必须提供")
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
		response.BadRequest(c, "无效的设备类型")
		return
	}

	// 默认分页参数
	page := 1
	size := 10

	// 解析页码参数
	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	// 解析每页大小参数
	if sizeParam := c.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= 50 {
			size = parsedSize
		}
	}

	// 计算偏移量
	offset := (page - 1) * size

	// 获取历史记录
	items, err := h.db.GetClipboardByDeviceType(deviceType, size, offset)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	// 获取总记录数
	total, err := h.db.GetClipboardByDeviceTypeCount(deviceType)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录总数失败: "+err.Error())
		return
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(size)))

	// 返回分页数据
	response.SuccessWithPage(c, items, total, page, size, totalPages)
}
