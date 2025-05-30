# 数据库配置指南

ClipLink 现在支持多种数据库类型，包括 SQLite、MySQL。您可以通过配置文件来指定使用哪种数据库。

## 配置文件位置

默认配置文件路径：`./config.yml`（与 cliplink 二进制文件在同一目录）

您也可以通过命令行参数指定配置文件：
```bash
./cliplink --config /path/to/your/config.yml
```

## 支持的数据库类型

### 1. SQLite (默认)

SQLite 是默认的数据库选择，适合单机部署和小规模使用。**无需任何配置即可运行**。

**配置示例：**
```yaml
# 空配置文件或不存在配置文件时，自动使用 SQLite
# host: "0.0.0.0"
# port: 8080
```

**特点：**
- 无需额外的数据库服务器
- 适合单机部署
- 数据存储在 `~/.cliplink/cliplink.db`
- 0配置启动

### 2. MySQL

MySQL 适合生产环境和多实例部署。只有配置了完整的 MySQL 信息才会使用 MySQL，否则自动使用 SQLite。

**配置示例：**
```yaml
host: "0.0.0.0"
port: 8080
mysql:
  host: "localhost"
  port: 3306
  username: "cliplink"
  password: "your_password"
  database: "cliplink"
  charset: "utf8mb4"
```

**准备工作：**
1. 安装 MySQL 服务器
2. 创建数据库：
   ```sql
   CREATE DATABASE cliplink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. 创建用户并授权：
   ```sql
   CREATE USER 'cliplink'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON cliplink.* TO 'cliplink'@'localhost';
   FLUSH PRIVILEGES;
   ```

## 配置参数说明

### 通用参数
- `host`: 应用服务器监听地址（默认: "0.0.0.0"）
- `port`: 应用服务器监听端口（默认: 8080）

### MySQL 参数
- `host`: 数据库服务器地址
- `port`: 数据库服务器端口（默认: 3306）
- `username`: 数据库用户名
- `password`: 数据库密码
- `database`: 数据库名称
- `charset`: 字符集（默认: "utf8mb4"）

## 使用方法

### 零配置启动（推荐）
1. **直接启动（使用 SQLite）**
   ```bash
   ./cliplink
   ```
   应用会自动使用 SQLite 数据库，无需任何配置。

### 使用 MySQL
1. **创建配置文件**
   在二进制文件同一目录下创建 `config.yml`：
   ```bash
   cp config.yml.example config.yml
   ```

2. **修改配置**
   编辑 `config.yml`，添加 MySQL 配置：
   ```yaml
   mysql:
     host: "localhost"
     port: 3306
     username: "cliplink"
     password: "your_password"
     database: "cliplink"
   ```

3. **启动应用**
   ```bash
   ./cliplink
   ```

## 无感降级机制

如果配置了 MySQL 但连接失败（如 MySQL 服务未启动、密码错误等），应用会**自动无感降级到 SQLite**，不会显示任何警告信息，确保应用能正常启动。

## 数据库迁移

应用会自动执行数据库表迁移，无需手动创建表结构。首次启动时，会自动创建所需的表。

## 部署建议

### 开发环境
- 直接使用默认 SQLite，无需配置
- 数据存储在 `~/.cliplink/cliplink.db`

### 生产环境
- 推荐使用 MySQL
- 配置文件和二进制文件放在同一目录
- 目录结构：
  ```
  /opt/cliplink/
  ├── cliplink        # 二进制文件
  ├── config.yml      # 配置文件
  └── static/         # 静态资源（如果有）
  ```

## 故障排除

### 常见错误

1. **MySQL 连接被拒绝**
   - 应用会自动降级到 SQLite，无需人工干预
   - 检查 MySQL 服务是否启动
   - 确认用户名、密码是否正确

2. **配置文件语法错误**
   - 检查 YAML 语法是否正确
   - 确保缩进使用空格而不是制表符

3. **权限问题**
   - 确保应用对配置文件有读权限
   - 确保应用对数据库目录有写权限

## 性能建议

- **SQLite**: 适合 < 1000 次/天 的使用频率
- **MySQL**: 适合中等规模部署，支持多实例

## 备份建议

- **SQLite**: 直接备份 `~/.cliplink/cliplink.db` 文件
- **MySQL**: 使用 `mysqldump` 工具定期备份 