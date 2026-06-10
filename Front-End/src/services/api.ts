const API_BASE_URL = "http://127.0.0.1:5000/api";

const getToken = () => localStorage.getItem("token");

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  window.dispatchEvent(new Event("auth:expired"));
};

const parseJson = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json") ? response.json() : null;
};

const handleResponse = async (response: Response) => {
  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || "Request failed";
    const lower = message.toLowerCase();

    if (response.status === 401 || lower.includes("invalid token") || lower.includes("jwt expired")) {
      clearSession();
    }

    throw new Error(message);
  }

  return data;
};

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

export const api = {
  async get(endpoint: string, params?: Record<string, any>) {
    let url = `${API_BASE_URL}${endpoint}`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },

  async post(endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async put(endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  async patch(endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  accounts: {
    getByCustomer: async (customerId: number) => {
      return api.get(`/accounts/customer/${customerId}`);
    },
    create: async (data: { accountType: string }) => {
      return api.post("/accounts/create", data);
    },
  },

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

  loans: {
    getByCustomer: async (customerId: number) => {
      return api.get(`/loans/customer/${customerId}`);
    },
    create: async (data: {
      amount: number;
      loanType: string;
      duration: number;
    }) => {
      return api.post("/loans/apply", {
        loan_amount: data.amount,
        loan_type: data.loanType,
        duration_months: data.duration,
      });
    },
    getPendingLoans: async () => {
      return api.get("/loan-approval/pending");
    },
    approveLoan: async (loanId: number) => {
      return api.patch(`/loan-approval/approve/${loanId}`);
    },
    rejectLoan: async (loanId: number, reason: string) => {
      return api.patch(`/loan-approval/reject/${loanId}`, { reason });
    },
  },
};
