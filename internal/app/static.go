package app

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
	"github.com/xiaojiu/cliplink/internal/static"
)

// SetupStaticRoutes 设置静态文件路由
func SetupStaticRoutes(router *gin.Engine) {
	webFS := static.GetWebFS()
	router.Use(StaticFileHandler(webFS))
}

// StaticFileHandler 处理静态文件的中间件
func StaticFileHandler(webFS fs.FS) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// API请求不处理 - 修复检查逻辑
		if strings.HasPrefix(path, "/api/") || path == "/api" {
			c.Next()
			return
		}

		// 去掉开头的斜杠
		filePath := path
		if path == "/" {
			filePath = "index.html"
		} else if path[0] == '/' {
			filePath = path[1:]
		}

		// 检查文件是否存在
		file, err := webFS.Open(filePath)
		if err != nil {
			// 如果是_next路径，可能是Next.js路由，尝试不同的解析
			if strings.HasPrefix(filePath, "_next/") {
				// 处理Next.js静态资源
				handleNextjsAsset(c, webFS, filePath)
				return
			}

			// 如果是主页面路由，返回index.html
			if !strings.Contains(filePath, ".") {
				serveFile(c, webFS, "index.html")
				return
			}

			c.Next()
			return
		}
		defer file.Close()

		// 设置Content-Type
		contentType := getContentType(filePath)
		if contentType != "" {
			c.Writer.Header().Set("Content-Type", contentType)
		}

		// 获取文件信息
		stat, err := file.Stat()
		if err != nil {
			c.Next()
			return
		}

		// 如果是目录，尝试index.html
		if stat.IsDir() {
			indexPath := filepath.Join(filePath, "index.html")
			if serveFile(c, webFS, indexPath) {
				return
			}
			c.Next()
			return
		}

		// 设置缓存控制
		setCacheHeaders(c, filePath)

		// 重置文件指针
		file, err = webFS.Open(filePath)
		if err != nil {
			c.Next()
			return
		}
		defer file.Close()

		// 提供文件内容
		http.ServeContent(c.Writer, c.Request, stat.Name(), stat.ModTime(), file.(io.ReadSeeker))
		c.Abort()
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

	// 获取文件信息
	stat, err := file.Stat()
	if err != nil {
		return false
	}

	if stat.IsDir() {
		return false
	}

	// 获取内容类型
	contentType := getContentType(path)
	if contentType != "" {
		c.Writer.Header().Set("Content-Type", contentType)
	}

	// 设置缓存控制
	setCacheHeaders(c, path)

	// 重新打开文件以确保文件指针在开始位置
	file, err = webFS.Open(path)
	if err != nil {
		return false
	}
	defer file.Close()

	// 使用ServeContent提供文件，自动处理Range请求和内容编码
	http.ServeContent(c.Writer, c.Request, stat.Name(), stat.ModTime(), file.(io.ReadSeeker))
	c.Abort()
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
