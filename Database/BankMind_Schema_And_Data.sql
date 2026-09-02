USE [BankingAI_DB]
GO
/****** Object:  Table [dbo].[Account_Approvals]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Account_Approvals](
	[approval_id] [int] IDENTITY(1,1) NOT NULL,
	[account_id] [int] NOT NULL,
	[approver_id] [int] NOT NULL,
	[approver_role] [nvarchar](10) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[remarks] [nvarchar](500) NULL,
	[actioned_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[approval_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Accounts]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Accounts](
	[account_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_id] [int] NOT NULL,
	[account_number] [nvarchar](20) NOT NULL,
	[account_type] [nvarchar](10) NOT NULL,
	[balance] [decimal](15, 2) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[opened_date] [datetime] NOT NULL,
	[closed_date] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AI_Chat_Messages]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AI_Chat_Messages](
	[message_id] [int] IDENTITY(1,1) NOT NULL,
	[session_id] [int] NOT NULL,
	[role] [nvarchar](10) NOT NULL,
	[content] [nvarchar](max) NOT NULL,
	[context_used] [nvarchar](max) NULL,
	[tokens_used] [int] NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[message_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AI_Chat_Sessions]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AI_Chat_Sessions](
	[session_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_id] [int] NOT NULL,
	[title] [nvarchar](255) NULL,
	[started_at] [datetime] NOT NULL,
	[last_message_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customer_Approvals]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customer_Approvals](
	[approval_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_id] [int] NOT NULL,
	[approver_id] [int] NOT NULL,
	[approver_role] [nvarchar](10) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[remarks] [nvarchar](500) NULL,
	[actioned_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[approval_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customer_Auth]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customer_Auth](
	[auth_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_id] [int] NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[last_login] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[auth_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customers]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customers](
	[customer_id] [int] IDENTITY(1,1) NOT NULL,
	[full_name] [nvarchar](100) NOT NULL,
	[email] [nvarchar](150) NOT NULL,
	[phone] [nvarchar](20) NOT NULL,
	[address] [nvarchar](255) NULL,
	[city] [nvarchar](100) NULL,
	[country] [nvarchar](100) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[assigned_staff_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Fraud_Logs]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Fraud_Logs](
	[fraud_id] [int] IDENTITY(1,1) NOT NULL,
	[transaction_id] [int] NOT NULL,
	[fraud_score] [decimal](5, 2) NOT NULL,
	[fraud_type] [nvarchar](100) NULL,
	[action_taken] [nvarchar](20) NOT NULL,
	[reviewed_by] [int] NULL,
	[resolved_at] [datetime] NULL,
	[detected_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[fraud_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Loan_Approvals]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Loan_Approvals](
	[approval_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_id] [int] NOT NULL,
	[approver_id] [int] NOT NULL,
	[approver_role] [nvarchar](10) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[remarks] [nvarchar](500) NULL,
	[actioned_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[approval_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Loan_Auto_Deductions]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Loan_Auto_Deductions](
	[deduction_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_id] [int] NOT NULL,
	[repayment_id] [int] NOT NULL,
	[from_account_id] [int] NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[attempted_at] [datetime] NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[failure_reason] [nvarchar](255) NULL,
	[transaction_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[deduction_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Loan_Policies]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Loan_Policies](
	[policy_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_type] [nvarchar](100) NOT NULL,
	[min_amount] [decimal](15, 2) NOT NULL,
	[max_amount] [decimal](15, 2) NOT NULL,
	[min_months] [int] NOT NULL,
	[max_months] [int] NOT NULL,
	[interest_rate] [decimal](5, 2) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[policy_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Loan_Repayments]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Loan_Repayments](
	[repayment_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_id] [int] NOT NULL,
	[installment_no] [int] NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[due_date] [date] NOT NULL,
	[paid_date] [date] NULL,
	[status] [nvarchar](10) NOT NULL,
	[transaction_id] [int] NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[repayment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Loans]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Loans](
	[loan_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_id] [int] NOT NULL,
	[account_id] [int] NOT NULL,
	[policy_id] [int] NOT NULL,
	[loan_amount] [decimal](15, 2) NOT NULL,
	[approved_amount] [decimal](15, 2) NULL,
	[disbursed_amount] [decimal](15, 2) NULL,
	[disbursed_at] [datetime] NULL,
	[disbursed_by] [int] NULL,
	[duration_months] [int] NOT NULL,
	[start_date] [date] NULL,
	[end_date] [date] NULL,
	[status] [nvarchar](20) NOT NULL,
	[auto_deduct] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[loan_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notifications]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notifications](
	[notification_id] [int] IDENTITY(1,1) NOT NULL,
	[recipient_id] [int] NOT NULL,
	[recipient_type] [nvarchar](20) NOT NULL,
	[type] [nvarchar](100) NOT NULL,
	[message] [nvarchar](max) NOT NULL,
	[related_id] [int] NULL,
	[related_type] [nvarchar](50) NULL,
	[is_read] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[notification_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OTP_Tokens]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OTP_Tokens](
	[otp_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_id] [int] NOT NULL,
	[entity_type] [nvarchar](20) NOT NULL,
	[otp_code] [nvarchar](10) NOT NULL,
	[purpose] [nvarchar](30) NOT NULL,
	[expires_at] [datetime] NOT NULL,
	[is_used] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[otp_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Support_Tickets]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Support_Tickets](
	[ticket_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_id] [int] NOT NULL,
	[assigned_to] [int] NULL,
	[subject] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[category] [nvarchar](20) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[priority] [nvarchar](10) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[resolved_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[ticket_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Ticket_Replies]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Ticket_Replies](
	[reply_id] [int] IDENTITY(1,1) NOT NULL,
	[ticket_id] [int] NOT NULL,
	[sender_id] [int] NOT NULL,
	[sender_type] [nvarchar](20) NOT NULL,
	[message] [nvarchar](max) NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[reply_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Transactions]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Transactions](
	[transaction_id] [int] IDENTITY(1,1) NOT NULL,
	[from_account_id] [int] NULL,
	[to_account_id] [int] NULL,
	[transaction_type] [nvarchar](20) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[description] [nvarchar](500) NULL,
	[is_fraud] [bit] NOT NULL,
	[transaction_time] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[transaction_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 02/09/2026 12:55:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[full_name] [nvarchar](100) NOT NULL,
	[email] [nvarchar](150) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[role] [nvarchar](10) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[last_login] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Account_Approvals] ON 
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (1, 3, 3, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-14T09:20:56.640' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (2, 1, 3, N'STAFF', N'REJECTED', N'NO JOB', CAST(N'2026-05-14T09:21:05.510' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (3, 4, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-15T14:24:02.400' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (4, 5, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-31T15:28:20.477' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (5, 6, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-06-09T21:25:38.203' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (7, 6, 1, N'ADMIN', N'ACTIVE', N'Account unfrozen by admin.', CAST(N'2026-07-10T11:55:48.683' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (8, 6, 1, N'ADMIN', N'FROZEN', N'test
', CAST(N'2026-07-10T11:55:54.517' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (9, 6, 1, N'ADMIN', N'ACTIVE', N'Account unfrozen by admin.', CAST(N'2026-07-10T11:56:05.460' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (10, 4, 1, N'ADMIN', N'CLOSED', N'Account closure approved and processed.', CAST(N'2026-07-17T15:59:03.837' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (11, 5, 1, N'ADMIN', N'FROZEN', N'do number ka paisa', CAST(N'2026-07-22T10:38:47.717' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (12, 5, 1, N'ADMIN', N'ACTIVE', N'Account unfrozen by admin.', CAST(N'2026-07-22T11:02:11.107' AS DateTime))
GO
INSERT [dbo].[Account_Approvals] ([approval_id], [account_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (13, 5, 1, N'ADMIN', N'ACTIVE', N'Account unfrozen by admin.', CAST(N'2026-07-27T14:26:38.880' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Account_Approvals] OFF
GO
SET IDENTITY_INSERT [dbo].[Accounts] ON 
GO
INSERT [dbo].[Accounts] ([account_id], [customer_id], [account_number], [account_type], [balance], [status], [opened_date], [closed_date]) VALUES (1, 3, N'BM873194182882', N'SAVINGS', CAST(0.00 AS Decimal(15, 2)), N'REJECTED', CAST(N'2026-05-14T09:12:22.120' AS DateTime), NULL)
GO
INSERT [dbo].[Accounts] ([account_id], [customer_id], [account_number], [account_type], [balance], [status], [opened_date], [closed_date]) VALUES (3, 3, N'BM873211507415', N'CURRENT', CAST(14800.00 AS Decimal(15, 2)), N'ACTIVE', CAST(N'2026-05-14T09:15:15.080' AS DateTime), NULL)
GO
INSERT [dbo].[Accounts] ([account_id], [customer_id], [account_number], [account_type], [balance], [status], [opened_date], [closed_date]) VALUES (4, 2, N'BM883702484541', N'SAVINGS', CAST(0.00 AS Decimal(15, 2)), N'CLOSED', CAST(N'2026-05-15T14:23:44.857' AS DateTime), CAST(N'2026-07-17T10:59:03.830' AS DateTime))
GO
INSERT [dbo].[Accounts] ([account_id], [customer_id], [account_number], [account_type], [balance], [status], [opened_date], [closed_date]) VALUES (5, 2, N'BM022325146261', N'CURRENT', CAST(4208700.01 AS Decimal(15, 2)), N'ACTIVE', CAST(N'2026-05-31T15:27:31.467' AS DateTime), NULL)
GO
INSERT [dbo].[Accounts] ([account_id], [customer_id], [account_number], [account_type], [balance], [status], [opened_date], [closed_date]) VALUES (6, 1, N'BM102227970826', N'SAVINGS', CAST(180000.00 AS Decimal(15, 2)), N'ACTIVE', CAST(N'2026-06-09T21:24:39.713' AS DateTime), NULL)
GO
SET IDENTITY_INSERT [dbo].[Accounts] OFF
GO
SET IDENTITY_INSERT [dbo].[AI_Chat_Messages] ON 
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (1, 1, N'user', N'What''s my account balance?', NULL, NULL, CAST(N'2026-07-31T12:26:16.387' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (2, 1, N'assistant', N'Sorry, I''m having trouble responding right now — please try again in a moment.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', NULL, CAST(N'2026-07-31T12:26:19.540' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (3, 2, N'user', N'What''s my account balance?', NULL, NULL, CAST(N'2026-07-31T12:26:27.017' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (4, 2, N'assistant', N'Sorry, I''m having trouble responding right now — please try again in a moment.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', NULL, CAST(N'2026-07-31T12:26:27.037' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (5, 3, N'user', N'What''s my account balance?', NULL, NULL, CAST(N'2026-07-31T12:27:46.833' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (6, 3, N'assistant', N'Sorry, I''m having trouble responding right now — please try again in a moment.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', NULL, CAST(N'2026-07-31T12:27:49.057' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (7, 4, N'user', N'What''s my account balance?', NULL, NULL, CAST(N'2026-07-31T12:28:50.843' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (8, 4, N'assistant', N'Sorry, I''m having trouble responding right now — please try again in a moment.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', NULL, CAST(N'2026-07-31T12:28:52.253' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (9, 5, N'user', N'What''s my account balance?', NULL, NULL, CAST(N'2026-08-02T15:49:02.110' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (10, 5, N'assistant', N'Sorry, I''m having trouble responding right now — please try again in a moment.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', NULL, CAST(N'2026-08-02T15:49:03.410' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (11, 6, N'user', N'What''s my account balance?', NULL, NULL, CAST(N'2026-08-02T15:52:20.793' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (12, 6, N'assistant', N'You have two accounts:
- **Current Account** (BM022325146261): Active, with a balance of 4,208,700.01.
- **Savings Account** (BM883702484541): Closed, with a balance of 0.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1533, CAST(N'2026-08-02T15:52:22.700' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (13, 7, N'user', N'whats my account balance?', NULL, NULL, CAST(N'2026-08-02T16:05:03.830' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (14, 7, N'assistant', N'You have one active current account (BM022325146261) with a balance of 4,208,700.01, and one closed savings account (BM883702484541) with a balance of 0.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1521, CAST(N'2026-08-02T16:05:05.307' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (15, 7, N'user', N'how are u?', NULL, NULL, CAST(N'2026-08-02T16:05:12.540' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (16, 7, N'assistant', N'I''m doing well, thank you! How can I help you with your accounts or loans today?', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1548, CAST(N'2026-08-02T16:05:13.890' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (17, 7, N'user', N'Can I open one more current account?', NULL, NULL, CAST(N'2026-08-02T16:05:30.180' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (18, 7, N'assistant', N'The data I have only shows your current active account (BM022325146261) and a closed savings account (BM883702484541). It doesn''t contain information about opening new accounts, so please check your statements or contact support for help with that.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1627, CAST(N'2026-08-02T16:05:31.140' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (19, 7, N'user', N'is there any active loan?', NULL, NULL, CAST(N'2026-08-02T16:05:46.670' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (20, 7, N'assistant', N'Yes, you have one active car loan with an approved amount of 550,000, a 10% interest rate, and a duration of 12 months, running from July 22, 2026, to July 22, 2027.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1699, CAST(N'2026-08-02T16:05:48.100' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (21, 7, N'user', N'when is next payment due?', NULL, NULL, CAST(N'2026-08-02T16:06:02.947' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (22, 7, N'assistant', N'The data I have shows your active car loan runs until July 22, 2027, but it doesn''t list specific upcoming payment due dates or schedules. Please check your statements or contact support for more details on your next payment.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1758, CAST(N'2026-08-02T16:06:04.483' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (23, 8, N'user', N'whats my account balance?', NULL, NULL, CAST(N'2026-09-02T12:37:19.767' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (24, 8, N'assistant', N'You have one active current account (BM022325146261) with a balance of 4,208,700.01, and one savings account (BM883702484541) that is closed with a balance of 0.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1523, CAST(N'2026-09-02T12:37:21.180' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (25, 8, N'user', N'how can i apply loan?', NULL, NULL, CAST(N'2026-09-02T12:37:31.267' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (26, 8, N'assistant', N'I don''t have the details for how to apply for a new loan in my system. Please check your statements or contact support for assistance with loan applications.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1563, CAST(N'2026-09-02T12:37:32.620' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (27, 8, N'user', N'whats the status of my loans?', NULL, NULL, CAST(N'2026-09-02T12:37:50.530' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (28, 8, N'assistant', N'You have four loans on record:

1. **Car Loan**: Active, approved for 550,000 at a 10% interest rate (started 2026-07-22, ends 2027-07-22).
2. **Car Loan**: Closed, approved for 500,000 at a 10% interest rate (started 2026-07-10, ended 2027-07-10).
3. **Home Loan**: Closed, approved for 2,000,000 at an 8% interest rate (started 2026-06-17, ended 2031-06-17).
4. **Personal Loan**: Closed, approved for 100,000 at an 18% interest rate (started 2026-06-02, ended 2027-03-02).', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1796, CAST(N'2026-09-02T12:37:51.980' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (29, 8, N'user', N'how to create new account?', NULL, NULL, CAST(N'2026-09-02T12:38:09.087' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (30, 8, N'assistant', N'I don''t have the details for creating a new account in my system. Please check your statements or contact support for assistance.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1830, CAST(N'2026-09-02T12:38:10.390' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (31, 8, N'user', N'hello', NULL, NULL, CAST(N'2026-09-02T12:38:15.233' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (32, 8, N'assistant', N'Hello, Ali! How can I help you with your accounts, loans, or transactions today?', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1852, CAST(N'2026-09-02T12:38:17.097' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (33, 8, N'user', N'what are my latest 10 transactions?', NULL, NULL, CAST(N'2026-09-02T12:38:31.210' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (34, 8, N'assistant', N'I only see 5 recent transactions in your records. Would you like me to list those for you?', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 1878, CAST(N'2026-09-02T12:38:32.563' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (35, 8, N'user', N'yes', NULL, NULL, CAST(N'2026-09-02T12:38:36.877' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Messages] ([message_id], [session_id], [role], [content], [context_used], [tokens_used], [created_at]) VALUES (36, 8, N'assistant', N'Here are your 5 recent transactions:

1. **Withdrawal** of 700,000 on 2026-07-27 (Description: checkfraud2, Status: COMPLETED)
2. **Withdrawal** of 800,000 on 2026-07-27 (Description: checkfraud1, Status: COMPLETED)
3. **Withdrawal** of 900,000 on 2026-07-27 (Description: checkfraud0, Status: COMPLETED)
4. **Withdrawal** of 900,000 on 2026-07-23 (Description: fraud6, Status: COMPLETED)
5. **Withdrawal** of 800,000 on 2026-07-23 (Description: fraud5, Status: COMPLETED)

Since there are no other transactions in your data, please check your statements or contact support if you need to see older records.', N'{"accounts":[{"account_number":"BM022325146261","type":"CURRENT","balance":4208700.01,"status":"ACTIVE"},{"account_number":"BM883702484541","type":"SAVINGS","balance":0,"status":"CLOSED"}],"loans":[{"type":"CAR","status":"ACTIVE","requested_amount":550000,"approved_amount":550000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-22T00:00:00.000Z","end_date":"2027-07-22T00:00:00.000Z"},{"type":"CAR","status":"CLOSED","requested_amount":500000,"approved_amount":500000,"interest_rate":10,"duration_months":12,"start_date":"2026-07-10T00:00:00.000Z","end_date":"2027-07-10T00:00:00.000Z"},{"type":"HOME","status":"CLOSED","requested_amount":2000000,"approved_amount":2000000,"interest_rate":8,"duration_months":60,"start_date":"2026-06-17T00:00:00.000Z","end_date":"2031-06-17T00:00:00.000Z"},{"type":"PERSONAL","status":"CLOSED","requested_amount":101000,"approved_amount":100000,"interest_rate":18,"duration_months":9,"start_date":"2026-06-02T00:00:00.000Z","end_date":"2027-03-02T00:00:00.000Z"}],"recent_transactions":[{"type":"WITHDRAWAL","amount":700000,"date":"2026-07-27T12:11:08.927Z","description":"checkfraud2","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-27T12:10:58.100Z","description":"checkfraud1","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-27T12:10:47.557Z","description":"checkfraud0","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":900000,"date":"2026-07-23T12:48:29.710Z","description":"fraud6","status":"COMPLETED","from_account":"BM022325146261","to_account":null},{"type":"WITHDRAWAL","amount":800000,"date":"2026-07-23T12:48:19.677Z","description":"fraud5","status":"COMPLETED","from_account":"BM022325146261","to_account":null}]}', 2037, CAST(N'2026-09-02T12:38:38.543' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[AI_Chat_Messages] OFF
GO
SET IDENTITY_INSERT [dbo].[AI_Chat_Sessions] ON 
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (1, 2, N'What''s my account balance?', CAST(N'2026-07-31T12:26:16.370' AS DateTime), CAST(N'2026-07-31T12:26:19.570' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (2, 2, N'What''s my account balance?', CAST(N'2026-07-31T12:26:27.010' AS DateTime), CAST(N'2026-07-31T12:26:27.043' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (3, 2, N'What''s my account balance?', CAST(N'2026-07-31T12:27:46.817' AS DateTime), CAST(N'2026-07-31T12:27:49.120' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (4, 2, N'What''s my account balance?', CAST(N'2026-07-31T12:28:50.837' AS DateTime), CAST(N'2026-07-31T12:28:52.260' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (5, 2, N'What''s my account balance?', CAST(N'2026-08-02T15:49:02.097' AS DateTime), CAST(N'2026-08-02T15:49:03.427' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (6, 2, N'What''s my account balance?', CAST(N'2026-08-02T15:52:20.780' AS DateTime), CAST(N'2026-08-02T15:52:22.733' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (7, 2, N'whats my account balance?', CAST(N'2026-08-02T16:05:03.817' AS DateTime), CAST(N'2026-08-02T16:06:04.493' AS DateTime))
GO
INSERT [dbo].[AI_Chat_Sessions] ([session_id], [customer_id], [title], [started_at], [last_message_at]) VALUES (8, 2, N'whats my account balance?', CAST(N'2026-09-02T12:37:19.760' AS DateTime), CAST(N'2026-09-02T12:38:38.550' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[AI_Chat_Sessions] OFF
GO
SET IDENTITY_INSERT [dbo].[Customer_Approvals] ON 
GO
INSERT [dbo].[Customer_Approvals] ([approval_id], [customer_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (1, 1, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-13T11:39:41.323' AS DateTime))
GO
INSERT [dbo].[Customer_Approvals] ([approval_id], [customer_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (2, 1, 1, N'ADMIN', N'APPROVED', NULL, CAST(N'2026-05-13T12:24:33.153' AS DateTime))
GO
INSERT [dbo].[Customer_Approvals] ([approval_id], [customer_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (3, 2, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-13T14:52:23.237' AS DateTime))
GO
INSERT [dbo].[Customer_Approvals] ([approval_id], [customer_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (4, 2, 1, N'ADMIN', N'APPROVED', NULL, CAST(N'2026-05-13T14:53:44.863' AS DateTime))
GO
INSERT [dbo].[Customer_Approvals] ([approval_id], [customer_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (5, 3, 3, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-13T15:24:10.153' AS DateTime))
GO
INSERT [dbo].[Customer_Approvals] ([approval_id], [customer_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (6, 3, 1, N'ADMIN', N'APPROVED', NULL, CAST(N'2026-05-13T15:26:51.130' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Customer_Approvals] OFF
GO
SET IDENTITY_INSERT [dbo].[Customer_Auth] ON 
GO
INSERT [dbo].[Customer_Auth] ([auth_id], [customer_id], [password_hash], [last_login]) VALUES (1, 1, N'$2b$10$A3hwyWcOEZ36Q7zGXhUftOtrUO6Ik.gcSKxkDxQTCN1/fwwSJpZcq', CAST(N'2026-07-08T06:08:54.643' AS DateTime))
GO
INSERT [dbo].[Customer_Auth] ([auth_id], [customer_id], [password_hash], [last_login]) VALUES (2, 2, N'$2b$10$3i0Fx/DsKVI.9XVVATn5wuJLHExXmgGCKCvJoVlWJXo5dK1ywhXXG', CAST(N'2026-09-02T07:37:06.400' AS DateTime))
GO
INSERT [dbo].[Customer_Auth] ([auth_id], [customer_id], [password_hash], [last_login]) VALUES (3, 3, N'$2b$10$sW25Xm4WDwkskVMBsw.DjegX.JvdSn6MtaLz1sJ65j7IKj5NMOA/u', CAST(N'2026-06-10T06:02:06.037' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Customer_Auth] OFF
GO
SET IDENTITY_INSERT [dbo].[Customers] ON 
GO
INSERT [dbo].[Customers] ([customer_id], [full_name], [email], [phone], [address], [city], [country], [status], [created_at], [assigned_staff_id]) VALUES (1, N'Neha', N'nehamad@kmail.com', N'98765431', N'Naya Nazimabad Block C', N'Karachi', N'Pakistan', N'ACTIVE', CAST(N'2026-05-13T10:23:53.227' AS DateTime), 2)
GO
INSERT [dbo].[Customers] ([customer_id], [full_name], [email], [phone], [address], [city], [country], [status], [created_at], [assigned_staff_id]) VALUES (2, N'Ali', N'ali123@xmail.com', N'089867675', N'A-342 Block 9', N'Karachi', N'Pakistan', N'ACTIVE', CAST(N'2026-05-13T14:52:13.620' AS DateTime), 2)
GO
INSERT [dbo].[Customers] ([customer_id], [full_name], [email], [phone], [address], [city], [country], [status], [created_at], [assigned_staff_id]) VALUES (3, N'Haziq', N'haziq123@gnail.com', N'878218731', N'gulberg liberty ', N'Lahore', N'Pakistan', N'ACTIVE', CAST(N'2026-05-13T15:23:31.950' AS DateTime), 3)
GO
SET IDENTITY_INSERT [dbo].[Customers] OFF
GO
SET IDENTITY_INSERT [dbo].[Fraud_Logs] ON 
GO
INSERT [dbo].[Fraud_Logs] ([fraud_id], [transaction_id], [fraud_score], [fraud_type], [action_taken], [reviewed_by], [resolved_at], [detected_at]) VALUES (4, 64, CAST(1.00 AS Decimal(5, 2)), N'Large transaction: PKR 900,000 exceeds PKR 500,000 threshold', N'CLEARED', 1, CAST(N'2026-07-27T13:03:28.317' AS DateTime), CAST(N'2026-07-27T12:10:47.573' AS DateTime))
GO
INSERT [dbo].[Fraud_Logs] ([fraud_id], [transaction_id], [fraud_score], [fraud_type], [action_taken], [reviewed_by], [resolved_at], [detected_at]) VALUES (5, 65, CAST(1.00 AS Decimal(5, 2)), N'Large transaction: PKR 800,000 exceeds PKR 500,000 threshold', N'BLOCKED', 1, CAST(N'2026-07-27T14:26:20.020' AS DateTime), CAST(N'2026-07-27T12:10:58.103' AS DateTime))
GO
INSERT [dbo].[Fraud_Logs] ([fraud_id], [transaction_id], [fraud_score], [fraud_type], [action_taken], [reviewed_by], [resolved_at], [detected_at]) VALUES (6, 66, CAST(1.00 AS Decimal(5, 2)), N'Large transaction: PKR 700,000 exceeds PKR 500,000 threshold', N'BLOCKED', 1, CAST(N'2026-07-27T14:26:34.000' AS DateTime), CAST(N'2026-07-27T12:11:08.940' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Fraud_Logs] OFF
GO
SET IDENTITY_INSERT [dbo].[Loan_Approvals] ON 
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (1, 1, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-05-31T16:22:23.910' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (2, 1, 1, N'ADMIN', N'APPROVED', N'paisey time pr bharna', CAST(N'2026-06-02T16:46:24.140' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (3, 2, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-06-09T21:26:44.123' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (4, 2, 1, N'ADMIN', N'APPROVED', N'bhar dena paisa ok?', CAST(N'2026-06-09T21:27:11.650' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (5, 3, 3, N'STAFF', N'APPROVED', NULL, CAST(N'2026-06-10T11:03:52.880' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (6, 3, 1, N'ADMIN', N'APPROVED', N'shadi mubarak!', CAST(N'2026-06-10T11:04:54.070' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (7, 4, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-06-17T10:31:34.053' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (8, 4, 1, N'ADMIN', N'APPROVED', N'best of luck', CAST(N'2026-06-17T10:31:56.177' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (9, 5, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-06-17T15:19:26.930' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (10, 5, 1, N'ADMIN', N'APPROVED', N'civic lena', CAST(N'2026-06-17T15:19:43.763' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (11, 6, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-07-10T12:09:51.300' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (12, 6, 1, N'ADMIN', N'APPROVED', N'testing', CAST(N'2026-07-10T12:10:04.947' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (13, 7, 2, N'STAFF', N'APPROVED', NULL, CAST(N'2026-07-22T11:04:12.340' AS DateTime))
GO
INSERT [dbo].[Loan_Approvals] ([approval_id], [loan_id], [approver_id], [approver_role], [status], [remarks], [actioned_at]) VALUES (14, 7, 1, N'ADMIN', N'APPROVED', N'OKAY', CAST(N'2026-07-22T11:04:24.660' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Loan_Approvals] OFF
GO
SET IDENTITY_INSERT [dbo].[Loan_Policies] ON 
GO
INSERT [dbo].[Loan_Policies] ([policy_id], [loan_type], [min_amount], [max_amount], [min_months], [max_months], [interest_rate], [is_active], [created_at], [updated_at]) VALUES (1, N'CAR', CAST(500000.00 AS Decimal(15, 2)), CAST(3000000.00 AS Decimal(15, 2)), 12, 60, CAST(10.00 AS Decimal(5, 2)), 1, CAST(N'2026-05-12T10:03:06.227' AS DateTime), CAST(N'2026-06-05T14:57:39.163' AS DateTime))
GO
INSERT [dbo].[Loan_Policies] ([policy_id], [loan_type], [min_amount], [max_amount], [min_months], [max_months], [interest_rate], [is_active], [created_at], [updated_at]) VALUES (2, N'HOME', CAST(2000000.00 AS Decimal(15, 2)), CAST(20000000.00 AS Decimal(15, 2)), 60, 240, CAST(8.00 AS Decimal(5, 2)), 1, CAST(N'2026-05-12T10:03:06.227' AS DateTime), CAST(N'2026-07-28T11:04:30.793' AS DateTime))
GO
INSERT [dbo].[Loan_Policies] ([policy_id], [loan_type], [min_amount], [max_amount], [min_months], [max_months], [interest_rate], [is_active], [created_at], [updated_at]) VALUES (3, N'PERSONAL', CAST(100000.00 AS Decimal(15, 2)), CAST(1000000.00 AS Decimal(15, 2)), 6, 36, CAST(18.00 AS Decimal(5, 2)), 1, CAST(N'2026-05-12T10:03:06.227' AS DateTime), NULL)
GO
INSERT [dbo].[Loan_Policies] ([policy_id], [loan_type], [min_amount], [max_amount], [min_months], [max_months], [interest_rate], [is_active], [created_at], [updated_at]) VALUES (4, N'EDUCATION', CAST(200000.00 AS Decimal(15, 2)), CAST(5000000.00 AS Decimal(15, 2)), 12, 84, CAST(7.50 AS Decimal(5, 2)), 1, CAST(N'2026-05-12T10:03:06.227' AS DateTime), NULL)
GO
INSERT [dbo].[Loan_Policies] ([policy_id], [loan_type], [min_amount], [max_amount], [min_months], [max_months], [interest_rate], [is_active], [created_at], [updated_at]) VALUES (5, N'MARRIAGE', CAST(200000.00 AS Decimal(15, 2)), CAST(3000000.00 AS Decimal(15, 2)), 12, 60, CAST(11.00 AS Decimal(5, 2)), 1, CAST(N'2026-05-12T10:03:06.227' AS DateTime), NULL)
GO
INSERT [dbo].[Loan_Policies] ([policy_id], [loan_type], [min_amount], [max_amount], [min_months], [max_months], [interest_rate], [is_active], [created_at], [updated_at]) VALUES (6, N'MEDICAL', CAST(100000.00 AS Decimal(15, 2)), CAST(2000000.00 AS Decimal(15, 2)), 6, 48, CAST(10.00 AS Decimal(5, 2)), 1, CAST(N'2026-05-12T10:03:06.227' AS DateTime), NULL)
GO
SET IDENTITY_INSERT [dbo].[Loan_Policies] OFF
GO
SET IDENTITY_INSERT [dbo].[Loan_Repayments] ON 
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (1, 1, 1, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2026-07-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.150' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (2, 1, 2, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2026-08-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.157' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (3, 1, 3, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2026-09-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.157' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (4, 1, 4, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2026-10-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 24, CAST(N'2026-06-02T16:46:24.160' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (5, 1, 5, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2026-11-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.163' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (6, 1, 6, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2026-12-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.170' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (7, 1, 7, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2027-01-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.170' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (8, 1, 8, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2027-02-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.173' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (9, 1, 9, CAST(11111.11 AS Decimal(15, 2)), CAST(N'2027-03-02' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 23, CAST(N'2026-06-02T16:46:24.177' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (10, 2, 1, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2026-07-09' AS Date), CAST(N'2026-06-10' AS Date), N'PAID', 22, CAST(N'2026-06-09T21:27:11.673' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (11, 2, 2, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2026-08-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.677' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (12, 2, 3, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2026-09-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.680' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (13, 2, 4, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2026-10-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.680' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (14, 2, 5, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2026-11-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.687' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (15, 2, 6, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2026-12-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.690' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (16, 2, 7, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2027-01-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.693' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (17, 2, 8, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2027-02-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.697' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (18, 2, 9, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2027-03-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.700' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (19, 2, 10, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2027-04-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.707' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (20, 2, 11, CAST(41666.67 AS Decimal(15, 2)), CAST(N'2027-05-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.710' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (21, 2, 12, CAST(41666.63 AS Decimal(15, 2)), CAST(N'2027-06-09' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 30, CAST(N'2026-06-09T21:27:11.713' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (22, 3, 1, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2026-07-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.080' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (23, 3, 2, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2026-08-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.083' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (24, 3, 3, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2026-09-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.087' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (25, 3, 4, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2026-10-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.090' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (26, 3, 5, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2026-11-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.093' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (27, 3, 6, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2026-12-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.097' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (28, 3, 7, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2027-01-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.100' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (29, 3, 8, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2027-02-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.100' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (30, 3, 9, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2027-03-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.103' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (31, 3, 10, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2027-04-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.107' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (32, 3, 11, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2027-05-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.110' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (33, 3, 12, CAST(18078.84 AS Decimal(15, 2)), CAST(N'2027-06-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.113' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (34, 3, 13, CAST(18078.92 AS Decimal(15, 2)), CAST(N'2027-07-10' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-10T11:04:54.117' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (35, 4, 1, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2026-07-17' AS Date), CAST(N'2026-06-17' AS Date), N'PAID', 25, CAST(N'2026-06-17T10:31:56.187' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (36, 4, 2, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2026-08-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.190' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (37, 4, 3, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2026-09-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.193' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (38, 4, 4, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2026-10-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.197' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (39, 4, 5, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2026-11-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.203' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (40, 4, 6, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2026-12-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.207' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (41, 4, 7, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-01-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.210' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (42, 4, 8, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-02-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.213' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (43, 4, 9, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-03-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.220' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (44, 4, 10, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-04-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.223' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (45, 4, 11, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-05-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.227' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (46, 4, 12, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-06-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.230' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (47, 4, 13, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-07-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.233' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (48, 4, 14, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-08-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.237' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (49, 4, 15, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-09-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.240' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (50, 4, 16, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-10-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.243' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (51, 4, 17, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-11-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.247' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (52, 4, 18, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2027-12-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.250' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (53, 4, 19, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-01-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.257' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (54, 4, 20, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-02-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.260' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (55, 4, 21, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-03-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.263' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (56, 4, 22, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-04-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.270' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (57, 4, 23, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-05-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.273' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (58, 4, 24, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-06-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.277' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (59, 4, 25, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-07-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.280' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (60, 4, 26, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-08-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.283' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (61, 4, 27, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-09-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.290' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (62, 4, 28, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-10-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.290' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (63, 4, 29, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-11-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.297' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (64, 4, 30, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2028-12-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.300' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (65, 4, 31, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-01-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.313' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (66, 4, 32, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-02-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.323' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (67, 4, 33, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-03-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.327' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (68, 4, 34, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-04-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.330' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (69, 4, 35, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-05-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.333' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (70, 4, 36, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-06-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.340' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (71, 4, 37, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-07-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.343' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (72, 4, 38, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-08-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.347' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (73, 4, 39, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-09-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.350' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (74, 4, 40, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-10-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.353' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (75, 4, 41, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-11-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.360' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (76, 4, 42, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2029-12-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.360' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (77, 4, 43, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-01-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.367' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (78, 4, 44, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-02-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.370' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (79, 4, 45, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-03-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 34, CAST(N'2026-06-17T10:31:56.373' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (80, 4, 46, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-04-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.377' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (81, 4, 47, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-05-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.380' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (82, 4, 48, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-06-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 35, CAST(N'2026-06-17T10:31:56.383' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (83, 4, 49, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-07-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 35, CAST(N'2026-06-17T10:31:56.387' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (84, 4, 50, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-08-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 35, CAST(N'2026-06-17T10:31:56.390' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (85, 4, 51, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-09-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.393' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (86, 4, 52, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-10-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.397' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (87, 4, 53, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-11-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.400' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (88, 4, 54, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2030-12-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.403' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (89, 4, 55, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2031-01-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.407' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (90, 4, 56, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2031-02-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 33, CAST(N'2026-06-17T10:31:56.410' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (91, 4, 57, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2031-03-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.413' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (92, 4, 58, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2031-04-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.417' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (93, 4, 59, CAST(48333.33 AS Decimal(15, 2)), CAST(N'2031-05-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.420' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (94, 4, 60, CAST(48333.53 AS Decimal(15, 2)), CAST(N'2031-06-17' AS Date), CAST(N'2026-07-10' AS Date), N'PAID', 32, CAST(N'2026-06-17T10:31:56.423' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (95, 5, 1, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-07-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.773' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (96, 5, 2, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-08-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.777' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (97, 5, 3, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-09-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.780' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (98, 5, 4, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-10-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.783' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (99, 5, 5, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-11-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.787' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (100, 5, 6, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-12-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.790' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (101, 5, 7, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-01-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.790' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (102, 5, 8, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-02-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.793' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (103, 5, 9, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-03-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.797' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (104, 5, 10, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-04-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.800' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (105, 5, 11, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-05-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.803' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (106, 5, 12, CAST(45833.37 AS Decimal(15, 2)), CAST(N'2027-06-17' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-06-17T15:19:43.807' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (107, 6, 1, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-08-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.970' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (108, 6, 2, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-09-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.973' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (109, 6, 3, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-10-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.980' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (110, 6, 4, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-11-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.980' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (111, 6, 5, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2026-12-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.987' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (112, 6, 6, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-01-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.990' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (113, 6, 7, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-02-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.993' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (114, 6, 8, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-03-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:04.997' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (115, 6, 9, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-04-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:05.000' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (116, 6, 10, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-05-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:05.000' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (117, 6, 11, CAST(45833.33 AS Decimal(15, 2)), CAST(N'2027-06-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:05.003' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (118, 6, 12, CAST(45833.37 AS Decimal(15, 2)), CAST(N'2027-07-10' AS Date), CAST(N'2026-07-22' AS Date), N'PAID', 39, CAST(N'2026-07-10T12:10:05.010' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (119, 7, 1, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2026-08-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.687' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (120, 7, 2, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2026-09-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.690' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (121, 7, 3, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2026-10-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.693' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (122, 7, 4, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2026-11-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.700' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (123, 7, 5, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2026-12-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.700' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (124, 7, 6, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2027-01-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.703' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (125, 7, 7, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2027-02-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.707' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (126, 7, 8, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2027-03-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.710' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (127, 7, 9, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2027-04-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.710' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (128, 7, 10, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2027-05-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.717' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (129, 7, 11, CAST(50416.66 AS Decimal(15, 2)), CAST(N'2027-06-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.720' AS DateTime))
GO
INSERT [dbo].[Loan_Repayments] ([repayment_id], [loan_id], [installment_no], [amount], [due_date], [paid_date], [status], [transaction_id], [created_at]) VALUES (130, 7, 12, CAST(50416.74 AS Decimal(15, 2)), CAST(N'2027-07-22' AS Date), NULL, N'PENDING', NULL, CAST(N'2026-07-22T11:04:24.720' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Loan_Repayments] OFF
GO
SET IDENTITY_INSERT [dbo].[Loans] ON 
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (1, 2, 5, 3, CAST(101000.00 AS Decimal(15, 2)), CAST(100000.00 AS Decimal(15, 2)), NULL, NULL, NULL, 9, CAST(N'2026-06-02' AS Date), CAST(N'2027-03-02' AS Date), N'CLOSED', 0, CAST(N'2026-05-31T16:20:21.753' AS DateTime))
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (2, 1, 6, 1, CAST(500000.00 AS Decimal(15, 2)), CAST(500000.00 AS Decimal(15, 2)), NULL, NULL, NULL, 12, CAST(N'2026-06-09' AS Date), CAST(N'2027-06-09' AS Date), N'CLOSED', 1, CAST(N'2026-06-09T21:26:05.600' AS DateTime))
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (3, 3, 3, 5, CAST(200000.00 AS Decimal(15, 2)), CAST(210000.00 AS Decimal(15, 2)), NULL, NULL, NULL, 13, CAST(N'2026-06-10' AS Date), CAST(N'2027-07-10' AS Date), N'ACTIVE', 1, CAST(N'2026-06-10T11:02:42.653' AS DateTime))
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (4, 2, 5, 2, CAST(2000000.00 AS Decimal(15, 2)), CAST(2000000.00 AS Decimal(15, 2)), NULL, NULL, NULL, 60, CAST(N'2026-06-17' AS Date), CAST(N'2031-06-17' AS Date), N'CLOSED', 1, CAST(N'2026-06-17T10:31:11.467' AS DateTime))
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (5, 1, 6, 1, CAST(500000.00 AS Decimal(15, 2)), CAST(500000.00 AS Decimal(15, 2)), NULL, NULL, NULL, 12, CAST(N'2026-06-17' AS Date), CAST(N'2027-06-17' AS Date), N'ACTIVE', 1, CAST(N'2026-06-17T12:56:00.410' AS DateTime))
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (6, 2, 5, 1, CAST(500000.00 AS Decimal(15, 2)), CAST(500000.00 AS Decimal(15, 2)), CAST(500000.00 AS Decimal(15, 2)), CAST(N'2026-07-10T07:10:04.950' AS DateTime), 1, 12, CAST(N'2026-07-10' AS Date), CAST(N'2027-07-10' AS Date), N'CLOSED', 1, CAST(N'2026-07-10T12:09:34.773' AS DateTime))
GO
INSERT [dbo].[Loans] ([loan_id], [customer_id], [account_id], [policy_id], [loan_amount], [approved_amount], [disbursed_amount], [disbursed_at], [disbursed_by], [duration_months], [start_date], [end_date], [status], [auto_deduct], [created_at]) VALUES (7, 2, 5, 1, CAST(550000.00 AS Decimal(15, 2)), CAST(550000.00 AS Decimal(15, 2)), CAST(550000.00 AS Decimal(15, 2)), CAST(N'2026-07-22T06:04:24.667' AS DateTime), 1, 12, CAST(N'2026-07-22' AS Date), CAST(N'2027-07-22' AS Date), N'ACTIVE', 1, CAST(N'2026-07-22T11:03:07.583' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Loans] OFF
GO
SET IDENTITY_INSERT [dbo].[Notifications] ON 
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (1, 2, N'STAFF', N'STAFF_APPROVED', N'Your account has been approved. You can now log in to BankMind.', 2, N'USER', 1, CAST(N'2026-05-13T09:29:12.213' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (2, 1, N'CUSTOMER', N'CUSTOMER_STAFF_APPROVED', N'Your registration has been approved by your assigned staff. Awaiting final admin approval.', 1, N'CUSTOMER', 1, CAST(N'2026-05-13T11:39:41.337' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (3, 1, N'ADMIN', N'CUSTOMER_STAFF_APPROVED', N'Customer "Neha" approved by staff — awaiting your approval.', 1, N'CUSTOMER', 1, CAST(N'2026-05-13T11:39:41.350' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (4, 1, N'CUSTOMER', N'REGISTRATION_APPROVED', N'Your registration has been fully approved. Welcome to BankMind!', 1, N'CUSTOMER', 1, CAST(N'2026-05-13T12:24:33.187' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (5, 2, N'CUSTOMER', N'CUSTOMER_STAFF_APPROVED', N'Your registration has been approved by your assigned staff. Awaiting final admin approval.', 2, N'CUSTOMER', 1, CAST(N'2026-05-13T14:52:23.240' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (6, 1, N'ADMIN', N'CUSTOMER_STAFF_APPROVED', N'Customer "Ali" approved by staff — awaiting your approval.', 2, N'CUSTOMER', 1, CAST(N'2026-05-13T14:52:23.257' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (7, 2, N'CUSTOMER', N'REGISTRATION_APPROVED', N'Your registration has been fully approved. Welcome to BankMind!', 2, N'CUSTOMER', 1, CAST(N'2026-05-13T14:53:44.877' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (8, 2, N'CUSTOMER', N'ACCOUNT_SUSPENDED', N'Your account has been suspended. Please contact support.', NULL, NULL, 1, CAST(N'2026-05-13T14:55:25.840' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (9, 2, N'CUSTOMER', N'ACCOUNT_REACTIVATED', N'Your account has been reactivated. Welcome back!', NULL, NULL, 1, CAST(N'2026-05-13T14:55:57.330' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (10, 3, N'STAFF', N'STAFF_CREATED', N'Welcome to BankMind! Your staff account has been created. Email: ammad123@cmail.com', 3, N'USER', 1, CAST(N'2026-05-13T14:58:49.570' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (11, 3, N'CUSTOMER', N'CUSTOMER_STAFF_APPROVED', N'Your registration has been approved by your assigned staff. Awaiting final admin approval.', 3, N'CUSTOMER', 1, CAST(N'2026-05-13T15:24:10.167' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (12, 1, N'ADMIN', N'CUSTOMER_STAFF_APPROVED', N'Customer "Haziq" approved by staff — awaiting your approval.', 3, N'CUSTOMER', 1, CAST(N'2026-05-13T15:24:10.180' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (13, 3, N'CUSTOMER', N'REGISTRATION_APPROVED', N'Your registration has been fully approved. Welcome to BankMind!', 3, N'CUSTOMER', 1, CAST(N'2026-05-13T15:26:51.157' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (14, 1, N'ADMIN', N'STAFF_PROFILE_UPDATED', N'Staff member Alyann updated their profile.', 2, N'USER', 1, CAST(N'2026-05-13T17:34:16.300' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (15, 1, N'ADMIN', N'STAFF_PROFILE_UPDATED', N'Staff member Alyan updated their profile.', 2, N'USER', 1, CAST(N'2026-05-13T17:34:27.313' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (16, 3, N'STAFF', N'ACCOUNT_PENDING', N'Customer "Haziq" requested a new SAVINGS account. Awaiting your approval.', 1, N'ACCOUNT', 1, CAST(N'2026-05-14T09:12:22.170' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (17, 3, N'STAFF', N'ACCOUNT_PENDING', N'Customer "Haziq" requested a new CURRENT account. Awaiting your approval.', 3, N'ACCOUNT', 1, CAST(N'2026-05-14T09:15:15.097' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (18, 3, N'CUSTOMER', N'ACCOUNT_APPROVED', N'Your CURRENT account has been approved and is now active.', 3, N'ACCOUNT', 1, CAST(N'2026-05-14T09:20:56.650' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (19, 3, N'CUSTOMER', N'ACCOUNT_REJECTED', N'Your SAVINGS account request was rejected. Reason: NO JOB', 1, N'ACCOUNT', 1, CAST(N'2026-05-14T09:21:05.513' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (20, 3, N'CUSTOMER', N'DEPOSIT', N'PKR 10000 deposited to your account (A/C BM873211507415).', 1, N'TRANSACTION', 1, CAST(N'2026-05-14T10:07:57.657' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (21, 1, N'ADMIN', N'DEPOSIT', N'Deposit of PKR 10000 by Ammad on account BM873211507415 (Haziq).', 1, N'TRANSACTION', 1, CAST(N'2026-05-14T10:07:57.680' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (22, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 100 withdrawn from your account (A/C BM873211507415).', 2, N'TRANSACTION', 1, CAST(N'2026-05-14T11:19:53.200' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (23, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 100 withdrawn from your account (A/C BM873211507415).', 3, N'TRANSACTION', 1, CAST(N'2026-05-14T11:19:55.560' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (24, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 1000 withdrawn from your account (A/C BM873211507415).', 4, N'TRANSACTION', 1, CAST(N'2026-05-14T11:20:39.390' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (25, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 1000 withdrawn from your account (A/C BM873211507415).', 5, N'TRANSACTION', 1, CAST(N'2026-05-14T11:28:16.533' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (26, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 1000 withdrawn from your account (A/C BM873211507415).', 6, N'TRANSACTION', 1, CAST(N'2026-05-14T12:20:26.427' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (27, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 1000 withdrawn from your account (A/C BM873211507415).', 7, N'TRANSACTION', 1, CAST(N'2026-05-14T12:22:36.297' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (28, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 1000 withdrawn from your account (A/C BM873211507415).', 8, N'TRANSACTION', 1, CAST(N'2026-05-14T12:24:11.557' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (29, 1, N'ADMIN', N'WITHDRAWAL', N'Withdrawal of PKR 1000 by "Haziq" from account BM873211507415.', 8, N'TRANSACTION', 1, CAST(N'2026-05-14T12:24:11.620' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (30, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 100 withdrawn from your account (A/C BM873211507415).', 9, N'TRANSACTION', 1, CAST(N'2026-05-14T14:47:15.930' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (31, 1, N'ADMIN', N'WITHDRAWAL', N'Withdrawal of PKR 100 by "Haziq" from account BM873211507415.', 9, N'TRANSACTION', 1, CAST(N'2026-05-14T14:47:16.070' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (32, 3, N'STAFF', N'WITHDRAWAL', N'Customer "Haziq" withdrew PKR 100 from account BM873211507415.', 9, N'TRANSACTION', 1, CAST(N'2026-05-14T14:47:16.083' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (33, 3, N'CUSTOMER', N'DEPOSIT', N'PKR 100 deposited to your account (A/C BM873211507415).', 10, N'TRANSACTION', 1, CAST(N'2026-05-14T15:00:51.223' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (34, 1, N'ADMIN', N'DEPOSIT', N'Deposit of PKR 100 by Ammad on account BM873211507415 (Haziq).', 10, N'TRANSACTION', 1, CAST(N'2026-05-14T15:00:51.303' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (35, 3, N'CUSTOMER', N'WITHDRAWAL', N'PKR 100 has been withdrawn from your account (A/C BM873211507415).', 11, N'TRANSACTION', 1, CAST(N'2026-05-14T15:06:11.093' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (36, 3, N'STAFF', N'WITHDRAWAL', N'Customer "Haziq" withdrew PKR 100 from account BM873211507415.', 11, N'TRANSACTION', 1, CAST(N'2026-05-14T15:06:11.120' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (37, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Haziq" withdrew PKR 100 from account BM873211507415.', 11, N'TRANSACTION', 1, CAST(N'2026-05-14T15:06:11.147' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (38, 3, N'CUSTOMER', N'DEPOSIT', N'PKR 100 has been deposited to your account (A/C BM873211507415).', 12, N'TRANSACTION', 1, CAST(N'2026-05-14T15:06:50.347' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (39, 3, N'STAFF', N'DEPOSIT', N'You deposited PKR 100 to customer "Haziq" (A/C BM873211507415).', 12, N'TRANSACTION', 1, CAST(N'2026-05-14T15:06:50.363' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (40, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Ammad deposited PKR 100 to account BM873211507415 (Haziq)', 12, N'TRANSACTION', 1, CAST(N'2026-05-14T15:06:50.383' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (41, 1, N'ADMIN', N'STAFF_PROFILE_UPDATED', N'Staff member Ammadsexy updated their profile.', 3, N'USER', 1, CAST(N'2026-05-14T15:18:25.340' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (42, 2, N'STAFF', N'ACCOUNT_PENDING', N'Customer "Ali" requested a new SAVINGS account. Awaiting your approval.', 4, N'ACCOUNT', 1, CAST(N'2026-05-15T14:23:44.870' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (43, 2, N'CUSTOMER', N'ACCOUNT_APPROVED', N'Your SAVINGS account has been approved and is now active.', 4, N'ACCOUNT', 1, CAST(N'2026-05-15T14:24:02.413' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (44, 2, N'CUSTOMER', N'DEPOSIT', N'PKR 30000 has been deposited to your account (A/C BM883702484541).', 13, N'TRANSACTION', 1, CAST(N'2026-05-15T14:25:05.393' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (45, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 30000 to customer "Ali" (A/C BM883702484541).', 13, N'TRANSACTION', 1, CAST(N'2026-05-15T14:25:05.403' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (46, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 30000 to account BM883702484541 (Ali)', 13, N'TRANSACTION', 1, CAST(N'2026-05-15T14:25:05.420' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (47, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 1200 has been withdrawn from your account (A/C BM883702484541).', 14, N'TRANSACTION', 1, CAST(N'2026-05-15T14:42:22.373' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (48, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 1200 from account BM883702484541.', 14, N'TRANSACTION', 1, CAST(N'2026-05-15T14:42:22.393' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (49, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 1200 from account BM883702484541.', 14, N'TRANSACTION', 1, CAST(N'2026-05-15T14:42:22.410' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (50, 2, N'CUSTOMER', N'TRANSFER_SENT', N'PKR 10000 has been transferred to account BM873211507415 (Haziq).', 15, N'TRANSACTION', 1, CAST(N'2026-05-15T14:55:32.153' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (51, 2, N'STAFF', N'TRANSFER_SENT', N'Your customer "Ali" transferred PKR 10000 to account BM873211507415 (Haziq).', 15, N'TRANSACTION', 1, CAST(N'2026-05-15T14:55:32.163' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (52, 3, N'CUSTOMER', N'TRANSFER_RECEIVED', N'PKR 10000 has been received from account BM883702484541 (Ali).', 15, N'TRANSACTION', 1, CAST(N'2026-05-15T14:55:32.173' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (53, 3, N'STAFF', N'TRANSFER_RECEIVED', N'Your customer "Haziq" received PKR 10000 from account BM883702484541 (Ali).', 15, N'TRANSACTION', 1, CAST(N'2026-05-15T14:55:32.180' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (54, 1, N'ADMIN', N'TRANSFER', N'💸 TRANSFER: Ali (BM883702484541) → Haziq (BM873211507415) | Amount: PKR 10000', 15, N'TRANSACTION', 1, CAST(N'2026-05-15T14:55:32.200' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (55, 2, N'CUSTOMER', N'DEPOSIT', N'PKR 90 has been deposited to your account (A/C BM883702484541).', 16, N'TRANSACTION', 1, CAST(N'2026-05-25T12:09:40.307' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (56, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 90 to customer "Ali" (A/C BM883702484541).', 16, N'TRANSACTION', 1, CAST(N'2026-05-25T12:09:40.317' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (57, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 90 to account BM883702484541 (Ali)', 16, N'TRANSACTION', 1, CAST(N'2026-05-25T12:09:40.330' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (58, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 100 has been withdrawn from your account (A/C BM883702484541).', 17, N'TRANSACTION', 1, CAST(N'2026-05-31T15:09:36.810' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (59, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 100 from account BM883702484541.', 17, N'TRANSACTION', 1, CAST(N'2026-05-31T15:09:36.820' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (60, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 100 from account BM883702484541.', 17, N'TRANSACTION', 1, CAST(N'2026-05-31T15:09:36.837' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (61, 2, N'CUSTOMER', N'ACCOUNT_PENDING', N'Your CURRENT account request has been submitted and is awaiting staff approval.', 5, N'ACCOUNT', 1, CAST(N'2026-05-31T15:27:31.473' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (62, 2, N'STAFF', N'ACCOUNT_PENDING', N'Customer "Ali" requested a new CURRENT account. Awaiting your approval.', 5, N'ACCOUNT', 1, CAST(N'2026-05-31T15:27:31.480' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (63, 1, N'ADMIN', N'ACCOUNT_PENDING', N'Customer "Ali" requested a new CURRENT account.', 5, N'ACCOUNT', 1, CAST(N'2026-05-31T15:27:31.497' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (64, 2, N'CUSTOMER', N'ACCOUNT_APPROVED', N'Your CURRENT account has been approved and is now active.', 5, N'ACCOUNT', 1, CAST(N'2026-05-31T15:28:20.487' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (65, 1, N'ADMIN', N'ACCOUNT_APPROVED', N'Customer "Ali" CURRENT account approved by staff.', 5, N'ACCOUNT', 1, CAST(N'2026-05-31T15:28:20.493' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (66, 2, N'CUSTOMER', N'DEPOSIT', N'PKR 90000 has been deposited to your account (A/C BM022325146261).', 18, N'TRANSACTION', 1, CAST(N'2026-05-31T15:30:26.560' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (67, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 90000 to customer "Ali" (A/C BM022325146261).', 18, N'TRANSACTION', 1, CAST(N'2026-05-31T15:30:26.567' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (68, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 90000 to account BM022325146261 (Ali)', 18, N'TRANSACTION', 1, CAST(N'2026-05-31T15:30:26.583' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (69, 2, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your PERSONAL loan application of PKR 101000 has been submitted and is awaiting approval.', 1, N'LOAN', 1, CAST(N'2026-05-31T16:20:21.767' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (70, 2, N'STAFF', N'LOAN_APPLIED', N'Customer "Ali" applied for a PERSONAL loan of PKR 101000. Awaiting your approval.', 1, N'LOAN', 1, CAST(N'2026-05-31T16:20:21.773' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (71, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Ali" applied for a PERSONAL loan of PKR 101000.', 1, N'LOAN', 1, CAST(N'2026-05-31T16:20:21.783' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (72, 2, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your PERSONAL loan has been reviewed by staff. Awaiting final admin approval.', 1, N'LOAN', 1, CAST(N'2026-05-31T16:22:23.920' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (73, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Ali" PERSONAL loan approved by staff — awaiting your final approval.', 1, N'LOAN', 1, CAST(N'2026-05-31T16:22:23.937' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (74, 2, N'CUSTOMER', N'LOAN_APPROVED', N'Your PERSONAL loan of PKR 100000 is fully approved and active! Monthly EMI: PKR 11111.11.', 1, N'LOAN', 1, CAST(N'2026-06-02T16:46:24.187' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (75, 2, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Ali" PERSONAL loan fully approved by admin and is now active.', 1, N'LOAN', 1, CAST(N'2026-06-02T16:46:24.193' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (76, 2, N'CUSTOMER', N'DEPOSIT', N'PKR 900 has been deposited to your account (A/C BM022325146261).', 19, N'TRANSACTION', 1, CAST(N'2026-06-02T17:40:45.427' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (77, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 900 to customer "Ali" (A/C BM022325146261).', 19, N'TRANSACTION', 1, CAST(N'2026-06-02T17:40:45.433' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (78, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 900 to account BM022325146261 (Ali)', 19, N'TRANSACTION', 1, CAST(N'2026-06-02T17:40:45.453' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (79, 2, N'STAFF', N'LOAN_POLICY_UPDATED', N'Loan policy #1 has been updated.', 1, N'LOAN_POLICY', 1, CAST(N'2026-06-05T14:57:39.180' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (80, 3, N'STAFF', N'LOAN_POLICY_UPDATED', N'Loan policy #1 has been updated.', 1, N'LOAN_POLICY', 1, CAST(N'2026-06-05T14:57:39.190' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (81, 2, N'CUSTOMER', N'DEPOSIT', N'PKR 60000 has been deposited to your account (A/C BM022325146261).', 20, N'TRANSACTION', 1, CAST(N'2026-06-05T15:01:57.573' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (82, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 60000 to customer "Ali" (A/C BM022325146261).', 20, N'TRANSACTION', 1, CAST(N'2026-06-05T15:01:57.577' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (83, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 60000 to account BM022325146261 (Ali)', 20, N'TRANSACTION', 1, CAST(N'2026-06-05T15:01:57.593' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (84, 1, N'CUSTOMER', N'ACCOUNT_PENDING', N'Your SAVINGS account request has been submitted and is awaiting staff approval.', 6, N'ACCOUNT', 1, CAST(N'2026-06-09T21:24:39.720' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (85, 2, N'STAFF', N'ACCOUNT_PENDING', N'Customer "Neha" requested a new SAVINGS account. Awaiting your approval.', 6, N'ACCOUNT', 1, CAST(N'2026-06-09T21:24:39.730' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (86, 1, N'ADMIN', N'ACCOUNT_PENDING', N'Customer "Neha" requested a new SAVINGS account.', 6, N'ACCOUNT', 1, CAST(N'2026-06-09T21:24:39.740' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (87, 1, N'CUSTOMER', N'ACCOUNT_APPROVED', N'Your SAVINGS account has been approved and is now active.', 6, N'ACCOUNT', 1, CAST(N'2026-06-09T21:25:38.210' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (88, 1, N'ADMIN', N'ACCOUNT_APPROVED', N'Customer "Neha" SAVINGS account approved by staff.', 6, N'ACCOUNT', 1, CAST(N'2026-06-09T21:25:38.223' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (89, 1, N'CUSTOMER', N'DEPOSIT', N'PKR 80000 has been deposited to your account (A/C BM102227970826).', 21, N'TRANSACTION', 1, CAST(N'2026-06-09T21:25:47.397' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (90, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 80000 to customer "Neha" (A/C BM102227970826).', 21, N'TRANSACTION', 1, CAST(N'2026-06-09T21:25:47.407' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (91, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 80000 to account BM102227970826 (Neha)', 21, N'TRANSACTION', 1, CAST(N'2026-06-09T21:25:47.420' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (92, 1, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your CAR loan application of PKR 500000 has been submitted and is awaiting approval.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:26:05.610' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (93, 2, N'STAFF', N'LOAN_APPLIED', N'Customer "Neha" applied for a CAR loan of PKR 500000. Awaiting your approval.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:26:05.617' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (94, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Neha" applied for a CAR loan of PKR 500000.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:26:05.627' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (95, 1, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your CAR loan has been reviewed by staff. Awaiting final admin approval.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:26:44.130' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (96, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Neha" CAR loan approved by staff — awaiting your final approval.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:26:44.140' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (97, 1, N'CUSTOMER', N'LOAN_APPROVED', N'Your CAR loan of PKR 500000 is fully approved and active! Monthly EMI: PKR 41666.67.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:27:11.717' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (98, 2, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Neha" CAR loan fully approved by admin and is now active.', 2, N'LOAN', 1, CAST(N'2026-06-09T21:27:11.717' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (99, 1, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Installment #1 of PKR 41,666.67 paid successfully.', 22, N'TRANSACTION', 1, CAST(N'2026-06-10T10:08:26.220' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (100, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Neha" paid installment #1 of PKR 41,666.67.', 22, N'TRANSACTION', 1, CAST(N'2026-06-10T10:08:26.223' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (101, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Neha" paid installment #1 of PKR 41,666.67.', 22, N'TRANSACTION', 1, CAST(N'2026-06-10T10:08:26.237' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (102, 3, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your MARRIAGE loan application of PKR 200000 has been submitted and is awaiting approval.', 3, N'LOAN', 1, CAST(N'2026-06-10T11:02:42.667' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (103, 3, N'STAFF', N'LOAN_APPLIED', N'Customer "Haziq" applied for a MARRIAGE loan of PKR 200000. Awaiting your approval.', 3, N'LOAN', 1, CAST(N'2026-06-10T11:02:42.670' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (104, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Haziq" applied for a MARRIAGE loan of PKR 200000.', 3, N'LOAN', 1, CAST(N'2026-06-10T11:02:42.680' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (105, 3, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your MARRIAGE loan has been reviewed by staff. Awaiting final admin approval.', 3, N'LOAN', 1, CAST(N'2026-06-10T11:03:52.883' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (106, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Haziq" MARRIAGE loan approved by staff — awaiting your final approval.', 3, N'LOAN', 1, CAST(N'2026-06-10T11:03:52.897' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (107, 3, N'CUSTOMER', N'LOAN_APPROVED', N'Your MARRIAGE loan of PKR 210,000 is approved and active! Monthly EMI: PKR 18,078.85. Total repayment: PKR 235,025 (includes PKR 25,025 interest at 11% per annum).', 3, N'LOAN', 1, CAST(N'2026-06-10T11:04:54.123' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (108, 3, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Haziq" MARRIAGE loan fully approved. EMI: PKR 18,078.85 for 13 months.', 3, N'LOAN', 1, CAST(N'2026-06-10T11:04:54.123' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (109, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 88,888.88 for installments #1, 2, 3, 5, 6, 7, 8, 9 paid successfully.', 23, N'TRANSACTION', 1, CAST(N'2026-06-17T10:30:12.140' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (110, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 8 installments (balloon) of PKR 88,888.88.', 23, N'TRANSACTION', 1, CAST(N'2026-06-17T10:30:12.143' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (111, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 8 installments of PKR 88,888.88.', 23, N'TRANSACTION', 1, CAST(N'2026-06-17T10:30:12.160' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (112, 2, N'CUSTOMER', N'LOAN_CLOSED', N'Congratulations! Your PERSONAL loan has been fully repaid and is now closed.', 1, N'LOAN', 1, CAST(N'2026-06-17T10:30:17.447' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (113, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid installment #4 of PKR 11,111.11.', 24, N'TRANSACTION', 1, CAST(N'2026-06-17T10:30:17.453' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (114, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Installment #4 of PKR 11,111.11 paid successfully.', 24, N'TRANSACTION', 1, CAST(N'2026-06-17T10:30:17.453' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (115, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid installment #4 of PKR 11,111.11.', 24, N'TRANSACTION', 1, CAST(N'2026-06-17T10:30:17.457' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (116, 2, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your HOME loan application of PKR 2000000 has been submitted and is awaiting approval.', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:11.487' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (117, 2, N'STAFF', N'LOAN_APPLIED', N'Customer "Ali" applied for a HOME loan of PKR 2000000. Awaiting your approval.', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:11.500' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (118, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Ali" applied for a HOME loan of PKR 2000000.', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:11.523' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (119, 2, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your HOME loan has been reviewed by staff. Awaiting final admin approval.', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:34.067' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (120, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Ali" HOME loan approved by staff — awaiting your final approval.', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:34.070' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (121, 2, N'CUSTOMER', N'LOAN_APPROVED', N'Your HOME loan of PKR 2,000,000 is approved and active! Monthly EMI: PKR 48,333.33. Total repayment: PKR 2,900,000 (includes PKR 900,000 interest at 9% per annum).', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:56.430' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (122, 2, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Ali" HOME loan fully approved. EMI: PKR 48,333.33 for 60 months.', 4, N'LOAN', 1, CAST(N'2026-06-17T10:31:56.430' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (123, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Installment #1 of PKR 48,333.33 paid successfully.', 25, N'TRANSACTION', 1, CAST(N'2026-06-17T10:32:57.190' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (124, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid installment #1 of PKR 48,333.33.', 25, N'TRANSACTION', 1, CAST(N'2026-06-17T10:32:57.193' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (125, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid installment #1 of PKR 48,333.33.', 25, N'TRANSACTION', 1, CAST(N'2026-06-17T10:32:57.200' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (126, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 800 has been withdrawn from your account (A/C BM022325146261).', 26, N'TRANSACTION', 1, CAST(N'2026-06-17T12:11:20.357' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (127, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 800 from account BM022325146261.', 26, N'TRANSACTION', 1, CAST(N'2026-06-17T12:11:20.363' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (128, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 800 from account BM022325146261.', 26, N'TRANSACTION', 1, CAST(N'2026-06-17T12:11:20.377' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (129, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 100 has been withdrawn from your account (A/C BM022325146261).', 27, N'TRANSACTION', 1, CAST(N'2026-06-17T12:17:20.990' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (130, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 100 from account BM022325146261.', 27, N'TRANSACTION', 1, CAST(N'2026-06-17T12:17:20.997' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (131, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 100 from account BM022325146261.', 27, N'TRANSACTION', 1, CAST(N'2026-06-17T12:17:21.010' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (132, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 90 has been withdrawn from your account (A/C BM022325146261).', 28, N'TRANSACTION', 1, CAST(N'2026-06-17T12:47:41.573' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (133, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 90 from account BM022325146261.', 28, N'TRANSACTION', 1, CAST(N'2026-06-17T12:47:41.577' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (134, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 90 from account BM022325146261.', 28, N'TRANSACTION', 1, CAST(N'2026-06-17T12:47:41.587' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (135, 1, N'CUSTOMER', N'DEPOSIT', N'PKR 600000 has been deposited to your account (A/C BM102227970826).', 29, N'TRANSACTION', 1, CAST(N'2026-06-17T12:54:24.700' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (136, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 600000 to customer "Neha" (A/C BM102227970826).', 29, N'TRANSACTION', 1, CAST(N'2026-06-17T12:54:24.703' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (137, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 600000 to account BM102227970826 (Neha)', 29, N'TRANSACTION', 1, CAST(N'2026-06-17T12:54:24.717' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (138, 1, N'CUSTOMER', N'LOAN_CLOSED', N'Congratulations! Your CAR loan has been fully repaid and is now closed.', 2, N'LOAN', 1, CAST(N'2026-06-17T12:54:43.953' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (139, 1, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 458,333.33 for installments #2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 paid successfully.', 30, N'TRANSACTION', 1, CAST(N'2026-06-17T12:54:43.960' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (140, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Neha" paid 11 installments (balloon) of PKR 458,333.33.', 30, N'TRANSACTION', 1, CAST(N'2026-06-17T12:54:43.963' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (141, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Neha" paid 11 installments of PKR 458,333.33.', 30, N'TRANSACTION', 1, CAST(N'2026-06-17T12:54:43.963' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (142, 1, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your CAR loan application of PKR 500000 has been submitted and is awaiting approval.', 5, N'LOAN', 1, CAST(N'2026-06-17T12:56:00.427' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (143, 2, N'STAFF', N'LOAN_APPLIED', N'Customer "Neha" applied for a CAR loan of PKR 500000. Awaiting your approval.', 5, N'LOAN', 1, CAST(N'2026-06-17T12:56:00.433' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (144, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Neha" applied for a CAR loan of PKR 500000.', 5, N'LOAN', 1, CAST(N'2026-06-17T12:56:00.443' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (145, 1, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your CAR loan has been reviewed by staff. Awaiting final admin approval.', 5, N'LOAN', 1, CAST(N'2026-06-17T15:19:26.937' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (146, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Neha" CAR loan approved by staff — awaiting your final approval.', 5, N'LOAN', 1, CAST(N'2026-06-17T15:19:26.947' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (147, 1, N'CUSTOMER', N'LOAN_APPROVED', N'Your CAR loan of PKR 500,000 is approved and active! Monthly EMI: PKR 45,833.33. Total repayment: PKR 550,000 (includes PKR 50,000 interest at 10% per annum).', 5, N'LOAN', 1, CAST(N'2026-06-17T15:19:43.810' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (148, 2, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Neha" CAR loan fully approved. EMI: PKR 45,833.33 for 12 months.', 5, N'LOAN', 1, CAST(N'2026-06-17T15:19:43.813' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (149, 2, N'CUSTOMER', N'DEPOSIT', N'PKR 15000000 has been deposited to your account (A/C BM022325146261).', 31, N'TRANSACTION', 1, CAST(N'2026-06-23T12:34:21.370' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (150, 2, N'STAFF', N'DEPOSIT', N'You deposited PKR 15000000 to customer "Ali" (A/C BM022325146261).', 31, N'TRANSACTION', 1, CAST(N'2026-06-23T12:34:21.390' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (151, 1, N'ADMIN', N'DEPOSIT', N'💰 DEPOSIT: Alyan deposited PKR 15000000 to account BM022325146261 (Ali)', 31, N'TRANSACTION', 1, CAST(N'2026-06-23T12:34:21.440' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (152, 1, N'CUSTOMER', N'ACCOUNT_SUSPENDED', N'Your account has been suspended. Please contact support.', NULL, NULL, 1, CAST(N'2026-07-08T11:06:17.710' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (153, 1, N'CUSTOMER', N'ACCOUNT_REACTIVATED', N'Your account has been reactivated. Welcome back!', NULL, NULL, 1, CAST(N'2026-07-08T11:08:38.700' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (154, 1, N'CUSTOMER', N'ACCOUNT_UNFROZEN', N'Your SAVINGS account (BM102227970826) has been unfrozen and is now active.', 6, N'ACCOUNT', 0, CAST(N'2026-07-10T11:55:48.690' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (155, 1, N'ADMIN', N'ACCOUNT_UNFROZEN', N'Account BM102227970826 (Neha) has been unfrozen by Admin #1.', 6, N'ACCOUNT', 1, CAST(N'2026-07-10T11:55:48.710' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (156, 1, N'CUSTOMER', N'ACCOUNT_FROZEN', N'Your SAVINGS account (BM102227970826) has been frozen. Reason: test
. Please contact support.', 6, N'ACCOUNT', 0, CAST(N'2026-07-10T11:55:54.520' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (157, 1, N'ADMIN', N'ACCOUNT_FROZEN', N'Account BM102227970826 (Neha) has been frozen by Admin #1. Reason: test
', 6, N'ACCOUNT', 1, CAST(N'2026-07-10T11:55:54.533' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (158, 1, N'CUSTOMER', N'ACCOUNT_UNFROZEN', N'Your SAVINGS account (BM102227970826) has been unfrozen and is now active.', 6, N'ACCOUNT', 0, CAST(N'2026-07-10T11:56:05.463' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (159, 1, N'ADMIN', N'ACCOUNT_UNFROZEN', N'Account BM102227970826 (Neha) has been unfrozen by Admin #1.', 6, N'ACCOUNT', 1, CAST(N'2026-07-10T11:56:05.477' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (160, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 338,333.51 for installments #2, 3, 4, 57, 58, 59, 60 paid successfully.', 32, N'TRANSACTION', 1, CAST(N'2026-07-10T12:07:53.103' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (161, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 7 installments (balloon) of PKR 338,333.51.', 32, N'TRANSACTION', 1, CAST(N'2026-07-10T12:07:53.107' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (162, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 7 installments of PKR 338,333.51.', 32, N'TRANSACTION', 1, CAST(N'2026-07-10T12:07:53.127' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (163, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 8 installments (balloon) of PKR 386,666.64.', 33, N'TRANSACTION', 1, CAST(N'2026-07-10T12:08:10.960' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (164, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 386,666.64 for installments #46, 47, 51, 52, 53, 54, 55, 56 paid successfully.', 33, N'TRANSACTION', 1, CAST(N'2026-07-10T12:08:10.960' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (165, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 8 installments of PKR 386,666.64.', 33, N'TRANSACTION', 1, CAST(N'2026-07-10T12:08:10.963' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (166, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 1,981,666.53 for installments #5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45 paid successfully.', 34, N'TRANSACTION', 1, CAST(N'2026-07-10T12:08:59.140' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (167, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 41 installments (balloon) of PKR 1,981,666.53.', 34, N'TRANSACTION', 1, CAST(N'2026-07-10T12:08:59.140' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (168, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 41 installments of PKR 1,981,666.53.', 34, N'TRANSACTION', 1, CAST(N'2026-07-10T12:08:59.150' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (169, 2, N'CUSTOMER', N'LOAN_CLOSED', N'Congratulations! Your HOME loan has been fully repaid and is now closed.', 4, N'LOAN', 1, CAST(N'2026-07-10T12:09:12.287' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (170, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 144,999.99 for installments #48, 49, 50 paid successfully.', 35, N'TRANSACTION', 1, CAST(N'2026-07-10T12:09:12.297' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (171, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 3 installments (balloon) of PKR 144,999.99.', 35, N'TRANSACTION', 1, CAST(N'2026-07-10T12:09:12.300' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (172, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 3 installments of PKR 144,999.99.', 35, N'TRANSACTION', 1, CAST(N'2026-07-10T12:09:12.303' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (173, 2, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your CAR loan application of PKR 500000 has been submitted and is awaiting approval.', 6, N'LOAN', 1, CAST(N'2026-07-10T12:09:34.787' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (174, 2, N'STAFF', N'LOAN_APPLIED', N'Customer "Ali" applied for a CAR loan of PKR 500000. Awaiting your approval.', 6, N'LOAN', 1, CAST(N'2026-07-10T12:09:34.793' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (175, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Ali" applied for a CAR loan of PKR 500000.', 6, N'LOAN', 1, CAST(N'2026-07-10T12:09:34.810' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (176, 2, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your CAR loan has been reviewed by staff. Awaiting final admin approval.', 6, N'LOAN', 1, CAST(N'2026-07-10T12:09:51.307' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (177, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Ali" CAR loan approved by staff — awaiting your final approval.', 6, N'LOAN', 1, CAST(N'2026-07-10T12:09:51.310' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (178, 2, N'CUSTOMER', N'LOAN_APPROVED', N'Your CAR loan of PKR 500,000 has been approved and PKR 500,000 has been credited to your account. Monthly EMI: PKR 45,833.33 for 12 months. Total repayment: PKR 550,000 (includes PKR 50,000 interest at 10% per annum).', 6, N'LOAN', 1, CAST(N'2026-07-10T12:10:05.017' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (179, 2, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Ali" CAR loan fully approved. EMI: PKR 45,833.33 for 12 months.', 6, N'LOAN', 1, CAST(N'2026-07-10T12:10:05.020' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (180, 1, N'ADMIN', N'ACCOUNT_CLOSURE_REQUESTED', N'Customer "Ali" has requested closure of SAVINGS account BM883702484541.', 4, N'ACCOUNT', 1, CAST(N'2026-07-17T10:49:58.403' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (181, 2, N'CUSTOMER', N'ACCOUNT_CLOSED', N'Your SAVINGS account (BM883702484541) has been closed. PKR 18,790 has been transferred to your CURRENT account (BM022325146261).', 4, N'ACCOUNT', 1, CAST(N'2026-07-17T15:59:03.860' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (182, 2, N'CUSTOMER', N'ACCOUNT_FROZEN', N'Your CURRENT account (BM022325146261) has been frozen. Reason: do number ka paisa. Please contact support.', 5, N'ACCOUNT', 1, CAST(N'2026-07-22T10:38:47.723' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (183, 1, N'ADMIN', N'ACCOUNT_FROZEN', N'Account BM022325146261 (Ali) has been frozen by Admin #1. Reason: do number ka paisa', 5, N'ACCOUNT', 1, CAST(N'2026-07-22T10:38:47.737' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (184, 2, N'CUSTOMER', N'ACCOUNT_SUSPENDED', N'Your account has been suspended. Please contact support.', NULL, NULL, 1, CAST(N'2026-07-22T10:43:15.873' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (185, 2, N'CUSTOMER', N'ACCOUNT_REACTIVATED', N'Your account has been reactivated. Welcome back!', NULL, NULL, 1, CAST(N'2026-07-22T10:43:21.853' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (186, 2, N'CUSTOMER', N'ACCOUNT_UNFROZEN', N'Your CURRENT account (BM022325146261) has been unfrozen and is now active.', 5, N'ACCOUNT', 1, CAST(N'2026-07-22T11:02:11.113' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (187, 1, N'ADMIN', N'ACCOUNT_UNFROZEN', N'Account BM022325146261 (Ali) has been unfrozen by Admin #1.', 5, N'ACCOUNT', 1, CAST(N'2026-07-22T11:02:11.123' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (188, 2, N'CUSTOMER', N'LOAN_CLOSED', N'Congratulations! Your CAR loan has been fully repaid and is now closed.', 6, N'LOAN', 1, CAST(N'2026-07-22T11:02:35.747' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (189, 2, N'CUSTOMER', N'LOAN_REPAYMENT_PAID', N'Balloon payment of PKR 550,000 for installments #1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 paid successfully.', 39, N'TRANSACTION', 1, CAST(N'2026-07-22T11:02:35.780' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (190, 2, N'STAFF', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 12 installments (balloon) of PKR 550,000.', 39, N'TRANSACTION', 1, CAST(N'2026-07-22T11:02:35.780' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (191, 1, N'ADMIN', N'LOAN_REPAYMENT_PAID', N'Customer "Ali" paid 12 installments of PKR 550,000.', 39, N'TRANSACTION', 1, CAST(N'2026-07-22T11:02:35.790' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (192, 2, N'CUSTOMER', N'LOAN_SUBMITTED', N'Your CAR loan application of PKR 550,000 has been submitted and is awaiting approval.', 7, N'LOAN', 1, CAST(N'2026-07-22T11:03:07.600' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (193, 2, N'STAFF', N'LOAN_APPLIED', N'Customer "Ali" applied for a CAR loan of PKR 550,000. Awaiting your approval.', 7, N'LOAN', 1, CAST(N'2026-07-22T11:03:07.603' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (194, 1, N'ADMIN', N'LOAN_APPLIED', N'Customer "Ali" applied for a CAR loan of PKR 550,000.', 7, N'LOAN', 1, CAST(N'2026-07-22T11:03:07.617' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (195, 2, N'CUSTOMER', N'LOAN_STAFF_APPROVED', N'Your CAR loan has been reviewed by staff. Awaiting final admin approval.', 7, N'LOAN', 1, CAST(N'2026-07-22T11:04:12.350' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (196, 1, N'ADMIN', N'LOAN_AWAITING_ADMIN_APPROVAL', N'Customer "Ali" CAR loan approved by staff — awaiting your final approval.', 7, N'LOAN', 1, CAST(N'2026-07-22T11:04:12.357' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (197, 2, N'CUSTOMER', N'LOAN_APPROVED', N'Your CAR loan of PKR 550,000 has been approved and PKR 550,000 has been credited to your account. Monthly EMI: PKR 50,416.67 for 12 months. Total repayment: PKR 605,000 (includes PKR 55,000 interest at 10% per annum).', 7, N'LOAN', 1, CAST(N'2026-07-22T11:04:24.730' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (198, 2, N'STAFF', N'LOAN_FULLY_APPROVED', N'Customer "Ali" CAR loan fully approved. EMI: PKR 50,416.67 for 12 months.', 7, N'LOAN', 1, CAST(N'2026-07-22T11:04:24.733' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (199, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 60,000 from account BM022325146261 (Ali). Reasons: Rapid transactions: 17 transactions in last 60 minutes | Suspicious activity: 17 withdrawals/transfers in last 30 minutes', 58, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:33.073' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (200, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 60000 has been withdrawn from your account (A/C BM022325146261).', 58, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:33.083' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (201, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 60000 from account BM022325146261.', 58, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:33.090' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (202, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 60000 from account BM022325146261.', 58, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:33.100' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (203, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 700,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 700,000 exceeds PKR 500,000 threshold | Rapid transactions: 18 transactions in last 60 minutes | Suspicious activity: 18 withdrawals/transfers in last 30 minutes', 59, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:43.383' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (204, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 700000 has been withdrawn from your account (A/C BM022325146261).', 59, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:43.390' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (205, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 700000 from account BM022325146261.', 59, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:43.397' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (206, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 700000 from account BM022325146261.', 59, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:43.407' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (207, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 800,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 800,000 exceeds PKR 500,000 threshold | Rapid transactions: 19 transactions in last 60 minutes | Suspicious activity: 19 withdrawals/transfers in last 30 minutes', 60, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:52.810' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (208, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 800000 has been withdrawn from your account (A/C BM022325146261).', 60, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:52.817' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (209, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 800000 from account BM022325146261.', 60, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:52.820' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (210, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 800000 from account BM022325146261.', 60, N'TRANSACTION', 1, CAST(N'2026-07-23T12:37:52.830' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (211, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 700,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 700,000 exceeds PKR 500,000 threshold | Rapid transactions: 20 transactions in last 60 minutes | Suspicious activity: 20 withdrawals/transfers in last 30 minutes', 61, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:11.740' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (212, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 700,000 has been withdrawn from your account (A/C BM022325146261).', 61, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:11.750' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (213, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 700,000 from account BM022325146261.', 61, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:11.757' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (214, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 700,000 from account BM022325146261.', 61, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:11.763' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (215, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 800,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 800,000 exceeds PKR 500,000 threshold | Rapid transactions: 21 transactions in last 60 minutes | Suspicious activity: 21 withdrawals/transfers in last 30 minutes', 62, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:19.710' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (216, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 800,000 has been withdrawn from your account (A/C BM022325146261).', 62, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:19.713' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (217, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 800,000 from account BM022325146261.', 62, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:19.720' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (218, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 800,000 from account BM022325146261.', 62, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:19.727' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (219, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 900,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 900,000 exceeds PKR 500,000 threshold | Rapid transactions: 22 transactions in last 60 minutes | Suspicious activity: 22 withdrawals/transfers in last 30 minutes', 63, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:29.723' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (220, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 900,000 has been withdrawn from your account (A/C BM022325146261).', 63, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:29.727' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (221, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 900,000 from account BM022325146261.', 63, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:29.730' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (222, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 900,000 from account BM022325146261.', 63, N'TRANSACTION', 1, CAST(N'2026-07-23T12:48:29.737' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (223, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 900,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 900,000 exceeds PKR 500,000 threshold', 64, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:47.620' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (224, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 900,000 has been withdrawn from your account (A/C BM022325146261).', 64, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:47.640' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (225, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 900,000 from account BM022325146261.', 64, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:47.650' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (226, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 900,000 from account BM022325146261.', 64, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:47.667' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (227, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 800,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 800,000 exceeds PKR 500,000 threshold', 65, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:58.113' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (228, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 800,000 has been withdrawn from your account (A/C BM022325146261).', 65, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:58.120' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (229, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 800,000 from account BM022325146261.', 65, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:58.123' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (230, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 800,000 from account BM022325146261.', 65, N'TRANSACTION', 1, CAST(N'2026-07-27T12:10:58.130' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (231, 1, N'ADMIN', N'FRAUD_FLAGGED', N'🚨 FRAUD FLAG: Withdrawal of PKR 700,000 from account BM022325146261 (Ali). Reasons: Large transaction: PKR 700,000 exceeds PKR 500,000 threshold', 66, N'TRANSACTION', 1, CAST(N'2026-07-27T12:11:08.950' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (232, 2, N'CUSTOMER', N'WITHDRAWAL', N'PKR 700,000 has been withdrawn from your account (A/C BM022325146261).', 66, N'TRANSACTION', 1, CAST(N'2026-07-27T12:11:08.960' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (233, 2, N'STAFF', N'WITHDRAWAL', N'Customer "Ali" withdrew PKR 700,000 from account BM022325146261.', 66, N'TRANSACTION', 1, CAST(N'2026-07-27T12:11:08.967' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (234, 1, N'ADMIN', N'WITHDRAWAL', N'🏧 WITHDRAWAL: "Ali" withdrew PKR 700,000 from account BM022325146261.', 66, N'TRANSACTION', 1, CAST(N'2026-07-27T12:11:08.977' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (235, 2, N'CUSTOMER', N'FRAUD_CLEARED', N'A recent transaction flagged for review has been cleared — no action needed.', NULL, NULL, 1, CAST(N'2026-07-27T13:03:28.327' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (236, 2, N'CUSTOMER', N'FRAUD_BLOCKED', N'Account BM022325146261 has been frozen due to suspicious activity. Please contact support.', NULL, NULL, 1, CAST(N'2026-07-27T14:26:20.037' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (237, 2, N'CUSTOMER', N'FRAUD_BLOCKED', N'Account BM022325146261 has been frozen due to suspicious activity. Please contact support.', NULL, NULL, 1, CAST(N'2026-07-27T14:26:34.010' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (238, 2, N'CUSTOMER', N'ACCOUNT_UNFROZEN', N'Your CURRENT account (BM022325146261) has been unfrozen and is now active.', 5, N'ACCOUNT', 1, CAST(N'2026-07-27T14:26:38.887' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (239, 1, N'ADMIN', N'ACCOUNT_UNFROZEN', N'Account BM022325146261 (Ali) has been unfrozen by Admin #1.', 5, N'ACCOUNT', 1, CAST(N'2026-07-27T14:26:38.900' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (240, 1, N'ADMIN', N'NEW_TICKET', N'New support ticket from Ali: "Loan Approval"', 1, N'TICKET', 1, CAST(N'2026-07-27T15:17:38.467' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (241, 2, N'STAFF', N'TICKET_ASSIGNED', N'You''ve been assigned ticket #1: "Loan Approval"', 1, N'TICKET', 1, CAST(N'2026-07-27T15:18:31.363' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (242, 2, N'CUSTOMER', N'TICKET_REPLY', N'Support replied to your ticket: "Loan Approval"', 1, N'TICKET', 1, CAST(N'2026-07-27T15:18:36.700' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (243, 2, N'CUSTOMER', N'TICKET_REPLY', N'Support replied to your ticket: "Loan Approval"', 1, N'TICKET', 1, CAST(N'2026-07-27T16:58:02.817' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (244, 1, N'ADMIN', N'NEW_TICKET', N'New support ticket from Ali: "my account blocking"', 3, N'TICKET', 1, CAST(N'2026-07-28T10:36:54.763' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (245, 2, N'STAFF', N'TICKET_ASSIGNED', N'You''ve been assigned ticket #3: "my account blocking"', 3, N'TICKET', 1, CAST(N'2026-07-28T10:50:25.687' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (246, 2, N'CUSTOMER', N'TICKET_REPLY', N'Support replied to your ticket: "my account blocking"', 3, N'TICKET', 1, CAST(N'2026-07-28T10:50:31.787' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (247, 2, N'CUSTOMER', N'TICKET_RESOLVED', N'Your ticket "my account blocking" has been marked resolved.', 3, N'TICKET', 1, CAST(N'2026-07-28T11:01:04.880' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (248, 3, N'CUSTOMER', N'ACCOUNT_SUSPENDED', N'Your account has been suspended. Please contact support.', NULL, NULL, 0, CAST(N'2026-07-28T11:04:07.233' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (249, 3, N'CUSTOMER', N'ACCOUNT_REACTIVATED', N'Your account has been reactivated. Welcome back!', NULL, NULL, 0, CAST(N'2026-07-28T11:04:08.300' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (250, 2, N'STAFF', N'LOAN_POLICY_UPDATED', N'Loan policy #2 has been updated.', 2, N'LOAN_POLICY', 1, CAST(N'2026-07-28T11:04:30.810' AS DateTime))
GO
INSERT [dbo].[Notifications] ([notification_id], [recipient_id], [recipient_type], [type], [message], [related_id], [related_type], [is_read], [created_at]) VALUES (251, 3, N'STAFF', N'LOAN_POLICY_UPDATED', N'Loan policy #2 has been updated.', 2, N'LOAN_POLICY', 0, CAST(N'2026-07-28T11:04:30.813' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Notifications] OFF
GO
SET IDENTITY_INSERT [dbo].[OTP_Tokens] ON 
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (1, 1, N'ADMIN', N'704800', N'LOGIN', CAST(N'2026-05-12T07:41:41.857' AS DateTime), 1, CAST(N'2026-05-12T12:36:41.883' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (2, 1, N'ADMIN', N'357470', N'LOGIN', CAST(N'2026-05-12T09:07:14.727' AS DateTime), 1, CAST(N'2026-05-12T14:02:14.817' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (3, 1, N'ADMIN', N'279751', N'LOGIN', CAST(N'2026-05-12T09:07:30.907' AS DateTime), 1, CAST(N'2026-05-12T14:02:30.927' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (4, 2, N'STAFF', N'858946', N'LOGIN', CAST(N'2026-05-13T04:37:51.793' AS DateTime), 1, CAST(N'2026-05-13T09:32:51.813' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (5, 2, N'STAFF', N'701308', N'LOGIN', CAST(N'2026-05-13T06:22:36.260' AS DateTime), 1, CAST(N'2026-05-13T11:17:36.277' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (6, 1, N'CUSTOMER', N'603872', N'LOGIN', CAST(N'2026-05-13T07:50:40.657' AS DateTime), 1, CAST(N'2026-05-13T12:45:40.683' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (7, 1, N'ADMIN', N'663222', N'LOGIN', CAST(N'2026-05-13T09:58:24.917' AS DateTime), 1, CAST(N'2026-05-13T14:53:24.940' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (8, 2, N'CUSTOMER', N'121152', N'LOGIN', CAST(N'2026-05-13T09:59:17.353' AS DateTime), 1, CAST(N'2026-05-13T14:54:17.367' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (9, 3, N'STAFF', N'476489', N'LOGIN', CAST(N'2026-05-13T10:04:07.950' AS DateTime), 1, CAST(N'2026-05-13T14:59:07.970' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (10, 3, N'STAFF', N'434243', N'LOGIN', CAST(N'2026-05-13T10:28:49.663' AS DateTime), 1, CAST(N'2026-05-13T15:23:49.680' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (11, 3, N'CUSTOMER', N'528115', N'LOGIN', CAST(N'2026-05-13T12:40:09.253' AS DateTime), 1, CAST(N'2026-05-13T17:35:09.270' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (12, 3, N'STAFF', N'569238', N'LOGIN', CAST(N'2026-05-14T04:24:20.887' AS DateTime), 1, CAST(N'2026-05-14T09:19:20.917' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (13, 1, N'ADMIN', N'378051', N'LOGIN', CAST(N'2026-05-15T09:26:57.863' AS DateTime), 1, CAST(N'2026-05-15T14:21:57.940' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (14, 2, N'STAFF', N'537545', N'LOGIN', CAST(N'2026-05-15T09:27:53.433' AS DateTime), 1, CAST(N'2026-05-15T14:22:53.450' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (15, 2, N'CUSTOMER', N'109892', N'LOGIN', CAST(N'2026-05-15T09:28:23.937' AS DateTime), 1, CAST(N'2026-05-15T14:23:23.947' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (16, 1, N'ADMIN', N'137143', N'LOGIN', CAST(N'2026-05-25T06:59:26.403' AS DateTime), 1, CAST(N'2026-05-25T11:54:26.433' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (17, 2, N'STAFF', N'885764', N'LOGIN', CAST(N'2026-05-25T07:00:47.440' AS DateTime), 1, CAST(N'2026-05-25T11:55:47.447' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (18, 2, N'CUSTOMER', N'709265', N'LOGIN', CAST(N'2026-05-25T07:02:45.780' AS DateTime), 1, CAST(N'2026-05-25T11:57:45.793' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (19, 2, N'STAFF', N'233508', N'LOGIN', CAST(N'2026-05-31T09:32:25.200' AS DateTime), 1, CAST(N'2026-05-31T14:27:25.533' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (20, 1, N'ADMIN', N'857035', N'LOGIN', CAST(N'2026-05-31T09:33:11.287' AS DateTime), 1, CAST(N'2026-05-31T14:28:11.437' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (21, 3, N'CUSTOMER', N'525690', N'LOGIN', CAST(N'2026-05-31T09:34:14.047' AS DateTime), 1, CAST(N'2026-05-31T14:29:14.060' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (22, 1, N'ADMIN', N'927099', N'LOGIN', CAST(N'2026-05-31T09:53:20.510' AS DateTime), 1, CAST(N'2026-05-31T14:48:20.520' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (23, 2, N'STAFF', N'756002', N'LOGIN', CAST(N'2026-05-31T09:55:05.313' AS DateTime), 1, CAST(N'2026-05-31T14:50:05.327' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (24, 3, N'CUSTOMER', N'931602', N'LOGIN', CAST(N'2026-05-31T09:55:46.693' AS DateTime), 1, CAST(N'2026-05-31T14:50:46.707' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (25, 2, N'CUSTOMER', N'700469', N'LOGIN', CAST(N'2026-05-31T10:13:58.350' AS DateTime), 1, CAST(N'2026-05-31T15:08:58.370' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (26, 2, N'CUSTOMER', N'661808', N'LOGIN', CAST(N'2026-05-31T10:17:43.463' AS DateTime), 1, CAST(N'2026-05-31T15:12:43.483' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (27, 2, N'STAFF', N'605292', N'LOGIN', CAST(N'2026-05-31T10:18:27.907' AS DateTime), 1, CAST(N'2026-05-31T15:13:27.923' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (28, 3, N'STAFF', N'256241', N'LOGIN', CAST(N'2026-05-31T10:31:42.827' AS DateTime), 1, CAST(N'2026-05-31T15:26:42.840' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (29, 2, N'STAFF', N'998679', N'LOGIN', CAST(N'2026-05-31T10:33:01.477' AS DateTime), 1, CAST(N'2026-05-31T15:28:01.487' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (30, 1, N'ADMIN', N'863543', N'LOGIN', CAST(N'2026-06-02T10:58:48.157' AS DateTime), 1, CAST(N'2026-06-02T15:53:48.217' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (31, 2, N'STAFF', N'676853', N'LOGIN', CAST(N'2026-06-02T11:04:01.370' AS DateTime), 1, CAST(N'2026-06-02T15:59:01.373' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (32, 2, N'CUSTOMER', N'528849', N'LOGIN', CAST(N'2026-06-02T11:05:21.333' AS DateTime), 1, CAST(N'2026-06-02T16:00:21.340' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (33, 1, N'ADMIN', N'296143', N'LOGIN', CAST(N'2026-06-05T10:01:57.333' AS DateTime), 1, CAST(N'2026-06-05T14:56:57.363' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (34, 2, N'STAFF', N'538447', N'LOGIN', CAST(N'2026-06-05T10:05:56.710' AS DateTime), 1, CAST(N'2026-06-05T15:00:56.730' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (35, 1, N'ADMIN', N'459957', N'LOGIN', CAST(N'2026-06-09T15:14:01.763' AS DateTime), 1, CAST(N'2026-06-09T20:09:01.797' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (36, 2, N'STAFF', N'884881', N'LOGIN', CAST(N'2026-06-09T15:22:42.780' AS DateTime), 1, CAST(N'2026-06-09T20:17:42.790' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (37, 2, N'CUSTOMER', N'813880', N'LOGIN', CAST(N'2026-06-09T15:23:25.630' AS DateTime), 1, CAST(N'2026-06-09T20:18:25.633' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (38, 1, N'CUSTOMER', N'736524', N'LOGIN', CAST(N'2026-06-09T16:29:14.087' AS DateTime), 1, CAST(N'2026-06-09T21:24:14.097' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (39, 1, N'ADMIN', N'242785', N'LOGIN', CAST(N'2026-06-10T05:15:44.077' AS DateTime), 1, CAST(N'2026-06-10T10:10:44.087' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (40, 2, N'STAFF', N'463339', N'LOGIN', CAST(N'2026-06-10T05:22:33.063' AS DateTime), 1, CAST(N'2026-06-10T10:17:33.077' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (41, 3, N'CUSTOMER', N'641738', N'LOGIN', CAST(N'2026-06-10T06:06:50.277' AS DateTime), 1, CAST(N'2026-06-10T11:01:50.293' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (42, 3, N'STAFF', N'150392', N'LOGIN', CAST(N'2026-06-10T06:08:10.490' AS DateTime), 1, CAST(N'2026-06-10T11:03:10.500' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (43, 1, N'ADMIN', N'163521', N'LOGIN', CAST(N'2026-06-17T05:29:48.273' AS DateTime), 1, CAST(N'2026-06-17T10:24:48.323' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (44, 2, N'STAFF', N'647428', N'LOGIN', CAST(N'2026-06-17T05:30:45.153' AS DateTime), 1, CAST(N'2026-06-17T10:25:45.170' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (45, 2, N'CUSTOMER', N'646177', N'LOGIN', CAST(N'2026-06-17T05:31:17.127' AS DateTime), 1, CAST(N'2026-06-17T10:26:17.140' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (46, 1, N'CUSTOMER', N'980324', N'LOGIN', CAST(N'2026-06-17T07:58:33.083' AS DateTime), 1, CAST(N'2026-06-17T12:53:33.093' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (47, 2, N'CUSTOMER', N'885904', N'LOGIN', CAST(N'2026-06-23T07:37:20.763' AS DateTime), 1, CAST(N'2026-06-23T12:32:20.817' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (48, 2, N'STAFF', N'222832', N'LOGIN', CAST(N'2026-06-23T07:38:18.597' AS DateTime), 1, CAST(N'2026-06-23T12:33:18.613' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (49, 1, N'ADMIN', N'922306', N'LOGIN', CAST(N'2026-06-23T07:40:03.160' AS DateTime), 1, CAST(N'2026-06-23T12:35:03.187' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (50, 1, N'ADMIN', N'342004', N'LOGIN', CAST(N'2026-06-23T09:53:15.173' AS DateTime), 1, CAST(N'2026-06-23T14:48:15.317' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (51, 1, N'ADMIN', N'877968', N'LOGIN', CAST(N'2026-07-08T06:08:21.310' AS DateTime), 1, CAST(N'2026-07-08T11:03:21.370' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (52, 2, N'STAFF', N'995732', N'LOGIN', CAST(N'2026-07-08T06:09:18.410' AS DateTime), 1, CAST(N'2026-07-08T11:04:18.423' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (53, 1, N'CUSTOMER', N'676084', N'LOGIN', CAST(N'2026-07-08T06:13:40.877' AS DateTime), 1, CAST(N'2026-07-08T11:08:40.890' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (54, 1, N'ADMIN', N'590256', N'LOGIN', CAST(N'2026-07-09T10:28:38.457' AS DateTime), 1, CAST(N'2026-07-09T15:23:38.500' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (55, 2, N'STAFF', N'643772', N'LOGIN', CAST(N'2026-07-10T07:10:46.100' AS DateTime), 1, CAST(N'2026-07-10T12:05:46.120' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (56, 2, N'CUSTOMER', N'370831', N'LOGIN', CAST(N'2026-07-10T07:11:37.557' AS DateTime), 1, CAST(N'2026-07-10T12:06:37.570' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (57, 1, N'ADMIN', N'598675', N'LOGIN', CAST(N'2026-07-17T05:47:54.997' AS DateTime), 1, CAST(N'2026-07-17T10:42:55.017' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (58, 2, N'CUSTOMER', N'527912', N'LOGIN', CAST(N'2026-07-17T05:49:05.877' AS DateTime), 1, CAST(N'2026-07-17T10:44:05.883' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (59, 2, N'CUSTOMER', N'868307', N'LOGIN', CAST(N'2026-07-21T08:07:44.877' AS DateTime), 1, CAST(N'2026-07-21T13:02:44.923' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (60, 1, N'ADMIN', N'972941', N'LOGIN', CAST(N'2026-07-22T05:42:57.587' AS DateTime), 1, CAST(N'2026-07-22T10:37:57.600' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (61, 2, N'CUSTOMER', N'185933', N'LOGIN', CAST(N'2026-07-22T06:06:34.273' AS DateTime), 1, CAST(N'2026-07-22T11:01:34.290' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (62, 2, N'STAFF', N'797146', N'LOGIN', CAST(N'2026-07-22T06:08:36.763' AS DateTime), 1, CAST(N'2026-07-22T11:03:36.773' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (63, 1, N'ADMIN', N'940718', N'LOGIN', CAST(N'2026-07-23T07:35:24.000' AS DateTime), 1, CAST(N'2026-07-23T12:30:24.027' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (64, 2, N'STAFF', N'564187', N'LOGIN', CAST(N'2026-07-23T07:36:04.950' AS DateTime), 1, CAST(N'2026-07-23T12:31:04.960' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (65, 2, N'CUSTOMER', N'790128', N'LOGIN', CAST(N'2026-07-23T07:36:45.943' AS DateTime), 1, CAST(N'2026-07-23T12:31:45.950' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (66, 1, N'ADMIN', N'236685', N'LOGIN', CAST(N'2026-07-27T06:50:39.973' AS DateTime), 1, CAST(N'2026-07-27T11:45:40.003' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (67, 2, N'STAFF', N'641195', N'LOGIN', CAST(N'2026-07-27T06:51:30.467' AS DateTime), 1, CAST(N'2026-07-27T11:46:30.483' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (68, 2, N'CUSTOMER', N'580205', N'LOGIN', CAST(N'2026-07-27T06:52:30.090' AS DateTime), 1, CAST(N'2026-07-27T11:47:30.100' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (69, 2, N'CUSTOMER', N'196392', N'LOGIN', CAST(N'2026-07-27T07:15:06.383' AS DateTime), 1, CAST(N'2026-07-27T12:10:06.400' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (70, 2, N'CUSTOMER', N'905705', N'LOGIN', CAST(N'2026-07-31T07:08:15.017' AS DateTime), 1, CAST(N'2026-07-31T12:03:15.053' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (71, 2, N'CUSTOMER', N'241719', N'LOGIN', CAST(N'2026-08-02T10:53:03.827' AS DateTime), 1, CAST(N'2026-08-02T15:48:03.867' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (72, 2, N'CUSTOMER', N'822063', N'LOGIN', CAST(N'2026-09-02T07:41:24.443' AS DateTime), 1, CAST(N'2026-09-02T12:36:24.467' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (73, 2, N'STAFF', N'524883', N'LOGIN', CAST(N'2026-09-02T07:44:05.080' AS DateTime), 1, CAST(N'2026-09-02T12:39:05.087' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (74, 1, N'ADMIN', N'862330', N'LOGIN', CAST(N'2026-09-02T07:44:53.657' AS DateTime), 1, CAST(N'2026-09-02T12:39:53.667' AS DateTime))
GO
INSERT [dbo].[OTP_Tokens] ([otp_id], [entity_id], [entity_type], [otp_code], [purpose], [expires_at], [is_used], [created_at]) VALUES (75, 1, N'ADMIN', N'400968', N'LOGIN', CAST(N'2026-09-02T07:45:44.407' AS DateTime), 1, CAST(N'2026-09-02T12:40:44.417' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[OTP_Tokens] OFF
GO
SET IDENTITY_INSERT [dbo].[Support_Tickets] ON 
GO
INSERT [dbo].[Support_Tickets] ([ticket_id], [customer_id], [assigned_to], [subject], [description], [category], [status], [priority], [created_at], [resolved_at]) VALUES (1, 2, 2, N'Loan Approval', N'please approve my loan quickly', N'GENERAL', N'CLOSED', N'HIGH', CAST(N'2026-07-27T15:17:38.443' AS DateTime), NULL)
GO
INSERT [dbo].[Support_Tickets] ([ticket_id], [customer_id], [assigned_to], [subject], [description], [category], [status], [priority], [created_at], [resolved_at]) VALUES (3, 2, 2, N'my account blocking', N'why are u blocking my accont frequently please check ', N'ACCOUNT', N'RESOLVED', N'HIGH', CAST(N'2026-07-28T10:36:54.747' AS DateTime), CAST(N'2026-07-28T06:01:04.850' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Support_Tickets] OFF
GO
SET IDENTITY_INSERT [dbo].[Ticket_Replies] ON 
GO
INSERT [dbo].[Ticket_Replies] ([reply_id], [ticket_id], [sender_id], [sender_type], [message], [created_at]) VALUES (1, 1, 1, N'ADMIN', N'jaldi kro', CAST(N'2026-07-27T15:18:36.693' AS DateTime))
GO
INSERT [dbo].[Ticket_Replies] ([reply_id], [ticket_id], [sender_id], [sender_type], [message], [created_at]) VALUES (2, 1, 2, N'STAFF', N'done', CAST(N'2026-07-27T16:58:02.807' AS DateTime))
GO
INSERT [dbo].[Ticket_Replies] ([reply_id], [ticket_id], [sender_id], [sender_type], [message], [created_at]) VALUES (3, 3, 1, N'ADMIN', N'check now', CAST(N'2026-07-28T10:50:31.773' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Ticket_Replies] OFF
GO
SET IDENTITY_INSERT [dbo].[Transactions] ON 
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (1, NULL, 3, N'DEPOSIT', CAST(10000.00 AS Decimal(15, 2)), N'COMPLETED', N'Deposit of PKR 10000 by Ammad to Haziq (A/C BM873211507415)', 0, CAST(N'2026-05-14T10:07:57.640' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (2, 3, NULL, N'WITHDRAWAL', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'Withdrawal of PKR 100 by Haziq from account BM873211507415', 0, CAST(N'2026-05-14T11:19:53.187' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (3, 3, NULL, N'WITHDRAWAL', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'Withdrawal of PKR 100 by Haziq from account BM873211507415', 0, CAST(N'2026-05-14T11:19:55.550' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (4, 3, NULL, N'WITHDRAWAL', CAST(1000.00 AS Decimal(15, 2)), N'COMPLETED', N'Withdrawal of PKR 1000 by Haziq from account BM873211507415', 0, CAST(N'2026-05-14T11:20:39.380' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (5, 3, NULL, N'WITHDRAWAL', CAST(1000.00 AS Decimal(15, 2)), N'COMPLETED', N'check2', 0, CAST(N'2026-05-14T11:28:16.513' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (6, 3, NULL, N'WITHDRAWAL', CAST(1000.00 AS Decimal(15, 2)), N'COMPLETED', N'check3', 0, CAST(N'2026-05-14T12:20:26.397' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (7, 3, NULL, N'WITHDRAWAL', CAST(1000.00 AS Decimal(15, 2)), N'COMPLETED', N'check4', 0, CAST(N'2026-05-14T12:22:36.243' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (8, 3, NULL, N'WITHDRAWAL', CAST(1000.00 AS Decimal(15, 2)), N'COMPLETED', N'check5', 0, CAST(N'2026-05-14T12:24:11.520' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (9, 3, NULL, N'WITHDRAWAL', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'check 6', 0, CAST(N'2026-05-14T14:47:15.760' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (10, NULL, 3, N'DEPOSIT', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'Cash Deposit', 0, CAST(N'2026-05-14T15:00:51.183' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (11, 3, NULL, N'WITHDRAWAL', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'test', 0, CAST(N'2026-05-14T15:06:11.080' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (12, NULL, 3, N'DEPOSIT', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'Cash Deposit', 0, CAST(N'2026-05-14T15:06:50.330' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (13, NULL, 4, N'DEPOSIT', CAST(30000.00 AS Decimal(15, 2)), N'COMPLETED', N'Cash Deposit', 0, CAST(N'2026-05-15T14:25:05.383' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (14, 4, NULL, N'WITHDRAWAL', CAST(1200.00 AS Decimal(15, 2)), N'COMPLETED', N'hello check', 0, CAST(N'2026-05-15T14:42:22.357' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (15, 4, 3, N'TRANSFER', CAST(10000.00 AS Decimal(15, 2)), N'COMPLETED', N'Salary', 0, CAST(N'2026-05-15T14:55:32.140' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (16, NULL, 4, N'DEPOSIT', CAST(90.00 AS Decimal(15, 2)), N'COMPLETED', N'Deposit of PKR 90 by Alyan to Ali (A/C BM883702484541)', 0, CAST(N'2026-05-25T12:09:40.297' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (17, 4, NULL, N'WITHDRAWAL', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'fees', 0, CAST(N'2026-05-31T15:09:36.800' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (18, NULL, 5, N'DEPOSIT', CAST(90000.00 AS Decimal(15, 2)), N'COMPLETED', N'cash deposit', 0, CAST(N'2026-05-31T15:30:26.550' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (19, NULL, 5, N'DEPOSIT', CAST(900.00 AS Decimal(15, 2)), N'COMPLETED', N'deposit', 0, CAST(N'2026-06-02T17:40:45.417' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (20, NULL, 5, N'DEPOSIT', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'cash deposit', 0, CAST(N'2026-06-05T15:01:57.560' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (21, NULL, 6, N'DEPOSIT', CAST(80000.00 AS Decimal(15, 2)), N'COMPLETED', N'cash deposit', 0, CAST(N'2026-06-09T21:25:47.383' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (22, 6, NULL, N'LOAN_REPAYMENT', CAST(41666.67 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #1 for loan #2 (single payment)', 0, CAST(N'2026-06-10T10:08:26.137' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (23, 5, NULL, N'LOAN_REPAYMENT', CAST(88888.88 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #1, 2, 3, 5, 6, 7, 8, 9 for loan #1 (balloon payment)', 0, CAST(N'2026-06-17T10:30:12.090' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (24, 5, NULL, N'LOAN_REPAYMENT', CAST(11111.11 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #4 for loan #1 (single payment)', 0, CAST(N'2026-06-17T10:30:17.430' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (25, 5, NULL, N'LOAN_REPAYMENT', CAST(48333.33 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #1 for loan #4 (single payment)', 0, CAST(N'2026-06-17T10:32:57.167' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (26, 5, NULL, N'WITHDRAWAL', CAST(800.00 AS Decimal(15, 2)), N'COMPLETED', N'check', 0, CAST(N'2026-06-17T12:11:20.350' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (27, 5, NULL, N'WITHDRAWAL', CAST(100.00 AS Decimal(15, 2)), N'COMPLETED', N'check', 0, CAST(N'2026-06-17T12:17:20.983' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (28, 5, NULL, N'WITHDRAWAL', CAST(90.00 AS Decimal(15, 2)), N'COMPLETED', N'hahaha', 0, CAST(N'2026-06-17T12:47:41.567' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (29, NULL, 6, N'DEPOSIT', CAST(600000.00 AS Decimal(15, 2)), N'COMPLETED', N'loan ', 0, CAST(N'2026-06-17T12:54:24.690' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (30, 6, NULL, N'LOAN_REPAYMENT', CAST(458333.33 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 for loan #2 (balloon payment)', 0, CAST(N'2026-06-17T12:54:43.917' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (31, NULL, 5, N'DEPOSIT', CAST(15000000.00 AS Decimal(15, 2)), N'COMPLETED', N'jaidad lelo', 0, CAST(N'2026-06-23T12:34:21.340' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (32, 5, NULL, N'LOAN_REPAYMENT', CAST(338333.51 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #2, 3, 4, 57, 58, 59, 60 for loan #4 (balloon payment)', 0, CAST(N'2026-07-10T12:07:53.040' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (33, 5, NULL, N'LOAN_REPAYMENT', CAST(386666.64 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #46, 47, 51, 52, 53, 54, 55, 56 for loan #4 (balloon payment)', 0, CAST(N'2026-07-10T12:08:10.940' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (34, 5, NULL, N'LOAN_REPAYMENT', CAST(1981666.53 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45 for loan #4 (balloon payment)', 0, CAST(N'2026-07-10T12:08:59.040' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (35, 5, NULL, N'LOAN_REPAYMENT', CAST(144999.99 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #48, 49, 50 for loan #4 (balloon payment)', 0, CAST(N'2026-07-10T12:09:12.270' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (36, NULL, 5, N'DEPOSIT', CAST(500000.00 AS Decimal(15, 2)), N'COMPLETED', N'Loan disbursement — CAR loan #6 approved and credited', 0, CAST(N'2026-07-10T12:10:04.960' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (38, 4, 5, N'INTERNAL_TRANSFER', CAST(18790.00 AS Decimal(15, 2)), N'COMPLETED', N'Account closure — balance transferred to alternate account', 0, CAST(N'2026-07-17T15:59:03.827' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (39, 5, NULL, N'LOAN_REPAYMENT', CAST(550000.00 AS Decimal(15, 2)), N'COMPLETED', N'Loan repayment - Installment(s) #1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 for loan #6 (balloon payment)', 0, CAST(N'2026-07-22T11:02:35.693' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (40, NULL, 5, N'DEPOSIT', CAST(550000.00 AS Decimal(15, 2)), N'COMPLETED', N'Loan disbursement — CAR loan #7 approved and credited', 0, CAST(N'2026-07-22T11:04:24.673' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (41, 5, NULL, N'WITHDRAWAL', CAST(600000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:32:28.957' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (42, 5, NULL, N'WITHDRAWAL', CAST(600000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:32:30.737' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (43, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 0, CAST(N'2026-07-23T12:32:39.773' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (44, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:28.587' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (45, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:29.403' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (46, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:29.540' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (47, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:29.700' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (48, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:29.850' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (49, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:29.997' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (50, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:30.170' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (51, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:30.350' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (52, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:30.480' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (53, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:30.653' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (54, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:30.803' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (55, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:30.940' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (56, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:31.147' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (57, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:35:31.280' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (58, 5, NULL, N'WITHDRAWAL', CAST(60000.00 AS Decimal(15, 2)), N'COMPLETED', N'check fraud1', 1, CAST(N'2026-07-23T12:37:33.053' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (59, 5, NULL, N'WITHDRAWAL', CAST(700000.00 AS Decimal(15, 2)), N'COMPLETED', N'fraud2', 1, CAST(N'2026-07-23T12:37:43.370' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (60, 5, NULL, N'WITHDRAWAL', CAST(800000.00 AS Decimal(15, 2)), N'COMPLETED', N'fraud3', 1, CAST(N'2026-07-23T12:37:52.793' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (61, 5, NULL, N'WITHDRAWAL', CAST(700000.00 AS Decimal(15, 2)), N'COMPLETED', N'fraud4', 1, CAST(N'2026-07-23T12:48:11.710' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (62, 5, NULL, N'WITHDRAWAL', CAST(800000.00 AS Decimal(15, 2)), N'COMPLETED', N'fraud5', 1, CAST(N'2026-07-23T12:48:19.677' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (63, 5, NULL, N'WITHDRAWAL', CAST(900000.00 AS Decimal(15, 2)), N'COMPLETED', N'fraud6', 1, CAST(N'2026-07-23T12:48:29.710' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (64, 5, NULL, N'WITHDRAWAL', CAST(900000.00 AS Decimal(15, 2)), N'COMPLETED', N'checkfraud0', 1, CAST(N'2026-07-27T12:10:47.557' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (65, 5, NULL, N'WITHDRAWAL', CAST(800000.00 AS Decimal(15, 2)), N'COMPLETED', N'checkfraud1', 1, CAST(N'2026-07-27T12:10:58.100' AS DateTime))
GO
INSERT [dbo].[Transactions] ([transaction_id], [from_account_id], [to_account_id], [transaction_type], [amount], [status], [description], [is_fraud], [transaction_time]) VALUES (66, 5, NULL, N'WITHDRAWAL', CAST(700000.00 AS Decimal(15, 2)), N'COMPLETED', N'checkfraud2', 1, CAST(N'2026-07-27T12:11:08.927' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Transactions] OFF
GO
SET IDENTITY_INSERT [dbo].[Users] ON 
GO
INSERT [dbo].[Users] ([user_id], [full_name], [email], [password_hash], [role], [status], [created_at], [last_login]) VALUES (1, N'Admin', N'admin@bank.com', N'$2b$10$MQ03/2XerNRrAwh6/GZ19utnnaba4zRnBWqkXfWEQK0..1Z/0deQi', N'ADMIN', N'ACTIVE', CAST(N'2026-05-12T10:06:04.653' AS DateTime), CAST(N'2026-09-02T07:41:00.727' AS DateTime))
GO
INSERT [dbo].[Users] ([user_id], [full_name], [email], [password_hash], [role], [status], [created_at], [last_login]) VALUES (2, N'Alyan', N'alyantest@bank.com', N'$2b$10$tIRjr0qBeJ2THKDUEPw4au5S5WGCjWovt8QrPd.OSjnTNSSYPec82', N'STAFF', N'ACTIVE', CAST(N'2026-05-12T14:00:52.400' AS DateTime), CAST(N'2026-09-02T07:39:18.997' AS DateTime))
GO
INSERT [dbo].[Users] ([user_id], [full_name], [email], [password_hash], [role], [status], [created_at], [last_login]) VALUES (3, N'Ammadsexy', N'ammad123@cmail.com', N'$2b$10$1ByN3G37cfqrHJmMamGE8eRubT/hayLxKMuxnsshvqIPkbm4P25CW', N'STAFF', N'ACTIVE', CAST(N'2026-05-13T14:58:49.543' AS DateTime), CAST(N'2026-06-10T06:03:30.897' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Users] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Accounts__AF91A6ADC715318D]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Accounts] ADD UNIQUE NONCLUSTERED 
(
	[account_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [uq_customer_account_type]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Accounts] ADD  CONSTRAINT [uq_customer_account_type] UNIQUE NONCLUSTERED 
(
	[customer_id] ASC,
	[account_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__Customer__CD65CB84660C24B4]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Customer_Auth] ADD UNIQUE NONCLUSTERED 
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Customer__AB6E61643A00CC99]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Customers] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__Fraud_Lo__85C600AEC561260E]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Fraud_Logs] ADD UNIQUE NONCLUSTERED 
(
	[transaction_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Loan_Pol__94333CD07A2FBB69]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Loan_Policies] ADD UNIQUE NONCLUSTERED 
(
	[loan_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Users__AB6E6164815EE4DF]    Script Date: 02/09/2026 12:55:36 PM ******/
