const API_BASE_URL = "http://127.0.0.1:5000/api";

const getToken = () => localStorage.getItem("token");

export const api = {
  // Base request methods
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  async put(endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  // DELETE request  👈 ADD THIS
  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  },
  // PATCH request - ✅ ADD THIS
  async patch(endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  // Accounts endpoints
  accounts: {
    getByCustomer: async (customerId: number) => {
      return api.get(`/accounts/customer/${customerId}`);
    },
    create: async (data: { accountType: string }) => {
      return api.post("/accounts/create", data);
    },
  },

  // Transactions endpoints
  transactions: {
    getByAccount: async (accountId: number) => {
      return api.get(`/transactions/account/${accountId}`);
    },
    withdraw: async (data: {
      accountId: number;
      amount: number;
      description: string;
    }) => {
      return api.post("/transactions/withdraw", data);
    },
    transfer: async (data: {
      fromAccountId: number;
      toAccountNumber: string;
      amount: number;
      description: string;
    }) => {
      return api.post("/transactions/transfer", data);
    },
  },

// Loans endpoints
  loans: {
    getByCustomer: async (customerId: number) => {
      return api.get(`/loans/customer/${customerId}`);
    },
    create: async (data: { amount: number; loanType: string; duration: number }) => {
      return api.post('/loans/apply', {
        loan_amount: data.amount,
        loan_type: data.loanType,
        duration_months: data.duration
      });
    },
    getPendingLoans: async () => {
      return api.get('/loan-approval/pending');
    },
    approveLoan: async (loanId: number) => {
      return api.patch(`/loan-approval/approve/${loanId}`); // Now uses PATCH
    },
    rejectLoan: async (loanId: number, reason: string) => {
      return api.patch(`/loan-approval/reject/${loanId}`, { reason }); // Now uses PATCH
    }
  }
};
