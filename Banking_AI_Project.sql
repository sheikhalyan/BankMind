CREATE DATABASE BankingAI_DB;
GO

USE BankingAI_DB;
GO

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('ADMIN', 'USER')) NOT NULL,
    is_approved BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

INSERT INTO Users (full_name, email, password_hash, role, is_approved)
VALUES
('Admin', 'admin@bankingai.com', '$2b$10$adminhashedpassword', 'ADMIN', 1),
('Ali Khan', 'ali.khan@gmail.com', '$2b$10$userhashedpassword1', 'USER', 1),
('Alyan', 'alyan@gmail.com', '$2b$10$userhashedpassword2', 'USER', 1),
('Usman Raza', 'usman.raza@gmail.com', '$2b$10$userhashedpassword3', 'USER', 0);

ALTER TABLE Users ADD phone VARCHAR(20) NULL;
ALTER TABLE Users ADD address NVARCHAR(500) NULL;


-- Add phone column if not exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'phone')
BEGIN
    ALTER TABLE Users ADD phone VARCHAR(20) NULL;
END

-- Add address column if not exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'address')
BEGIN
    ALTER TABLE Users ADD address NVARCHAR(500) NULL;
END



GO

CREATE TABLE OTP_Tokens (
    otp_id INT IDENTITY(1,1) PRIMARY KEY,
    entity_id INT NOT NULL,             -- user_id OR customer_id
    entity_type VARCHAR(20) NOT NULL,   -- 'USER' | 'CUSTOMER'
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);




INSERT INTO OTP_Tokens (user_id, otp_code, expires_at)
VALUES
(2, '123456', DATEADD(MINUTE, 10, GETDATE()));


GO

CREATE TABLE Customers(
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_name VARCHAR(100),
    email VARCHAR(150),
    [password] VARCHAR(255),
    user_id INT UNIQUE,
    phone VARCHAR(15),
    address VARCHAR(200),
    created_at DATETIME DEFAULT GETDATE(),
    approved_by_user INT NULL,
    is_user_approved BIT DEFAULT 0,
    is_admin_approved BIT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approved_by_user) REFERENCES Users(user_id)
);

--Customers Table was updated to add new attributes..



INSERT INTO Customers (user_id, phone, address)
VALUES
(2, '03011234567', 'Karachi, Pakistan'),
(3, '03121234567', 'Lahore, Pakistan'),
(4, '03211234567', 'Islamabad, Pakistan');


GO

CREATE TABLE Accounts (
    account_id INT IDENTITY(1001,1) PRIMARY KEY,
    customer_id INT,
    account_type VARCHAR(20) CHECK (account_type IN ('SAVINGS', 'CURRENT')),
    balance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(15) DEFAULT 'ACTIVE',
    opened_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

INSERT INTO Accounts (customer_id, account_type, balance)
VALUES
(1, 'SAVINGS', 150000),
(2, 'CURRENT', 250000),
(3, 'SAVINGS', 95000);


GO

CREATE TABLE Transactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    account_id INT,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAW', 'TRANSFER')),
    amount DECIMAL(10,2),
    transaction_time DATETIME DEFAULT GETDATE(),
    is_fraud BIT DEFAULT 0,
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id)
);

INSERT INTO Transactions (account_id, transaction_type, amount)
VALUES
(1001, 'DEPOSIT', 50000),
(1001, 'WITHDRAW', 15000),
(1002, 'WITHDRAW', 200000),  -- suspicious
(1003, 'DEPOSIT', 30000),
(1003, 'WITHDRAW', 5000);


GO

