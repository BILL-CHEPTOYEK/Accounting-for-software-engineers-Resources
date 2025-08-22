// /04-Application/backend/frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenManager.logout();
      // Optionally redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- API Functions for Parties ---
export const partyApi = {
  getAllParties: () => api.get('/parties'),
  getPartyById: (id) => api.get(`/parties/${id}`),
  createParty: (partyData) => api.post('/parties', partyData),
  updateParty: (id, partyData) => api.put(`/parties/${id}`, partyData),
  deleteParty: (id) => api.delete(`/parties/${id}`),
};

// --- API Functions for Invoices ---
export const invoiceApi = {
  getAllInvoices: () => api.get('/invoices'),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  createInvoice: (invoiceData) => api.post('/invoices', invoiceData),
  updateInvoice: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  postInvoice: (id, postData) => api.post(`/invoices/${id}/post`, postData), 
  recordPayment: (paymentData) => api.post('/invoices/record-payment', paymentData),
};

// --- API Functions for Bills ---
export const billApi = {
  getAllBills: () => api.get('/bills'),
  getBillById: (id) => api.get(`/bills/${id}`),
  createBill: (billData) => api.post('/bills', billData),
  updateBill: (id, billData) => api.put(`/bills/${id}`, billData),
  deleteBill: (id) => api.delete(`/bills/${id}`),
  postBill: (id, postData) => api.post(`/bills/${id}/post`, postData),
  recordPayment: (paymentData) => api.post('/bills/record-payment', paymentData),
};


// --- API Functions for Account Types ---
export const accountTypeApi = {
  getAllAccountTypes: () => api.get('/account-types'),
  getAccountTypeById: (id) => api.get(`/account-types/${id}`),
  createAccountType: (accountTypeData) => api.post('/account-types', accountTypeData),
  updateAccountType: (id, accountTypeData) => api.put(`/account-types/${id}`, accountTypeData),
  deleteAccountType: (id) => api.delete(`/account-types/${id}`),
};

// --- API Functions for Chart of Accounts ---
export const chartOfAccountApi = {
  getAllChartOfAccounts: () => api.get('/chart-of-accounts'),
  getChartOfAccountById: (id) => api.get(`/chart-of-accounts/${id}`),
  createChartOfAccount: (accountData) => api.post('/chart-of-accounts', accountData),
  updateChartOfAccount: (id, accountData) => api.put(`/chart-of-accounts/${id}`, accountData),
  deleteChartOfAccount: (id) => api.delete(`/chart-of-accounts/${id}`),
};

// --- API Functions for Branches ---
export const branchApi = {
  getAllBranches: () => api.get('/branches'),
  getBranchById: (id) => api.get(`/branches/${id}`),
  createBranch: (branchData) => api.post('/branches', branchData),
  updateBranch: (id, branchData) => api.put(`/branches/${id}`, branchData),
  deleteBranch: (id) => api.delete(`/branches/${id}`),
};

// --- API Functions for Users & Authentication ---
export const userApi = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  loginUser: (credentials) => api.post('/users/login', credentials),
  signupUser: (userData) => api.post('/users/signup', userData),
};

// --- API Functions for Transactions ---
export const transactionApi = {
  getAllTransactions: () => api.get('/transactions'),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  createTransaction: (transactionLines) => api.post('/transactions', transactionLines),
  updateTransaction: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  reverseTransaction: (reversalData) => api.post('/transactions/reverse', reversalData),
};

export default api;
