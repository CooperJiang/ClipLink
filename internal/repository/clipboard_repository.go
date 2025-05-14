package repository

import (
	"errors"
	"time"

	"github.com/xiaojiu/clipboard/internal/model"
	"gorm.io/gorm"
)

// ClipboardRepository 剪贴板存储库接口
type ClipboardRepository interface {
	Save(item *model.ClipboardItem) error
	GetLatest(channelID string) (*model.ClipboardItem, error)
	GetByID(id string, channelID string) (*model.ClipboardItem, error)
	GetHistory(channelID string, limit, offset int) ([]*model.ClipboardItem, error)
	GetHistoryCount(channelID string) (int64, error)
	Delete(id string, channelID string) error
	Update(id string, channelID string, updates map[string]interface{}) error
	ToggleFavorite(id string, channelID string) error
	GetFavorites(channelID string, limit int) ([]*model.ClipboardItem, error)
	GetByType(channelID string, contentType string, limit, offset int) ([]*model.ClipboardItem, error)
	GetByTypeCount(channelID string, contentType string) (int64, error)
	GetByDeviceType(channelID string, deviceType string, limit, offset int) ([]*model.ClipboardItem, error)
	GetByDeviceTypeCount(channelID string, deviceType string) (int64, error)

	// 通用条件查询
	GetWithConditions(conditions map[string]interface{}, limit, offset int) ([]*model.ClipboardItem, error)
	GetCountWithConditions(conditions map[string]interface{}) (int64, error)
}

// GormClipboardRepository 基于GORM的剪贴板存储库实现
type GormClipboardRepository struct {
	db *gorm.DB
}

// NewClipboardRepository 创建剪贴板存储库
func NewClipboardRepository(db *gorm.DB) ClipboardRepository {
	return &GormClipboardRepository{
		db: db,
	}
}

// Save 保存剪贴板项目
func (r *GormClipboardRepository) Save(item *model.ClipboardItem) error {
	return r.db.Create(item).Error
}

