package moderncsqlite

import (
	"database/sql"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/migrator"
	"gorm.io/gorm/schema"
	_ "modernc.org/sqlite" // 导入modernc.org/sqlite驱动
)

// Dialector SQLite方言实现
type Dialector struct {
	DriverName string
	DSN        string
	Conn       gorm.ConnPool
}

// Name 返回方言名称
func (dialector Dialector) Name() string {
	return "sqlite"
}

// Initialize 初始化连接
func (dialector Dialector) Initialize(db *gorm.DB) (err error) {
	if dialector.DriverName == "" {
		dialector.DriverName = "sqlite"
	}

	if dialector.Conn != nil {
		db.ConnPool = dialector.Conn
	} else {
		db.ConnPool, err = sql.Open(dialector.DriverName, dialector.DSN)
		if err != nil {
			return err
		}
	}

	// 设置callback
	callback := &callbacks{
		DSN: dialector.DSN,
	}

	db.Callback().Create().Before("gorm:create").Register("sqlite:create_auto_increment", callback.CreateBefore)

	for k, v := range dialector.ClauseBuilders() {
		db.ClauseBuilders[k] = v
	}

	return
}

// ClauseBuilders 返回子句构建器
func (dialector Dialector) ClauseBuilders() map[string]clause.ClauseBuilder {
	return map[string]clause.ClauseBuilder{
		"LIMIT": func(c clause.Clause, builder clause.Builder) {
			if limit, ok := c.Expression.(clause.Limit); ok {
				if limit.Limit != nil && *limit.Limit > 0 {
					builder.WriteString(fmt.Sprintf(" LIMIT %d", *limit.Limit))
				}
				if limit.Offset != nil && *limit.Offset > 0 {
					builder.WriteString(fmt.Sprintf(" OFFSET %d", *limit.Offset))
				}
			}
		},
	}
}

// DefaultValueOf 返回默认值
func (dialector Dialector) DefaultValueOf(field *schema.Field) clause.Expression {
	return clause.Expr{SQL: "NULL"}
}

// Migrator 返回迁移器
func (dialector Dialector) Migrator(db *gorm.DB) gorm.Migrator {
	return &Migrator{migrator.Migrator{Config: migrator.Config{
		DB:                          db,
		Dialector:                   dialector,
		CreateIndexAfterCreateTable: true,
	}}}
}

// DataTypeOf 返回字段的SQL数据类型
func (dialector Dialector) DataTypeOf(field *schema.Field) string {
	switch field.DataType {
	case schema.Bool:
		return "boolean"
	case schema.Int, schema.Uint:
		if field.AutoIncrement {
			return "integer PRIMARY KEY AUTOINCREMENT"
		}
		return "integer"
	case schema.Float:
		return "real"
	case schema.String:
		return "text"
	case schema.Time:
		return "datetime"
	case schema.Bytes:
		return "blob"
	}

	return string(field.DataType)
}

// BindVarTo 绑定变量
func (dialector Dialector) BindVarTo(writer clause.Writer, stmt *gorm.Statement, v interface{}) {
	writer.WriteByte('?')
}

// QuoteTo 引用标识符
func (dialector Dialector) QuoteTo(writer clause.Writer, str string) {
	writer.WriteByte('`')
	writer.WriteString(str)
	writer.WriteByte('`')
}

// Explain 解释SQL
func (dialector Dialector) Explain(sql string, vars ...interface{}) string {
	return fmt.Sprintf("%s, %v", sql, vars)
}

// Open 打开数据库连接
func Open(dsn string) gorm.Dialector {
	return &Dialector{DSN: dsn}
}

type callbacks struct {
	DSN string
}

func (c *callbacks) CreateBefore(db *gorm.DB) {
	// 对于自增主键，确保gorm不会在SQL中包含主键
	if db.Statement.Schema != nil && db.Statement.Schema.PrioritizedPrimaryField != nil && db.Statement.Schema.PrioritizedPrimaryField.AutoIncrement {
		db.Statement.Omit(db.Statement.Schema.PrioritizedPrimaryField.DBName)
	}
}
