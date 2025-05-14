package middleware

import (
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// StaticFileHandler 处理静态文件的中间件
func StaticFileHandler(webFS fs.FS) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// 去掉开头的斜杠
		if path == "/" {
			path = "index.html"
		} else if path[0] == '/' {
			path = path[1:]
		}

		// 检查文件是否存在
		file, err := webFS.Open(path)
		if err != nil {
			// 如果是_next路径，可能是Next.js路由，尝试不同的解析
			if strings.HasPrefix(path, "_next/") {
				// 处理Next.js静态资源
				handleNextjsAsset(c, webFS, path)
				return
			}

			// 如果是主页面路由，返回index.html
			if !strings.Contains(path, ".") {
				serveFile(c, webFS, "index.html")
				return
			}

			c.Next()
			return
		}
		defer file.Close()

		// 设置Content-Type
		contentType := getContentType(path)
		if contentType != "" {
			c.Writer.Header().Set("Content-Type", contentType)
		}

		// 获取文件内容
		content, err := io.ReadAll(file)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}

		// 设置缓存控制
		setCacheHeaders(c, path)

		// 返回文件内容
		c.Data(http.StatusOK, contentType, content)
	}
}

// handleNextjsAsset 处理Next.js的静态资源
func handleNextjsAsset(c *gin.Context, webFS fs.FS, path string) {
	// 从路径中提取文件名和类型
	parts := strings.Split(path, "/")
	if len(parts) < 3 {
		c.Status(http.StatusNotFound)
		return
	}

	// 尝试可能的路径变体
	possiblePaths := []string{path}

	// 对于static目录的特殊处理
	if len(parts) > 3 && parts[1] == "static" {
		// 例如: _next/static/css/file.css
		// 尝试: _next/static/css/file.css, static/css/file.css, css/file.css
		possiblePaths = append(possiblePaths,
			strings.Join(parts[1:], "/"),
			strings.Join(parts[2:], "/"))
	}

	// Next.js的特殊处理 - 检查_next目录是否直接存在
	nextDirExists := false
	entries, err := fs.ReadDir(webFS, ".")
	if err == nil {
		for _, entry := range entries {
			if entry.IsDir() && entry.Name() == "_next" {
				nextDirExists = true
				break
			}
		}
	}

	// 如果_next目录存在，优先尝试完整路径
	if nextDirExists {
		if serveFile(c, webFS, path) {
			return
		}
	}

	// 尝试所有可能的路径
	for _, tryPath := range possiblePaths {
		if serveFile(c, webFS, tryPath) {
			return
		}
	}

	c.Status(http.StatusNotFound)
}

// serveFile 尝试提供文件，成功返回true
func serveFile(c *gin.Context, webFS fs.FS, path string) bool {
	file, err := webFS.Open(path)
	if err != nil {
		return false
	}
	defer file.Close()

	// 获取内容类型
	contentType := getContentType(path)

	// 读取文件内容
	content, err := io.ReadAll(file)
	if err != nil {
		return false
	}

	// 设置响应头
	if contentType != "" {
		c.Writer.Header().Set("Content-Type", contentType)
	}

	// 设置缓存控制
	setCacheHeaders(c, path)

	// 返回文件内容
	c.Data(http.StatusOK, contentType, content)
	return true
}

// getContentType 根据文件扩展名返回内容类型
func getContentType(path string) string {
	ext := strings.ToLower(filepath.Ext(path))

	// 对常见文件类型进行特殊处理
	switch ext {
	case ".html", ".htm":
		return "text/html; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".js":
		return "application/javascript; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".svg":
		return "image/svg+xml"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".ico":
		return "image/x-icon"
	case ".woff":
		return "font/woff"
	case ".woff2":
		return "font/woff2"
	case ".ttf":
		return "font/ttf"
	default:
		// 使用标准库的mime包进行类型猜测
		contentType := mime.TypeByExtension(ext)
		if contentType != "" {
			return contentType
		}
		return "application/octet-stream"
	}
}

// setCacheHeaders 设置适当的缓存头
func setCacheHeaders(c *gin.Context, path string) {
	ext := strings.ToLower(filepath.Ext(path))

	// 对静态资源使用更长的缓存时间
	if ext == ".css" || ext == ".js" || ext == ".woff" || ext == ".woff2" ||
		ext == ".ttf" || ext == ".png" || ext == ".jpg" || ext == ".jpeg" ||
		ext == ".gif" || ext == ".svg" {
		// 30天缓存
		maxAge := 30 * 24 * 60 * 60
		c.Writer.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", maxAge))
		c.Writer.Header().Set("Expires", time.Now().Add(time.Duration(maxAge)*time.Second).Format(time.RFC1123))
	} else {
		// HTML文件等使用较短的缓存时间或不缓存
		c.Writer.Header().Set("Cache-Control", "no-cache, must-revalidate")
		c.Writer.Header().Set("Pragma", "no-cache")
	}
}