// GetLatest 获取最新的剪贴板项目
func (r *GormClipboardRepository) GetLatest(channelID string) (*model.ClipboardItem, error) {
	var item model.ClipboardItem

	// 检查是否有剪贴板项目
	var count int64
	query := r.db.Model(&model.ClipboardItem{})
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个默认的
	if count == 0 {
		return &model.ClipboardItem{
			ID:        "default",
			Content:   "欢迎使用跨设备剪贴板！复制一些内容到你的设备上吧。",
			Type:      model.TypeText,
			CreatedAt: time.Now(),
			DeviceID:  "system",
			ChannelID: channelID,
		}, nil
	}

	// 获取最新的项目
	query = r.db.Order("created_at DESC")
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.First(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

// GetByID 通过ID获取剪贴板项目
func (r *GormClipboardRepository) GetByID(id string, channelID string) (*model.ClipboardItem, error) {
	if id == "" {
		return nil, errors.New("ID不能为空")
	}

	var item model.ClipboardItem
	query := r.db.Where("id = ?", id)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.First(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

// GetHistory 获取剪贴板历史记录
func (r *GormClipboardRepository) GetHistory(channelID string, limit, offset int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem

	// 检查是否有剪贴板项目
	var count int64
	query := r.db.Model(&model.ClipboardItem{})
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录
	query = r.db.Order("created_at DESC").Limit(limit).Offset(offset)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetHistoryCount 获取剪贴板历史记录总数
func (r *GormClipboardRepository) GetHistoryCount(channelID string) (int64, error) {
	var count int64
	query := r.db.Model(&model.ClipboardItem{})
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// Delete 删除剪贴板项目
func (r *GormClipboardRepository) Delete(id string, channelID string) error {
	if id == "" {
		return errors.New("ID不能为空")
	}

	// 删除项目
	query := r.db.Where("id = ?", id)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	result := query.Delete(&model.ClipboardItem{})
	if result.Error != nil {
		return result.Error
	}

	// 检查是否找到并删除了项目
	if result.RowsAffected == 0 {
		return errors.New("找不到指定ID的项目")
	}

	return nil
}

// Update 更新剪贴板项目
func (r *GormClipboardRepository) Update(id string, channelID string, updates map[string]interface{}) error {
	if id == "" {
		return errors.New("ID不能为空")
	}

	// 更新项目
	query := r.db.Model(&model.ClipboardItem{}).Where("id = ?", id)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	result := query.Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	// 检查是否找到并更新了项目
	if result.RowsAffected == 0 {
		return errors.New("找不到指定ID的项目")
	}

	return nil
}

// ToggleFavorite 切换收藏状态
func (r *GormClipboardRepository) ToggleFavorite(id string, channelID string) error {
	if id == "" {
		return errors.New("ID不能为空")
	}

	// 先获取当前项目
	var item model.ClipboardItem
	query := r.db.Where("id = ?", id)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.First(&item).Error; err != nil {
		return err
	}

	// 切换收藏状态
	query = r.db.Model(&model.ClipboardItem{}).Where("id = ?", id)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	return query.Update("favorite", !item.Favorite).Error
}

// GetFavorites 获取已收藏的剪贴板项目
func (r *GormClipboardRepository) GetFavorites(channelID string, limit int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem

	// 检查是否有收藏的剪贴板项目
	var count int64
	query := r.db.Model(&model.ClipboardItem{}).Where("favorite = ?", true)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有收藏项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取收藏列表，按时间降序
	query = r.db.Where("favorite = ?", true).Order("created_at DESC").Limit(limit)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetByType 按内容类型获取剪贴板历史记录
func (r *GormClipboardRepository) GetByType(channelID string, contentType string, limit, offset int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem

	// 检查是否有符合条件的剪贴板项目
	var count int64
	countQuery := r.db.Model(&model.ClipboardItem{}).Where("type = ?", contentType)
	if channelID != "" {
		countQuery = countQuery.Where("channel_id = ?", channelID)
	}

	if err := countQuery.Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录
	query := r.db.Where("type = ?", contentType).Order("created_at DESC").Limit(limit).Offset(offset)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetByTypeCount 获取指定内容类型的剪贴板记录总数
func (r *GormClipboardRepository) GetByTypeCount(channelID string, contentType string) (int64, error) {
	var count int64
	query := r.db.Model(&model.ClipboardItem{}).Where("type = ?", contentType)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// GetByDeviceType 按设备类型获取剪贴板历史记录
func (r *GormClipboardRepository) GetByDeviceType(channelID string, deviceType string, limit, offset int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem

	// 检查是否有符合条件的剪贴板项目
	var count int64
	countQuery := r.db.Model(&model.ClipboardItem{}).Where("device_type = ?", deviceType)
	if channelID != "" {
		countQuery = countQuery.Where("channel_id = ?", channelID)
	}

	if err := countQuery.Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 获取历史记录
	query := r.db.Where("device_type = ?", deviceType).Order("created_at DESC").Limit(limit).Offset(offset)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

// GetByDeviceTypeCount 获取指定设备类型的剪贴板记录总数
func (r *GormClipboardRepository) GetByDeviceTypeCount(channelID string, deviceType string) (int64, error) {
	var count int64
	query := r.db.Model(&model.ClipboardItem{}).Where("device_type = ?", deviceType)
	if channelID != "" {
		query = query.Where("channel_id = ?", channelID)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// GetWithConditions 按条件获取剪贴板项目
func (r *GormClipboardRepository) GetWithConditions(conditions map[string]interface{}, limit, offset int) ([]*model.ClipboardItem, error) {
	var items []*model.ClipboardItem

	// 创建查询
	countQuery := r.db.Model(&model.ClipboardItem{})

	// 添加条件
	for key, value := range conditions {
		countQuery = countQuery.Where(key+" = ?", value)
	}

	// 检查是否有符合条件的剪贴板项目
	var count int64
	if err := countQuery.Count(&count).Error; err != nil {
		return nil, err
	}

	// 如果没有项目，返回一个空数组
	if count == 0 {
		return items, nil
	}

	// 创建查询
	query := r.db.Model(&model.ClipboardItem{})

	// 添加条件
	for key, value := range conditions {
		query = query.Where(key+" = ?", value)
	}

	// 执行查询
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error
	if err != nil {
		return nil, err
	}

	return items, nil
}

// GetCountWithConditions 获取符合条件的剪贴板项目数量
func (r *GormClipboardRepository) GetCountWithConditions(conditions map[string]interface{}) (int64, error) {
	var count int64

	// 创建查询
	query := r.db.Model(&model.ClipboardItem{})

	// 添加条件
	for key, value := range conditions {
		query = query.Where(key+" = ?", value)
	}

	// 执行计数查询
	err := query.Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}