CREATE TABLE Fraud_Logs (
    fraud_id INT IDENTITY(1,1) PRIMARY KEY,
    transaction_id INT,
    fraud_score FLOAT,
    detected_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

INSERT INTO Fraud_Logs (transaction_id, fraud_score)
VALUES
(3, 0.92);   -- High fraud probability


GO
CREATE TABLE Loan_Policies (
    policy_id INT IDENTITY(1,1) PRIMARY KEY,
    loan_type VARCHAR(30),
    min_amount DECIMAL(12,2),
    max_amount DECIMAL(12,2),
    min_months INT,
    max_months INT,
    interest_rate FLOAT,
    created_at DATETIME DEFAULT GETDATE()
);

INSERT INTO Loan_Policies
(loan_type, min_amount, max_amount, min_months, max_months, interest_rate)
VALUES
('CAR', 500000, 3000000, 12, 60, 12.0),
('HOME', 2000000, 20000000, 60, 240, 9.0),
('PERSONAL', 100000, 1000000, 6, 36, 18.0),
('EDUCATION', 200000, 5000000, 12, 84, 7.5),
('MARRIAGE', 200000, 3000000, 12, 60, 11.0),
('MEDICAL', 100000, 2000000, 6, 48, 10.0);



CREATE TABLE Loans (
    loan_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    policy_id INT NOT NULL,
    loan_amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (policy_id) REFERENCES Loan_Policies(policy_id)
);




Go

CREATE TABLE AI_Chat_Logs (
    chat_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    user_query TEXT,
    ai_response TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);



CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    is_read BIT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

INSERT INTO AI_Chat_Logs (user_id, user_query, ai_response)
VALUES
(2, 'Why was my transaction blocked?', 
 'Your withdrawal was flagged due to unusually high amount compared to your history.');

Delete from Users where full_name = 'newadmin'


INSERT INTO Users (full_name, email, password_hash, role, is_approved)
VALUES ('newadmin', 'admin@bank.com', '$2b$10$jholLXq2hnrD2RF3t9tTlu2I2ZC6GlbbuDCZRuciD5scf0ddE157O', 'ADMIN', 1);





SELECT password_hash FROM Users WHERE Email='testuser@gmail.com';

SELECT user_id, full_name, email, role, is_approved
FROM Users
WHERE is_approved = 0


-- UNIQUE CONSTRAINT ON user_id in Customer Table has been dropped/removed
ALTER TABLE Customers
DROP CONSTRAINT UQ__Customer__B9BE370E026C37B5;


ALTER TABLE Accounts
ADD is_user_approved BIT DEFAULT 0,
    approved_by_user INT NULL;

ALTER TABLE Accounts
ADD CONSTRAINT FK_Accounts_ApprovedByUser
FOREIGN KEY (approved_by_user) REFERENCES Users(user_id);

ALTER TABLE Accounts
ADD CONSTRAINT DF_Accounts_Status DEFAULT 'INACTIVE' FOR status;

--UPDATED ACCOUNTS TABLE FOR DEFAULT STATUS TO 'INACTIVE'

SELECT name AS ConstraintName
FROM sys.default_constraints
WHERE parent_object_id = OBJECT_ID('Accounts')
  AND parent_column_id = (
      SELECT column_id
      FROM sys.columns
      WHERE object_id = OBJECT_ID('Accounts')
        AND name = 'status'
  );


  ALTER TABLE Accounts
DROP CONSTRAINT DF__Accounts__status__29221CFB;


ALTER TABLE Accounts
ADD CONSTRAINT DF_Accounts_Status DEFAULT 'INACTIVE' FOR status;



ALTER TABLE Accounts
ADD rejected_by_user INT NULL;

ALTER TABLE Accounts
ADD CONSTRAINT FK_Accounts_RejectedByUser
FOREIGN KEY (rejected_by_user) REFERENCES Users(user_id);

ALTER TABLE Transactions
ADD transaction_reason VARCHAR(20)
CHECK (transaction_reason IN ('DEPOSIT', 'WITHDRAW', 'TRANSFER'));

DROP TABLE IF EXISTS OTP_Tokens

ALTER TABLE Loans
ADD
  approved_by_user INT NULL,
  approved_at DATETIME NULL,
  rejection_reason VARCHAR(255) NULL;

ALTER TABLE Loans
ADD CONSTRAINT FK_Loans_ApprovedByUser
FOREIGN KEY (approved_by_user) REFERENCES Users(user_id);


Delete from Users where user_id = 23



-- Insert a test notification for admin (assuming admin has user_id = 1)
INSERT INTO Notifications (user_id, type, message, created_at, is_read)
VALUES (15, 'TEST', 'This is a test notification for admin', GETDATE(), 0);


SELECT * FROM Notifications

DELETE from Notifications


SELECT * FROM Users;
SELECT * FROM Customers;
SELECT * FROM Accounts;
SELECT * FROM Transactions;
SELECT * FROM Fraud_Logs;
SELECT * FROM Loans;
SELECT * FROM Loan_Policies;
SELECT * FROM AI_Chat_Logs;
SELECT * FROM OTP_Tokens;
SELECT * FROM Notifications;

ALTER TABLE Transactions ADD description NVARCHAR(500) NULL;

delete from Accounts where account_id in (1020)



SELECT account_id, customer_id, status, balance 
FROM Accounts 
WHERE account_id = 1010;


SELECT customer_id, customer_name FROM Customers WHERE customer_id = 11;


ALTER TABLE Customers
DROP COLUMN user_id;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications' AND COLUMN_NAME = 'related_id')
BEGIN
    ALTER TABLE Notifications ADD related_id INT NULL;
END




SELECT 
  customer_id, 
  customer_name, 
  is_user_approved, 
  is_admin_approved,
  approved_by_user
FROM Customers 
WHERE is_admin_approved = 1


SELECT * FROM Customers where approved_by_user = 18

Delete from Customers where customer_name = 'Unknown'


-- For Users table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'is_rejected')
BEGIN
    ALTER TABLE Users ADD is_rejected BIT DEFAULT 0;
END

Delete from Accounts where account_id = 1001



SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' 
ORDER BY COLUMN_NAME;

-- Check if columns exist in Customers table
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Customers' 
AND COLUMN_NAME IN ('is_rejected', 'rejected_at');






--User
--alyantest@bank.com
--1230


--ADMIN
--admin@bank.com
--admin123


--Cutomer
--customerA@test.com
--123

--customerB@test.com
--1230

--customerC@test.com
--123456


















