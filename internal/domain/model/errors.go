package model

import "errors"

// 领域错误定义
// Domain error definitions
var (
	// ErrChannelNotFound 频道不存在错误
	// ErrChannelNotFound is returned when a channel is not found
	ErrChannelNotFound = errors.New("channel not found")

	// ErrDeviceNotFound 设备不存在错误
	// ErrDeviceNotFound is returned when a device is not found
	ErrDeviceNotFound = errors.New("device not found")

	// ErrClipboardNotFound 剪贴板条目不存在错误
	// ErrClipboardNotFound is returned when a clipboard item is not found
	ErrClipboardNotFound = errors.New("clipboard item not found")

	// ErrInvalidInput 输入无效错误
	// ErrInvalidInput is returned when input validation fails
	ErrInvalidInput = errors.New("invalid input")

	// ErrUnauthorized 未授权错误
	// ErrUnauthorized is returned when an action is not authorized
	ErrUnauthorized = errors.New("unauthorized")

	// ErrDatabaseError 数据库错误
	// ErrDatabaseError is returned when a database operation fails
	ErrDatabaseError = errors.New("database error")
)
