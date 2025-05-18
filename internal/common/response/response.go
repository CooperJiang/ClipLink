package response

import (
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
)

// 状态码常量
const (
	StatusSuccess      = http.StatusOK
	StatusBadRequest   = http.StatusBadRequest
	StatusUnauthorized = http.StatusUnauthorized
	StatusForbidden    = http.StatusForbidden
	StatusNotFound     = http.StatusNotFound
	StatusServerError  = http.StatusInternalServerError
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Success bool        `json:"success"`
}

func Success(c *gin.Context, data interface{}, message string) {
	if data == nil {
		data = map[string]interface{}{}
	} else {
		v := reflect.ValueOf(data)
		if v.Kind() == reflect.Ptr {
			if v.IsNil() {
				data = map[string]interface{}{}
			} else {
				v = v.Elem()
			}
		}

		if v.Kind() == reflect.Slice && v.IsNil() {
			data = []interface{}{}
		}
	}

	c.JSON(StatusSuccess, Response{
		Code:    StatusSuccess,
		Message: message,
		Data:    data,
		Success: true,
	})
}

// SuccessWithMessage 成功响应（无数据）
func SuccessWithMessage(c *gin.Context, message string) {
	c.JSON(StatusSuccess, Response{
		Code:    StatusSuccess,
		Message: message,
		Success: true,
	})
}

// BadRequest 请求参数错误
func BadRequest(c *gin.Context, message string) {
	c.JSON(StatusBadRequest, Response{
		Code:    StatusBadRequest,
		Message: message,
		Success: false,
	})
}

// Unauthorized 未授权
func Unauthorized(c *gin.Context, message string) {
	c.JSON(StatusUnauthorized, Response{
		Code:    StatusUnauthorized,
		Message: message,
		Success: false,
	})
}

// Forbidden 禁止访问
func Forbidden(c *gin.Context, message string) {
	c.JSON(StatusForbidden, Response{
		Code:    StatusForbidden,
		Message: message,
		Success: false,
	})
}

// NotFound 资源不存在
func NotFound(c *gin.Context, message string) {
	c.JSON(StatusNotFound, Response{
		Code:    StatusNotFound,
		Message: message,
		Success: false,
	})
}

// ServerError 服务器错误
func ServerError(c *gin.Context, message string) {
	c.JSON(StatusServerError, Response{
		Code:    StatusServerError,
		Message: message,
		Success: false,
	})
}

// Fail 失败响应
func Fail(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Message: message,
		Success: false,
	})
}

// PageResult 分页结果
type PageResult struct {
	Items      interface{} `json:"items"`      // 分页数据
	Total      int64       `json:"total"`      // 总记录数
	Page       int         `json:"page"`       // 当前页码
	Size       int         `json:"size"`       // 每页大小
	TotalPages int         `json:"totalPages"` // 总页数
}

// SuccessWithPage 返回分页数据
func SuccessWithPage(c *gin.Context, items interface{}, total int64, page, size int, totalPages int) {
	// 处理nil或者nil切片
	if items == nil {
		// 如果items为nil，返回空数组
		items = []interface{}{}
	} else {
		// 使用反射检查items
		v := reflect.ValueOf(items)

		// 如果是指针，获取它指向的值
		if v.Kind() == reflect.Ptr {
			if v.IsNil() {
				// nil指针，返回空数组
				items = []interface{}{}
			} else {
				v = v.Elem()
			}
		}

		// 检查是否为nil切片
		if v.Kind() == reflect.Slice && v.IsNil() {
			// nil切片，返回空数组
			items = []interface{}{}
		}
	}

	Success(c, PageResult{
		Items:      items,
		Total:      total,
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, "获取成功")
}
