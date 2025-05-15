package moderncsqlite

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/migrator"
)

// Migrator SQLite迁移器
type Migrator struct {
	migrator.Migrator
}

// HasTable 检查表是否存在
func (m Migrator) HasTable(value interface{}) bool {
	var count int
	tableName := m.Migrator.DB.NamingStrategy.TableName(value)
	m.Migrator.DB.Raw("SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?", tableName).Scan(&count)
	return count > 0
}

// DropTable 删除表
func (m Migrator) DropTable(values ...interface{}) error {
	values = m.ReorderModels(values, false)
	tx := m.Migrator.DB.Session(&gorm.Session{})

	for i := len(values) - 1; i >= 0; i-- {
		if err := m.RunWithValue(values[i], func(stmt *gorm.Statement) error {
			return tx.Exec("DROP TABLE IF EXISTS ?", clause.Table{Name: stmt.Table}).Error
		}); err != nil {
			return err
		}
	}

	return nil
}

// HasColumn 检查列是否存在
func (m Migrator) HasColumn(value interface{}, name string) bool {
	var count int
	tableName := m.Migrator.DB.NamingStrategy.TableName(value)
	columnName := name
	if field := m.Migrator.DB.Config.NamingStrategy.ColumnName("", name); field != "" {
		columnName = field
	}

	m.Migrator.DB.Raw(
		"SELECT count(*) FROM pragma_table_info(?) WHERE name=?",
		tableName, columnName,
	).Scan(&count)

	return count > 0
}

// AlterColumn 修改列
func (m Migrator) AlterColumn(value interface{}, name string) error {
	return m.RunWithValue(value, func(stmt *gorm.Statement) error {
		// SQLite不支持ALTER COLUMN，需要创建新表并复制数据
		return nil
	})
}

// ReorderModels 重新排序模型以处理依赖关系
func (m Migrator) ReorderModels(values []interface{}, sortHasOneAndHasMany bool) []interface{} {
	return migrator.ReorderModels(values, m.Migrator.DB)
}

// RunWithValue 运行带有值的函数
func (m Migrator) RunWithValue(value interface{}, fc func(*gorm.Statement) error) error {
	stmt := &gorm.Statement{DB: m.Migrator.DB}
	if err := stmt.Parse(value); err != nil {
		return err
	}
	return fc(stmt)
}
