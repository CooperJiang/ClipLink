package api

import (
	"math"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xiaojiu/cliplink/internal/common/constants"
	"github.com/xiaojiu/cliplink/internal/common/response"
	"github.com/xiaojiu/cliplink/internal/db"
)

type Handler struct {
	db *db.DB
}

func NewHandler(database *db.DB) *Handler {
	return &Handler{db: database}
}

func parsePaginationParams(c *gin.Context) (page, size, offset int) {
	page = constants.DefaultPage
	size = constants.DefaultPageSize

	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	if sizeParam := c.Query("size"); sizeParam != "" {
		if parsedSize, err := strconv.Atoi(sizeParam); err == nil && parsedSize > 0 && parsedSize <= constants.MaxPageSize {
			size = parsedSize
		}
	}

	offset = (page - 1) * size
	return
}

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

	if request.DeviceType == "" {
		request.DeviceType = "other"
	}

	if !constants.ValidContentTypes[request.Type] {
		request.Type = "text"
	}

	item := &db.ClipboardItem{
		ID:         uuid.New().String(),
		Content:    request.Content,
		Type:       request.Type,
		CreatedAt:  time.Now(),
		DeviceID:   request.DeviceID,
		DeviceType: request.DeviceType,
	}

	if err := h.db.SaveClipboardItem(item); err != nil {
		response.ServerError(c, "保存剪贴板内容失败: "+err.Error())
		return
	}

	response.Success(c, item, "保存成功")
}

func (h *Handler) GetLatestClipboard(c *gin.Context) {
	item, err := h.db.GetLatestClipboardItem()
	if err != nil {
		response.ServerError(c, "获取最新剪贴板内容失败: "+err.Error())
		return
	}

	response.Success(c, item, "获取成功")
}

func (h *Handler) GetClipboardHistory(c *gin.Context) {
	page, size, offset := parsePaginationParams(c)
	contentType := c.Query("type")
	deviceType := c.Query("device_type")

	if contentType != "" && !constants.ValidContentTypes[contentType] {
		contentType = ""
	}

	if deviceType != "" && !constants.ValidDeviceTypes[deviceType] {
		deviceType = ""
	}

	var items []*db.ClipboardItem
	var err error
	var total int64

	if contentType != "" && deviceType != "" {
		items, err = h.db.GetClipboardByTypeAndDeviceType(contentType, deviceType, size, offset)
		if err == nil {
			total, err = h.db.GetClipboardByTypeAndDeviceTypeCount(contentType, deviceType)
		}
	} else if contentType != "" {
		items, err = h.db.GetClipboardByType(contentType, size, offset)
		if err == nil {
			total, err = h.db.GetClipboardByTypeCount(contentType)
		}
	} else if deviceType != "" {
		items, err = h.db.GetClipboardByDeviceType(deviceType, size, offset)
		if err == nil {
			total, err = h.db.GetClipboardByDeviceTypeCount(deviceType)
		}
	} else {
		items, err = h.db.GetClipboardHistory(size, offset)
		if err == nil {
			total, err = h.db.GetClipboardHistoryCount()
		}
	}

	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))

	response.SuccessWithPage(c, items, total, page, size, totalPages)
}

func (h *Handler) DeleteClipboard(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	if err := h.db.DeleteClipboardItem(id); err != nil {
		response.ServerError(c, "删除剪贴板项目失败: "+err.Error())
		return
	}

	response.SuccessWithMessage(c, "删除成功")
}

func (h *Handler) UpdateClipboard(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	var request struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		response.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	updates := make(map[string]interface{})
	if request.Title != "" {
		updates["title"] = request.Title
	}
	if request.Content != "" {
		updates["content"] = request.Content
	}

	if len(updates) == 0 {
		response.BadRequest(c, "未提供任何更新内容")
		return
	}

	if err := h.db.UpdateClipboardItem(id, updates); err != nil {
		response.ServerError(c, "更新剪贴板项目失败: "+err.Error())
		return
	}

	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		response.ServerError(c, "更新成功但获取更新项目失败")
		return
	}

	response.Success(c, item, "更新成功")
}

func (h *Handler) ToggleFavorite(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

	if err := h.db.ToggleFavorite(id); err != nil {
		response.ServerError(c, "切换收藏状态失败: "+err.Error())
		return
	}

	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		response.ServerError(c, "操作成功但获取更新项目失败")
		return
	}

	response.Success(c, item, "操作成功")
}

func (h *Handler) GetFavorites(c *gin.Context) {
	limit := 50

	if limitParam := c.Query("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
			if parsedLimit > 0 && parsedLimit <= constants.MaxFavoritesLimit {
				limit = parsedLimit
			}
		}
	}

	items, err := h.db.GetFavoriteClipboardItems(limit)
	if err != nil {
		response.ServerError(c, "获取收藏列表失败: "+err.Error())
		return
	}

	response.Success(c, items, "获取成功")
}

func (h *Handler) GetClipboardItem(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "ID参数必须提供")
		return
	}

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

func (h *Handler) GetClipboardByType(c *gin.Context) {
	contentType := c.Param("type")
	if contentType == "" {
		response.BadRequest(c, "内容类型参数必须提供")
		return
	}

	if !constants.ValidContentTypes[contentType] {
		response.BadRequest(c, "无效的内容类型")
		return
	}

	page, size, offset := parsePaginationParams(c)

	items, err := h.db.GetClipboardByType(contentType, size, offset)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	total, err := h.db.GetClipboardByTypeCount(contentType)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录总数失败: "+err.Error())
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))

	response.SuccessWithPage(c, items, total, page, size, totalPages)
}

func (h *Handler) GetClipboardByDeviceType(c *gin.Context) {
	deviceType := c.Param("device_type")
	if deviceType == "" {
		response.BadRequest(c, "设备类型参数必须提供")
		return
	}

	if !constants.ValidDeviceTypes[deviceType] {
		response.BadRequest(c, "无效的设备类型")
		return
	}

	page, size, offset := parsePaginationParams(c)

	items, err := h.db.GetClipboardByDeviceType(deviceType, size, offset)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录失败: "+err.Error())
		return
	}

	total, err := h.db.GetClipboardByDeviceTypeCount(deviceType)
	if err != nil {
		response.ServerError(c, "获取剪贴板历史记录总数失败: "+err.Error())
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))

	response.SuccessWithPage(c, items, total, page, size, totalPages)
}
