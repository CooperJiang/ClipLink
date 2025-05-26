package service

// StatsService 统计服务接口
type StatsService interface {
	// GetChannelStats 获取通道统计数据
	GetChannelStats(channelID string) (map[string]interface{}, error)
}
