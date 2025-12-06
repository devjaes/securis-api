-- init-db/01-init.sql

-- Wait for SQL Server to be ready
WAITFOR DELAY '00:00:03';
GO

USE master;
GO

-- ============================================
-- CREATE DATABASE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'DocumentManagementDB')
BEGIN
    CREATE DATABASE DocumentManagementDB;
    PRINT 'Database DocumentManagementDB created successfully';
END
ELSE
BEGIN
    PRINT 'Database DocumentManagementDB already exists';
END
GO

USE DocumentManagementDB;
GO

-- ============================================
-- CREATE LOGINS AND USERS
-- ============================================

-- ADMIN user (can see unmasked data)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'app_admin')
BEGIN
    CREATE LOGIN app_admin WITH PASSWORD = 'AdminSecure@2024!';
    PRINT 'Login app_admin created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_admin')
BEGIN
    CREATE USER app_admin FOR LOGIN app_admin;
    ALTER ROLE db_owner ADD MEMBER app_admin;
    PRINT 'User app_admin created with db_owner role';
END
GO

-- NORMAL user (will see masked data)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'app_user')
BEGIN
    CREATE LOGIN app_user WITH PASSWORD = 'UserSecure@2024!';
    PRINT 'Login app_user created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    CREATE USER app_user FOR LOGIN app_user;
    ALTER ROLE db_datareader ADD MEMBER app_user;
    ALTER ROLE db_datawriter ADD MEMBER app_user;
    PRINT 'User app_user created with read/write permissions';
END
GO

-- ============================================
-- CREATE TABLES (WITHOUT MASKING FIRST)
-- ============================================

-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT PRIMARY KEY IDENTITY(1,1),
        microsoft_id VARCHAR(255),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NULL, -- ⭐ NULLABLE
        qr_signature VARCHAR(500),
        password_hash VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table users created';
END
GO

-- Password reset tokens table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
BEGIN
    CREATE TABLE password_reset_tokens (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used BIT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_password_reset_tokens_user FOREIGN KEY (user_id) 
            REFERENCES users(id) ON DELETE CASCADE
    );
    PRINT 'Table password_reset_tokens created';
END
GO

-- Documents table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
BEGIN
    CREATE TABLE documents (
        id INT PRIMARY KEY IDENTITY(1,1),
        document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('OFICIO', 'MEMORANDO')),
        category VARCHAR(20) NOT NULL CHECK (category IN ('NORMAL', 'CIFRADO')),
        status VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' 
            CHECK (status IN ('BORRADOR', 'EN_ELABORACION', 'ENVIADO', 'NO_ENVIADO')),
        subject VARCHAR(255) NOT NULL,
        body NVARCHAR(MAX) NOT NULL,
        author_id INT NOT NULL,
        parent_document_id INT NULL,
        send_date DATETIME NULL,
        pdf_path VARCHAR(500) NULL,
        qr_signature NVARCHAR(MAX),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_documents_author FOREIGN KEY (author_id) REFERENCES users(id),
        CONSTRAINT FK_documents_parent FOREIGN KEY (parent_document_id) REFERENCES documents(id)
    );
    PRINT 'Table documents created';
END
GO

-- Document recipients table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'document_recipients')
BEGIN
    CREATE TABLE document_recipients (
        id INT PRIMARY KEY IDENTITY(1,1),
        document_id INT NOT NULL,
        recipient_id INT NOT NULL, -- ⭐ REMOVED sender_id
        is_read BIT DEFAULT 0,
        read_date DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_recipients_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_recipients_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
    );
    PRINT 'Table document_recipients created';
END
GO

-- Document attachments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'document_attachments')
BEGIN
    CREATE TABLE document_attachments (
        id INT PRIMARY KEY IDENTITY(1,1),
        document_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        -- ⭐ REMOVED file_size_bytes
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_attachments_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    PRINT 'Table document_attachments created';
END
GO

-- ============================================
-- ADD DATA MASKING TO ALL TABLES
-- ============================================

-- ⭐⭐⭐ USERS TABLE - 2 campos enmascarados ⭐⭐⭐

-- Mask microsoft_id (shows: abc****xyz)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('users') 
    AND name = 'microsoft_id'
)
BEGIN
    ALTER TABLE users
    ALTER COLUMN microsoft_id ADD MASKED WITH (FUNCTION = 'partial(3,"****",3)');
    PRINT 'Data masking added to users.microsoft_id';
END
GO

-- Mask email (shows: eXXX@XXXX.com)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('users') 
    AND name = 'email'
)
BEGIN
    ALTER TABLE users
    ALTER COLUMN email ADD MASKED WITH (FUNCTION = 'email()');
    PRINT 'Data masking added to users.email';
END
GO

-- ⭐⭐⭐ PASSWORD_RESET_TOKENS TABLE - 2 campos enmascarados ⭐⭐⭐

-- Mask user_id (shows: 0)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('password_reset_tokens') 
    AND name = 'user_id'
)
BEGIN
    ALTER TABLE password_reset_tokens
    ALTER COLUMN user_id ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to password_reset_tokens.user_id';
END
GO

-- Mask token (shows: XXXX)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('password_reset_tokens') 
    AND name = 'token'
)
BEGIN
    ALTER TABLE password_reset_tokens
    ALTER COLUMN token ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to password_reset_tokens.token';
