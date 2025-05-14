package static

import (
	"embed"
	"io/fs"
	"os"
	"path/filepath"
)

//go:embed all:dist
var StaticFS embed.FS

// GetWebFS 返回嵌入的静态文件系统
func GetWebFS() fs.FS {
	// 首先尝试从嵌入的文件系统获取dist子目录
	webFS, err := fs.Sub(StaticFS, "dist")
	if err != nil {
		// 开发模式下尝试从本地文件系统加载

		// 获取当前工作目录
		workDir, err := os.Getwd()
		if err != nil {
			return StaticFS
		}

		// 尝试在当前包目录的dist目录寻找
		staticDir := filepath.Dir(workDir)
		staticDistPath := filepath.Join(staticDir, "internal", "static", "dist")
		if _, err := os.Stat(staticDistPath); err == nil {
			return os.DirFS(staticDistPath)
		}

		// 尝试在web/dist目录找静态文件
		webDistPath := filepath.Join(workDir, "web", "dist")
		if _, err := os.Stat(webDistPath); err == nil {
			return os.DirFS(webDistPath)
		}

		return StaticFS
	}

	return webFS
}
