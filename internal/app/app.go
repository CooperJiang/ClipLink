package app

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/app/api/routes"
	"github.com/xiaojiu/cliplink/internal/app/usecase"
	"github.com/xiaojiu/cliplink/internal/infra/db"
	"github.com/xiaojiu/cliplink/internal/infra/persistence"
)

// BuildRouter 初始化所有依赖并返回 gin.Engine
func BuildRouter() (*gin.Engine, error) {
	// 1. 自动创建数据库目录和文件 - 使用更健壮的路径选择
	var dbPath string

	// 尝试多个可能的数据库路径
	possiblePaths := []string{}

	// 首先尝试用户家目录
	if homeDir, err := os.UserHomeDir(); err == nil {
		appDir := filepath.Join(homeDir, ".cliplink")
		possiblePaths = append(possiblePaths, filepath.Join(appDir, "cliplink.db"))
	}

	// 添加当前工作目录作为备用选项
	if cwd, err := os.Getwd(); err == nil {
		possiblePaths = append(possiblePaths, filepath.Join(cwd, "cliplink.db"))
	}

	// 添加临时目录作为最后的选择
	possiblePaths = append(possiblePaths, filepath.Join(os.TempDir(), "cliplink", "cliplink.db"))

	// 尝试每个路径
	var dbInitErr error
	for _, path := range possiblePaths {
		dir := filepath.Dir(path)

		// 尝试创建目录
		if err := os.MkdirAll(dir, 0755); err != nil {
			dbInitErr = err
			continue
		}

		// 尝试初始化数据库
		if _, err := db.Init(path); err != nil {
			dbInitErr = err
			// 如果初始化失败，尝试删除可能损坏的文件
			os.Remove(path)
			continue
		}

		// 成功初始化
		dbPath = path
		break
	}

	if dbPath == "" {
		return nil, fmt.Errorf("无法初始化数据库，尝试的路径都失败了。最后一个错误: %v", dbInitErr)
	}

	// 2. 创建 gin 引擎
	router := gin.Default()

	// 3. 设置CORS（必须在注册路由前 use）
	corsConfig := cors.DefaultConfig()
	// 允许所有源访问，包括开发和生产环境
	// 注意：在生产环境中，根据安全需求可以配置具体的域名列表
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowCredentials = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"*"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	router.Use(cors.New(corsConfig))

	// 4. 创建仓库
	channelRepo := persistence.NewChannelRepository()
	clipboardRepo := persistence.NewClipboardRepository()
	deviceRepo := persistence.NewDeviceRepository()
	syncHistoryRepo := persistence.NewSyncHistoryRepository()

	// 5. 创建服务
	channelService := usecase.NewChannelService(channelRepo, clipboardRepo, deviceRepo)
	clipboardService := usecase.NewClipboardService(clipboardRepo, syncHistoryRepo)
	deviceService := usecase.NewDeviceService(deviceRepo)
	statsService := usecase.NewStatsService(deviceRepo, clipboardRepo, channelRepo, syncHistoryRepo)
	syncService := usecase.NewSyncService(syncHistoryRepo)

	// 6. 注册 API 路由
	routes.SetupRouter(
		router,
		channelService,
		clipboardService,
		deviceService,
		statsService,
		syncService,
	)

	return router, nil
}
