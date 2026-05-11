<div align="center">

```
██████╗  █████╗ ███╗   ██╗██╗  ██╗███╗   ███╗██╗███╗   ██╗██████╗
██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝████╗ ████║██║████╗  ██║██╔══██╗
██████╔╝███████║██╔██╗ ██║█████╔╝ ██╔████╔██║██║██╔██╗ ██║██║  ██║
██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ ██║╚██╔╝██║██║██║╚██╗██║██║  ██║
██████╔╝██║  ██║██║ ╚████║██║  ██╗██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝
```

### A full-stack AI-ready banking management system

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2019+-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white)](https://microsoft.com/sql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## Overview

BankMind is a comprehensive, role-based banking management system built with a modern full-stack architecture. It handles everything from account creation and loan approvals to real-time transaction processing — with a clean, responsive UI and secure JWT authentication throughout.

> ⚠️ **Note:** AI features are planned for a future release. The system is fully functional without them.

---

## Features

### Role-Based Dashboards

| Role | Capabilities |
|------|-------------|
| **Admin** | Approve users & customers, full system control, audit logs |
| **Bank User** | Approve customers, manage accounts, process loan applications |
| **Customer** | Open accounts, deposit / withdraw / transfer, apply for loans |

### Core Functionality

- 🔐 **JWT Authentication** — Secure, stateless auth with role-based access control
- 🏦 **Account Management** — Create savings/current accounts with approval workflows
- 💸 **Transactions** — Deposit, withdraw, and transfer with running balance tracking
- 📋 **Loan Processing** — Apply for 6 loan types with interest rates and duration ranges
- 🔔 **Real-time Notifications** — Instant alerts for approvals, rejections, and transactions
- 📊 **Statement Export** — Download statements as CSV, Excel, or PDF with date filtering

---

## Tech Stack

### Backend
- **Runtime** — Node.js v18+
- **Framework** — Express.js
- **Database** — Microsoft SQL Server 2019+
- **Auth** — JSON Web Tokens (JWT)

### Frontend
- **Library** — React 18
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **Build Tool** — Vite
- **Icons** — Lucide React

---

## Quick Start

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org) v18 or higher
- [SQL Server](https://www.microsoft.com/en-us/sql-server) 2019 or higher
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/sheikhalyan/BankMind.git
cd BankMind
```

### 2. Configure environment variables

Create a `.env` file inside the `Back-End` directory:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=BankMind
JWT_SECRET=your_secret_key
```

### 3. Start the backend

```bash
cd Back-End
npm install
npm start
```

### 4. Start the frontend

```bash
cd Front-End
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Project Structure

```
BankMind/
├── .gitignore
├── .vscode/
│   └── settings.json
├── Back-End/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── email.js
│   ├── controllers/
│   │   ├── accountController.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── loanApprovalController.js
│   │   ├── loanController.js
│   │   ├── notificationController.js
│   │   ├── transactionController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── adminMiddleware.js
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── routes/
│   │   ├── accountRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── loanApprovalRoutes.js
│   │   ├── loanRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       ├── notifications.js
│       └── otp.js
└── Front-End/
    ├── .env
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── vite-env.d.ts
        ├── components/
        │   ├── DateRangePicker.tsx
        │   ├── NotificationBell.tsx
        │   ├── ProfileModal.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── Router.tsx
        │   └── StatementDownload.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── pages/
        │   ├── AdminDashboard.tsx
        │   ├── CustomerDashboard.tsx
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   └── UserDashboard.tsx
        ├── services/
        │   ├── account.ts
        │   ├── admin.ts
        │   ├── api.ts
        │   ├── auth.ts
        │   ├── loan.ts
        │   ├── notification.ts
        │   ├── profile.ts
        │   ├── transaction.ts
        │   └── user.ts
        └── types/
            └── index.ts
```

---

## Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork the repository and clone it
git clone https://github.com/sheikhalyan/BankMind.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: add your feature description"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please follow [Conventional Commits](https://www.conventionalcommits.org) for commit messages.

---

## Roadmap

- [x] Role-based authentication
- [x] Account management & approvals
- [x] Transaction processing
- [x] Loan application system
- [x] Real-time notifications
- [x] Statement export (CSV / Excel / PDF)
- [ ] AI-powered fraud detection
- [ ] Spending analytics & insights
- [ ] Two-factor authentication

---

## License

This project is licensed under the [Sheikh's License](LICENSE).

---

## Author

**Sheikh Alyan**

[![GitHub](https://img.shields.io/badge/GitHub-@sheikhalyan-181717?style=flat-square&logo=github)](https://github.com/sheikhalyan)

---

## Acknowledgments

- [Lucide React](https://lucide.dev) — Icon library
- [Tailwind CSS](https://tailwindcss.com) — Utility-first styling
- [SheetJS](https://sheetjs.com) — Excel export
- [Microsoft SQL Server](https://microsoft.com/sql-server) — Database

---

<div align="center">

Built with ❤️ by Sheikh Alyan

*For support, please [open an issue](https://github.com/sheikhalyan/BankMind/issues) on GitHub.*

</div>