END
GO

-- ⭐⭐⭐ DOCUMENTS TABLE - 2 campos enmascarados ⭐⭐⭐

-- Mask pdf_path (shows: XXXX)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('documents') 
    AND name = 'pdf_path'
)
BEGIN
    ALTER TABLE documents
    ALTER COLUMN pdf_path ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to documents.pdf_path';
END
GO

-- Mask qr_signature (shows: XXXX)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('documents') 
    AND name = 'qr_signature'
)
BEGIN
    ALTER TABLE documents
    ALTER COLUMN qr_signature ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to documents.qr_signature';
END
GO

-- ⭐⭐⭐ DOCUMENT_RECIPIENTS TABLE - 2 campos enmascarados ⭐⭐⭐

-- Mask document_id (shows: 0)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('document_recipients') 
    AND name = 'document_id'
)
BEGIN
    ALTER TABLE document_recipients
    ALTER COLUMN document_id ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to document_recipients.document_id';
END
GO

-- Mask recipient_id (shows: 0)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('document_recipients') 
    AND name = 'recipient_id'
)
BEGIN
    ALTER TABLE document_recipients
    ALTER COLUMN recipient_id ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to document_recipients.recipient_id';
END
GO

-- ⭐⭐⭐ DOCUMENT_ATTACHMENTS TABLE - 2 campos enmascarados ⭐⭐⭐

-- Mask file_name (shows: pre****eto.pdf)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('document_attachments') 
    AND name = 'file_name'
)
BEGIN
    ALTER TABLE document_attachments
    ALTER COLUMN file_name ADD MASKED WITH (FUNCTION = 'partial(3,"****",7)');
    PRINT 'Data masking added to document_attachments.file_name';
END
GO

-- Mask file_path (shows: XXXX)
IF NOT EXISTS (
    SELECT 1 FROM sys.masked_columns 
    WHERE object_id = OBJECT_ID('document_attachments') 
    AND name = 'file_path'
)
BEGIN
    ALTER TABLE document_attachments
    ALTER COLUMN file_path ADD MASKED WITH (FUNCTION = 'default()');
    PRINT 'Data masking added to document_attachments.file_path';
END
GO

-- ============================================
-- GRANT UNMASK PERMISSION TO ADMIN
-- ============================================
GRANT UNMASK TO app_admin;
PRINT 'UNMASK permission granted to app_admin';
GO

-- ============================================
-- CREATE TRIGGERS FOR updated_at
-- ============================================

IF OBJECT_ID('trg_users_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_users_updated_at;
GO

CREATE TRIGGER trg_users_updated_at
ON users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO
PRINT 'Trigger trg_users_updated_at created';
GO

IF OBJECT_ID('trg_documents_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_documents_updated_at;
GO

CREATE TRIGGER trg_documents_updated_at
ON documents
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE documents
    SET updated_at = GETDATE()
    FROM documents d
    INNER JOIN inserted i ON d.id = i.id;
END;
GO
PRINT 'Trigger trg_documents_updated_at created';
GO

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_microsoft_id' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE INDEX idx_users_microsoft_id ON users(microsoft_id);
    PRINT 'Index idx_users_microsoft_id created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE INDEX idx_users_email ON users(email);
    PRINT 'Index idx_users_email created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_reset_tokens_user_id' AND object_id = OBJECT_ID('password_reset_tokens'))
BEGIN
    CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    PRINT 'Index idx_password_reset_tokens_user_id created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_reset_tokens_token' AND object_id = OBJECT_ID('password_reset_tokens'))
BEGIN
    CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
    PRINT 'Index idx_password_reset_tokens_token created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_documents_author' AND object_id = OBJECT_ID('documents'))
BEGIN
    CREATE INDEX idx_documents_author ON documents(author_id);
    PRINT 'Index idx_documents_author created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_documents_status' AND object_id = OBJECT_ID('documents'))
BEGIN
    CREATE INDEX idx_documents_status ON documents(status);
    PRINT 'Index idx_documents_status created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_recipients_document' AND object_id = OBJECT_ID('document_recipients'))
BEGIN
    CREATE INDEX idx_recipients_document ON document_recipients(document_id);
    PRINT 'Index idx_recipients_document created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_recipients_recipient' AND object_id = OBJECT_ID('document_recipients'))
BEGIN
    CREATE INDEX idx_recipients_recipient ON document_recipients(recipient_id);
    PRINT 'Index idx_recipients_recipient created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_attachments_document' AND object_id = OBJECT_ID('document_attachments'))
BEGIN
    CREATE INDEX idx_attachments_document ON document_attachments(document_id);
    PRINT 'Index idx_attachments_document created';
END
GO

PRINT '============================================';
PRINT 'Database initialization completed successfully!';
PRINT 'All tables have at least 2 masked columns';
PRINT '============================================';
PRINT '';
PRINT 'Tables created (4 total):';
PRINT '  ✓ users';
PRINT '  ✓ password_reset_tokens';
PRINT '  ✓ documents';
PRINT '  ✓ document_recipients';
PRINT '  ✓ document_attachments';
PRINT '';
PRINT 'Final changes applied:';
PRINT '  ✓ users.name is now NULLABLE';
PRINT '  ✓ Removed sender_id from document_recipients';
PRINT '  ✓ Removed file_size_bytes from document_attachments';
GO