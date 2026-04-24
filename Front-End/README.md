# Banking Application Frontend

A comprehensive banking application frontend built with React, TypeScript, and Tailwind CSS.

## Features

### Three User Roles

1. **Admin**
   - Approve/reject bank user registrations
   - Approve/reject customer accounts (after user approval)
   - View all pending approvals

2. **Bank User (Employee)**
   - Approve/reject customer account requests
   - Deposit money to customer accounts
   - View all accounts and their statuses
   - Approve/reject loan requests from associated customers
   - Search and filter accounts

3. **Customer**
   - Register and verify with OTP
   - Create multiple accounts (savings, checking, business)
   - View account balances and details
   - Withdraw money from accounts
   - Transfer money to other customer accounts
   - View transaction history
   - Apply for loans
   - Track loan application status

## Authentication Flow

- JWT-based authentication for all roles
- OTP verification for Users and Customers after login
- Protected routes based on user roles
- Secure session management

## Account Creation Flow

1. Customer creates an account
2. Bank User reviews and approves/rejects
3. Admin reviews and gives final approval
4. Account becomes active

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Replace the URL with your backend API endpoint.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ProtectedRoute.tsx
│   └── Router.tsx
├── context/            # React context providers
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── AdminDashboard.tsx
│   ├── UserDashboard.tsx
│   └── CustomerDashboard.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── api.ts
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## API Integration

The frontend expects the following API endpoints from your backend:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP

### Users (Admin only)
- `GET /api/users/pending` - Get pending user approvals
- `POST /api/users/:id/approve` - Approve user
- `POST /api/users/:id/reject` - Reject user

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/pending` - Get pending accounts
- `GET /api/accounts/customer/:id` - Get accounts by customer
- `POST /api/accounts` - Create new account
- `POST /api/accounts/:id/approve` - Approve account
- `POST /api/accounts/:id/reject` - Reject account

### Transactions
- `POST /api/transactions/deposit` - Deposit money (User only)
- `POST /api/transactions/withdraw` - Withdraw money (Customer only)
- `POST /api/transactions/transfer` - Transfer money (Customer only)
- `GET /api/transactions/account/:id` - Get account transactions

### Loans
- `POST /api/loans` - Create loan application
- `GET /api/loans/pending` - Get pending loan requests
- `GET /api/loans/customer/:id` - Get customer loans
- `POST /api/loans/:id/approve` - Approve loan
- `POST /api/loans/:id/reject` - Reject loan

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (for icons)

## Security Features

- JWT token-based authentication
- Role-based access control
- Protected routes
- Secure API communication
- OTP verification for enhanced security
