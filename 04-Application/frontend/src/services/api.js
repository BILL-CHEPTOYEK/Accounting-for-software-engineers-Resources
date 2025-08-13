// /04-Application/backend/frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request and response interceptors

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

// --- API Functions for Users ---
export const userApi = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData), // Registration
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  loginUser: (credentials) => api.post('/users/login', credentials), // Login
};

// --- API Functions for Transactions ---
export const transactionApi = {
  getAllTransactions: () => api.get('/transactions'),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  // createTransaction expects an array of transaction lines
  createTransaction: (transactionLines) => api.post('/transactions', transactionLines),
  updateTransaction: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  // reverseTransaction expects original_transaction_no in the body
  reverseTransaction: (reversalData) => api.post('/transactions/reverse', reversalData),
};

// Export the main Axios instance directly for general use if needed
export default api;
