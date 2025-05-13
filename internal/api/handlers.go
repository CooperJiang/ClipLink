package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
		Content  string `json:"content" binding:"required"`
		Type     string `json:"type" binding:"required"`
		DeviceID string `json:"device_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 创建新的剪贴板项目
	item := &db.ClipboardItem{
		ID:        uuid.New().String(),
		Content:   request.Content,
		Type:      request.Type,
		CreatedAt: time.Now(),
		DeviceID:  request.DeviceID,
	}

	// 保存到数据库
	if err := h.db.SaveClipboardItem(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// GetLatestClipboard 获取最新的剪贴板内容
func (h *Handler) GetLatestClipboard(c *gin.Context) {
	item, err := h.db.GetLatestClipboardItem()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// GetClipboardHistory 获取剪贴板历史记录
func (h *Handler) GetClipboardHistory(c *gin.Context) {
	limit := 10 // 默认限制

	// 如果提供了限制参数，解析它
	if limitParam := c.Query("limit"); limitParam != "" {
		// 尝试将参数转换为整数
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
			// 设置合理的限制范围
			if parsedLimit > 0 && parsedLimit <= 50 {
				limit = parsedLimit
			}
		}
	}

	// 获取历史记录
	items, err := h.db.GetClipboardHistory(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// DeleteClipboard 删除剪贴板项目
func (h *Handler) DeleteClipboard(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID参数必须提供"})
		return
	}

	// 删除项目
	if err := h.db.DeleteClipboardItem(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// UpdateClipboard 更新剪贴板项目
func (h *Handler) UpdateClipboard(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID参数必须提供"})
		return
	}

	// 解析请求体
	var request struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "未提供任何更新内容"})
		return
	}

	// 更新项目
	if err := h.db.UpdateClipboardItem(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取更新后的项目并返回
	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新成功但获取更新项目失败"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// ToggleFavorite 切换收藏状态
func (h *Handler) ToggleFavorite(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID参数必须提供"})
		return
	}

	// 切换收藏状态
	if err := h.db.ToggleFavorite(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取更新后的项目并返回
	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作成功但获取更新项目失败"})
		return
	}

	c.JSON(http.StatusOK, item)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetClipboardItem 获取单个剪贴板项目
func (h *Handler) GetClipboardItem(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID参数必须提供"})
		return
	}

	// 获取项目
	item, err := h.db.GetClipboardItemByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}
