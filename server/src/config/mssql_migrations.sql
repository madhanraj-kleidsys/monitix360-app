-- Migration script for MSSQL

-- 1. Add column to Tasks table
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'is_admin_added_task'
)
BEGIN
  ALTER TABLE tasks ADD is_admin_added_task BIT DEFAULT 0;
END;
GO

-- 2. Create holiday_overrides table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='holiday_overrides' AND xtype='U')
BEGIN
    CREATE TABLE holiday_overrides (
        id INT IDENTITY(1,1) PRIMARY KEY,
        date DATE NOT NULL,
        company_id INT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    );
END;
GO

-- 3. Create isadmin_page_rights table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='isadmin_page_rights' AND xtype='U')
BEGIN
    CREATE TABLE isadmin_page_rights (
        id INT IDENTITY(1,1) PRIMARY KEY,
        isadmin_user_id INT NOT NULL,
        page_key VARCHAR(100) NOT NULL,
        is_enabled BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        updated_at DATETIME2 DEFAULT SYSDATETIME(),
        FOREIGN KEY (isadmin_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_isadmin_page_rights_user_page UNIQUE (isadmin_user_id, page_key)
    );
END;
GO
