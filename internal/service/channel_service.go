package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/xiaojiu/cliplink/internal/model"
	"github.com/xiaojiu/cliplink/internal/repository"
)

// ChannelService 通道服务接口
type ChannelService interface {
	CreateChannel(id string) (*model.Channel, error)
	VerifyChannel(id string) (bool, error)
}

// ChannelServiceImpl 通道服务实现
type ChannelServiceImpl struct {
	repo repository.ChannelRepository
}

func NewChannelService(repo repository.ChannelRepository) ChannelService {
	return &ChannelServiceImpl{
		repo: repo,
	}
}

func (s *ChannelServiceImpl) CreateChannel(id string) (*model.Channel, error) {
	if id == "" {
		var err error
		id, err = generateRandomID(32) // 生成32字符的随机ID
		if err != nil {
			return nil, err
		}
	} else if len(id) > 64 {
		return nil, errors.New("通道ID长度不能超过64个字符")
	}

	// 检查id是否已存在
	exists, err := s.repo.ChannelExists(id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("通道ID已存在")
	}

	// 创建通道
	return s.repo.CreateChannel(id)
}

func (s *ChannelServiceImpl) VerifyChannel(id string) (bool, error) {
	if id == "" {
		return false, errors.New("通道ID不能为空")
	}

	return s.repo.ChannelExists(id)
}

func generateRandomID(length int) (string, error) {
	bytes := make([]byte, length/2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
