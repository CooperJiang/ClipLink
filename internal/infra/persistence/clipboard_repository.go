package persistence

import (
	"errors"

	"github.com/xiaojiu/cliplink/internal/domain/model"
	"github.com/xiaojiu/cliplink/internal/domain/repository"
	"github.com/xiaojiu/cliplink/internal/infra/db"
)

// clipboardRepository 剪贴板仓库实现
type clipboardRepository struct{}

// NewClipboardRepository 创建新的剪贴板仓库
func NewClipboardRepository() repository.ClipboardRepository {
	return &clipboardRepository{}
}

// Save 保存剪贴板项目
func (r *clipboardRepository) Save(item *model.ClipboardItem) error {
	return db.GetDB().Create(item).Error
}

// FindByID 通过ID查找剪贴板项目
func (r *clipboardRepository) FindByID(id, channelID string) (*model.ClipboardItem, error) {
	var item model.ClipboardItem
	result := db.GetDB().Where("id = ? AND channel_id = ?", id, channelID).First(&item)
	if result.Error != nil {
		return nil, result.Error
	}
	return &item, nil
}

// FindLatest 获取最新的剪贴板项目
func (r *clipboardRepository) FindLatest(channelID string, limit int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem
	query := db.GetDB().Model(&model.ClipboardItem{})
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}
	err := query.Order("created_at DESC").Limit(limit).Find(&items).Error
	return items, err
}

// FindWithPagination 分页获取剪贴板项目
func (r *clipboardRepository) FindWithPagination(channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error) {
	offset := (page - 1) * size
	var items []*model.ClipboardItem
	var total int64

	// 获取符合条件的记录总数
	query := db.GetDB().Model(&model.ClipboardItem{})
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages := int(total / int64(size))
	if total%int64(size) > 0 {
		totalPages++
	}

	// 获取分页数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(size).Find(&items).Error; err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// FindByType 按类型查找剪贴板项目
func (r *clipboardRepository) FindByType(contentType, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error) {
	offset := (page - 1) * size
	var items []*model.ClipboardItem
	var total int64

	// 构建查询
	query := db.GetDB().Model(&model.ClipboardItem{}).Where("type = ?", contentType)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	// 获取总记录数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages := int(total / int64(size))
	if total%int64(size) > 0 {
		totalPages++
	}

	// 获取分页数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(size).Find(&items).Error; err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// FindByDeviceType 按设备类型查找剪贴板项目
func (r *clipboardRepository) FindByDeviceType(deviceType, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error) {
	offset := (page - 1) * size
	var items []*model.ClipboardItem
	var total int64

	// 构建查询
	query := db.GetDB().Model(&model.ClipboardItem{}).Where("device_type = ?", deviceType)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	// 获取总记录数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages := int(total / int64(size))
	if total%int64(size) > 0 {
		totalPages++
	}

	// 获取分页数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(size).Find(&items).Error; err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// FindByTypeAndDeviceType 同时按内容类型和设备类型查找剪贴板项目
func (r *clipboardRepository) FindByTypeAndDeviceType(contentType, deviceType, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error) {
	var items []*model.ClipboardItem
	var total int64

	query := db.GetDB().Model(&model.ClipboardItem{})

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if contentType != "" {
		query = query.Where("type = ?", contentType)
	}

	if deviceType != "" {
		query = query.Where("device_type = ?", deviceType)
	}

	// 获取总记录数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages := int(total / int64(size))
	if total%int64(size) > 0 {
		totalPages++
	}

	// 获取分页数据
	offset := (page - 1) * size
	if err := query.Order("created_at DESC").Offset(offset).Limit(size).Find(&items).Error; err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}

// FindFavorites 查找收藏的剪贴板项目
func (r *clipboardRepository) FindFavorites(channelID string, limit int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem
	query := db.GetDB()

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	err := query.Where("favorite = ?", true).
		Order("updated_at DESC").
		Limit(limit).
		Find(&items).Error
	return items, err
}

// Update 更新剪贴板项目
func (r *clipboardRepository) Update(id, channelID string, updates map[string]interface{}) error {
	result := db.GetDB().Model(&model.ClipboardItem{}).
		Where("id = ? AND channel_id = ?", id, channelID).
		Updates(updates)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("item not found")
	}

	return nil
}

// Delete 删除剪贴板项目
func (r *clipboardRepository) Delete(id, channelID string) error {
	result := db.GetDB().Where("id = ? AND channel_id = ?", id, channelID).
		Delete(&model.ClipboardItem{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("item not found")
	}

	return nil
}

// Count 统计剪贴板项目数量
func (r *clipboardRepository) Count(channelID string) (int64, error) {
	var count int64
	query := db.GetDB().Model(&model.ClipboardItem{})

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	err := query.Count(&count).Error
	return count, err
}

// CountByType 按类型统计剪贴板项目数量
func (r *clipboardRepository) CountByType(contentType, channelID string) (int64, error) {
	var count int64
	query := db.GetDB().Model(&model.ClipboardItem{}).Where("type = ?", contentType)

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	err := query.Count(&count).Error
	return count, err
}

// SearchByKeyword 按关键词搜索剪贴板项目（支持标题和内容搜索）
func (r *clipboardRepository) SearchByKeyword(keyword, channelID string, page, size int) ([]*model.ClipboardItem, int64, int, error) {
	offset := (page - 1) * size
	var items []*model.ClipboardItem
	var total int64

	// 构建搜索查询 - 在标题和内容中搜索关键词
	searchPattern := "%" + keyword + "%"
	query := db.GetDB().Model(&model.ClipboardItem{}).Where(
		"(title LIKE ? OR content LIKE ?)",
		searchPattern, searchPattern,
	)

	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	// 获取总记录数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	// 计算总页数
	totalPages := int(total / int64(size))
	if total%int64(size) > 0 {
		totalPages++
	}

	// 获取分页数据，按相关度和时间排序
	// 优先显示标题匹配的结果，然后按创建时间倒序
	orderClause := "CASE WHEN title LIKE '" + searchPattern + "' THEN 0 ELSE 1 END, created_at DESC"
	if err := query.Order(orderClause).Offset(offset).Limit(size).Find(&items).Error; err != nil {
		return nil, 0, 0, err
	}

	return items, total, totalPages, nil
}