ALTER TABLE [dbo].[Users] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Account_Approvals] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Account_Approvals] ADD  DEFAULT (getdate()) FOR [actioned_at]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT ((0.00)) FOR [balance]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT (getdate()) FOR [opened_date]
GO
ALTER TABLE [dbo].[AI_Chat_Messages] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[AI_Chat_Sessions] ADD  DEFAULT (getdate()) FOR [started_at]
GO
ALTER TABLE [dbo].[Customer_Approvals] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Customer_Approvals] ADD  DEFAULT (getdate()) FOR [actioned_at]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT ('Pakistan') FOR [country]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Fraud_Logs] ADD  DEFAULT ('FLAGGED') FOR [action_taken]
GO
ALTER TABLE [dbo].[Fraud_Logs] ADD  DEFAULT (getdate()) FOR [detected_at]
GO
ALTER TABLE [dbo].[Loan_Approvals] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Loan_Approvals] ADD  DEFAULT (getdate()) FOR [actioned_at]
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions] ADD  DEFAULT (getdate()) FOR [attempted_at]
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions] ADD  DEFAULT ('SUCCESS') FOR [status]
GO
ALTER TABLE [dbo].[Loan_Policies] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[Loan_Policies] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Loan_Repayments] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Loan_Repayments] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Loans] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Loans] ADD  DEFAULT ((0)) FOR [auto_deduct]
GO
ALTER TABLE [dbo].[Loans] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT ((0)) FOR [is_read]
GO
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[OTP_Tokens] ADD  DEFAULT ('LOGIN') FOR [purpose]
GO
ALTER TABLE [dbo].[OTP_Tokens] ADD  DEFAULT ((0)) FOR [is_used]
GO
ALTER TABLE [dbo].[OTP_Tokens] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Support_Tickets] ADD  DEFAULT ('GENERAL') FOR [category]
GO
ALTER TABLE [dbo].[Support_Tickets] ADD  DEFAULT ('OPEN') FOR [status]
GO
ALTER TABLE [dbo].[Support_Tickets] ADD  DEFAULT ('MEDIUM') FOR [priority]
GO
ALTER TABLE [dbo].[Support_Tickets] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Ticket_Replies] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT ('COMPLETED') FOR [status]
GO
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT ((0)) FOR [is_fraud]
GO
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT (getdate()) FOR [transaction_time]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Account_Approvals]  WITH CHECK ADD FOREIGN KEY([account_id])
REFERENCES [dbo].[Accounts] ([account_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Account_Approvals]  WITH CHECK ADD FOREIGN KEY([approver_id])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
GO
ALTER TABLE [dbo].[AI_Chat_Messages]  WITH CHECK ADD FOREIGN KEY([session_id])
REFERENCES [dbo].[AI_Chat_Sessions] ([session_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AI_Chat_Sessions]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Customer_Approvals]  WITH CHECK ADD FOREIGN KEY([approver_id])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Customer_Approvals]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Customer_Auth]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Customers]  WITH CHECK ADD FOREIGN KEY([assigned_staff_id])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Fraud_Logs]  WITH CHECK ADD FOREIGN KEY([reviewed_by])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Fraud_Logs]  WITH CHECK ADD FOREIGN KEY([transaction_id])
REFERENCES [dbo].[Transactions] ([transaction_id])
GO
ALTER TABLE [dbo].[Loan_Approvals]  WITH CHECK ADD FOREIGN KEY([approver_id])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Loan_Approvals]  WITH CHECK ADD FOREIGN KEY([loan_id])
REFERENCES [dbo].[Loans] ([loan_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions]  WITH CHECK ADD FOREIGN KEY([from_account_id])
REFERENCES [dbo].[Accounts] ([account_id])
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions]  WITH CHECK ADD FOREIGN KEY([loan_id])
REFERENCES [dbo].[Loans] ([loan_id])
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions]  WITH CHECK ADD FOREIGN KEY([repayment_id])
REFERENCES [dbo].[Loan_Repayments] ([repayment_id])
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions]  WITH CHECK ADD FOREIGN KEY([transaction_id])
REFERENCES [dbo].[Transactions] ([transaction_id])
GO
ALTER TABLE [dbo].[Loan_Repayments]  WITH CHECK ADD FOREIGN KEY([loan_id])
REFERENCES [dbo].[Loans] ([loan_id])
GO
ALTER TABLE [dbo].[Loan_Repayments]  WITH CHECK ADD FOREIGN KEY([transaction_id])
REFERENCES [dbo].[Transactions] ([transaction_id])
GO
ALTER TABLE [dbo].[Loans]  WITH CHECK ADD FOREIGN KEY([account_id])
REFERENCES [dbo].[Accounts] ([account_id])
GO
ALTER TABLE [dbo].[Loans]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
GO
ALTER TABLE [dbo].[Loans]  WITH CHECK ADD FOREIGN KEY([disbursed_by])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Loans]  WITH CHECK ADD FOREIGN KEY([policy_id])
REFERENCES [dbo].[Loan_Policies] ([policy_id])
GO
ALTER TABLE [dbo].[Support_Tickets]  WITH CHECK ADD FOREIGN KEY([assigned_to])
REFERENCES [dbo].[Users] ([user_id])
GO
ALTER TABLE [dbo].[Support_Tickets]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
GO
ALTER TABLE [dbo].[Ticket_Replies]  WITH CHECK ADD FOREIGN KEY([ticket_id])
REFERENCES [dbo].[Support_Tickets] ([ticket_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD FOREIGN KEY([from_account_id])
REFERENCES [dbo].[Accounts] ([account_id])
GO
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD FOREIGN KEY([to_account_id])
REFERENCES [dbo].[Accounts] ([account_id])
GO
ALTER TABLE [dbo].[Account_Approvals]  WITH CHECK ADD CHECK  (([approver_role]='ADMIN' OR [approver_role]='STAFF'))
GO
ALTER TABLE [dbo].[Account_Approvals]  WITH CHECK ADD  CONSTRAINT [CK_Account_Approvals_status] CHECK  (([status]='ACTIVE' OR [status]='FROZEN' OR [status]='CLOSED' OR [status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Account_Approvals] CHECK CONSTRAINT [CK_Account_Approvals_status]
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD CHECK  (([account_type]='SAVINGS' OR [account_type]='CURRENT'))
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD  CONSTRAINT [CK_Accounts_status] CHECK  (([status]='FROZEN' OR [status]='CLOSURE_PENDING' OR [status]='CLOSED' OR [status]='REJECTED' OR [status]='ACTIVE' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Accounts] CHECK CONSTRAINT [CK_Accounts_status]
GO
ALTER TABLE [dbo].[AI_Chat_Messages]  WITH CHECK ADD CHECK  (([role]='ASSISTANT' OR [role]='USER'))
GO
ALTER TABLE [dbo].[Customer_Approvals]  WITH CHECK ADD CHECK  (([approver_role]='ADMIN' OR [approver_role]='STAFF'))
GO
ALTER TABLE [dbo].[Customer_Approvals]  WITH CHECK ADD CHECK  (([status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Customers]  WITH CHECK ADD CHECK  (([status]='SUSPENDED' OR [status]='REJECTED' OR [status]='ACTIVE' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Fraud_Logs]  WITH CHECK ADD CHECK  (([action_taken]='CLEARED' OR [action_taken]='BLOCKED' OR [action_taken]='FLAGGED'))
GO
ALTER TABLE [dbo].[Loan_Approvals]  WITH CHECK ADD CHECK  (([approver_role]='ADMIN' OR [approver_role]='STAFF'))
GO
ALTER TABLE [dbo].[Loan_Approvals]  WITH CHECK ADD CHECK  (([status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Loan_Auto_Deductions]  WITH CHECK ADD CHECK  (([status]='SKIPPED' OR [status]='FAILED' OR [status]='SUCCESS'))
GO
ALTER TABLE [dbo].[Loan_Repayments]  WITH CHECK ADD CHECK  (([status]='PARTIAL' OR [status]='OVERDUE' OR [status]='PAID' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Loans]  WITH CHECK ADD CHECK  (([status]='DEFAULTED' OR [status]='CLOSED' OR [status]='REJECTED' OR [status]='ACTIVE' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD CHECK  (([recipient_type]='ADMIN' OR [recipient_type]='STAFF' OR [recipient_type]='CUSTOMER'))
GO
ALTER TABLE [dbo].[OTP_Tokens]  WITH CHECK ADD CHECK  (([entity_type]='ADMIN' OR [entity_type]='STAFF' OR [entity_type]='CUSTOMER'))
GO
ALTER TABLE [dbo].[OTP_Tokens]  WITH CHECK ADD CHECK  (([purpose]='ACCOUNT_VERIFICATION' OR [purpose]='RESET_PASSWORD' OR [purpose]='LOGIN'))
GO
ALTER TABLE [dbo].[Support_Tickets]  WITH CHECK ADD CHECK  (([category]='GENERAL' OR [category]='LOAN' OR [category]='TRANSACTION' OR [category]='ACCOUNT'))
GO
ALTER TABLE [dbo].[Support_Tickets]  WITH CHECK ADD CHECK  (([priority]='HIGH' OR [priority]='MEDIUM' OR [priority]='LOW'))
GO
ALTER TABLE [dbo].[Support_Tickets]  WITH CHECK ADD CHECK  (([status]='CLOSED' OR [status]='RESOLVED' OR [status]='IN_PROGRESS' OR [status]='OPEN'))
GO
ALTER TABLE [dbo].[Ticket_Replies]  WITH CHECK ADD CHECK  (([sender_type]='ADMIN' OR [sender_type]='STAFF' OR [sender_type]='CUSTOMER'))
GO
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD CHECK  (([status]='REVERSED' OR [status]='FAILED' OR [status]='COMPLETED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD  CONSTRAINT [CK_Transactions_transaction_type] CHECK  (([transaction_type]='CLOSURE_WITHDRAWAL' OR [transaction_type]='INTERNAL_TRANSFER' OR [transaction_type]='LOAN_DISBURSEMENT' OR [transaction_type]='LOAN_REPAYMENT' OR [transaction_type]='TRANSFER' OR [transaction_type]='WITHDRAWAL' OR [transaction_type]='DEPOSIT'))
GO
ALTER TABLE [dbo].[Transactions] CHECK CONSTRAINT [CK_Transactions_transaction_type]
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD CHECK  (([role]='ADMIN' OR [role]='STAFF'))
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD CHECK  (([status]='SUSPENDED' OR [status]='REJECTED' OR [status]='ACTIVE' OR [status]='PENDING'))
GO
