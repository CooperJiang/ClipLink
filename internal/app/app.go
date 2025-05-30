package app

import (
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xiaojiu/cliplink/internal/app/api/routes"
	"github.com/xiaojiu/cliplink/internal/app/usecase"
	"github.com/xiaojiu/cliplink/internal/config"
	"github.com/xiaojiu/cliplink/internal/infra/db"
	"github.com/xiaojiu/cliplink/internal/infra/persistence"
)

// BuildRouter 初始化所有依赖并返回 gin.Engine
func BuildRouter() (*gin.Engine, error) {
	return BuildRouterWithConfig(nil)
}

// BuildRouterWithConfig 使用指定配置初始化所有依赖并返回 gin.Engine
func BuildRouterWithConfig(cfg *config.Config) (*gin.Engine, error) {
	// 1. 加载配置
	if cfg == nil {
		var err error
		cfg, err = config.Load()
		if err != nil {
			return nil, fmt.Errorf("加载配置失败: %w", err)
		}
	}

	// 2. 初始化数据库
	if _, err := db.InitWithConfig(cfg); err != nil {
		// 如果配置的数据库初始化失败且当前是MySQL，无感切换到SQLite
		if cfg.GetDatabaseType() == "mysql" {
			// 创建SQLite配置
			sqliteConfig := &config.Config{
				Host: cfg.Host,
				Port: cfg.Port,
				// MySQL设为nil，自动使用SQLite
				MySQL: nil,
			}

			if _, fallbackErr := db.InitWithConfig(sqliteConfig); fallbackErr != nil {
				return nil, fmt.Errorf("数据库初始化失败: %w", fallbackErr)
			}
		} else {
			return nil, fmt.Errorf("数据库初始化失败: %w", err)
		}
	}

	// 3. 创建 gin 引擎
	router := gin.Default()

	// 4. 设置CORS（必须在注册路由前 use）
	corsConfig := cors.DefaultConfig()
	// 允许所有源访问，包括开发和生产环境
	// 注意：在生产环境中，根据安全需求可以配置具体的域名列表
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowCredentials = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"*"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	router.Use(cors.New(corsConfig))

	// 5. 创建仓库
	channelRepo := persistence.NewChannelRepository()
	clipboardRepo := persistence.NewClipboardRepository()
	deviceRepo := persistence.NewDeviceRepository()
	syncHistoryRepo := persistence.NewSyncHistoryRepository()

	// 6. 创建服务
	channelService := usecase.NewChannelService(channelRepo, clipboardRepo, deviceRepo)
	clipboardService := usecase.NewClipboardService(clipboardRepo, syncHistoryRepo)
	deviceService := usecase.NewDeviceService(deviceRepo)
	statsService := usecase.NewStatsService(deviceRepo, clipboardRepo, channelRepo, syncHistoryRepo)
	syncService := usecase.NewSyncService(syncHistoryRepo)

	// 7. 注册 API 路由
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
