// /04-Application/backend/frontend/src/pages/ChartOfAccountPage.jsx

import React, { useState, useEffect } from 'react';
import { chartOfAccountApi, accountTypeApi } from '../services/api'; // Ensure you have these APIs

import ChartOfAccountFormModal from '../components/ChartOfAccountFormModal'; // The modal for add/edit operations

function ChartOfAccountPage() {
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]); // For dropdown in modal
  const [parentAccounts, setParentAccounts] = useState([]); // For parent account dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null); // For editing

  // Fetch all accounts, account types, and parent accounts
  const fetchChartOfAccountsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountsRes, accountTypesRes] = await Promise.all([
        chartOfAccountApi.getAllChartOfAccounts(),
        accountTypeApi.getAllAccountTypes(),
      ]);
      setChartOfAccounts(accountsRes.data);
      setAccountTypes(accountTypesRes.data);
      // For parent accounts, filter to only show non-child accounts for simplicity,
      // or all accounts depending on desired hierarchy complexity.
      // Here, we'll allow any existing account to be a parent.
      setParentAccounts(accountsRes.data);
    } catch (err) {
      console.error('Failed to fetch Chart of Accounts data:', err);
      setError('Failed to load Chart of Accounts. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartOfAccountsData();
  }, []);

  // Handler for adding a new account
  const handleAddAccount = () => {
    setCurrentAccount(null); // Clear any previous data for adding new
    setShowModal(true);
  };

  // Handler for editing an existing account
  const handleEditAccount = (account) => {
    setCurrentAccount(account); // Set data for editing
    setShowModal(true);
  };

  // Handler for deleting an account
  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone and may affect existing transactions.')) {
      try {
        await chartOfAccountApi.deleteChartOfAccount(accountId);
        alert('Account deleted successfully!');
        fetchChartOfAccountsData(); // Re-fetch data to update the list
      } catch (err) {
        console.error('Failed to delete account:', err);
        setError('Failed to delete account: ' + (err.response?.data?.error || err.message));
        alert('Failed to delete account: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
      }
    }
  };

  // Handler for submitting the form (add or edit)
  const handleSubmitAccount = async (formData) => {
    try {
      if (currentAccount) {
        // Editing existing account
        await chartOfAccountApi.updateChartOfAccount(currentAccount.account_id, formData);
        alert('Account updated successfully!');
      } else {
        // Adding new account
        await chartOfAccountApi.createChartOfAccount(formData);
        alert('Account added successfully!');
      }
      setShowModal(false); // Close modal
      fetchChartOfAccountsData(); // Re-fetch data to update the list
    } catch (err) {
      console.error('Failed to save account:', err);
      setError('Failed to save account: ' + (err.response?.data?.error || err.message));
      alert('Failed to save account: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-journal-check me-2 text-info"></i> Manage Chart of Accounts</span>
        <button className="btn btn-info text-white shadow-sm" onClick={handleAddAccount}>
          <i className="bi bi-plus-circle me-2"></i> Add New Account
        </button>
      </h2>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="ms-3 text-info">Loading chart of accounts...</p>
        </div>
      ) : chartOfAccounts.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
          No accounts found. Click "Add New Account" to create one.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
            <thead className="bg-info text-white">
              <tr>
                <th scope="col">Account No.</th>
                <th scope="col">Account Name</th>
                <th scope="col">Account Type</th>
                <th scope="col">Parent Account</th>
                <th scope="col" className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chartOfAccounts.map((account) => (
                <tr key={account.account_id}>
                  <td>{account.account_no}</td>
                  <td>{account.name}</td>
                  <td>{account.accountType ? account.accountType.name : 'N/A'}</td>
                  <td>
                    {account.parentAccount ? `${account.parentAccount.account_no} - ${account.parentAccount.name}` : 'N/A'}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => handleEditAccount(account)}
                      title="Edit Account"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteAccount(account.account_id)}
                      title="Delete Account"
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart of Account Add/Edit Modal */}
      <ChartOfAccountFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitAccount}
        account={currentAccount}
        accountTypes={accountTypes} // Pass fetched account types to the modal
        parentAccounts={parentAccounts} // Pass fetched accounts to serve as potential parents
      />
    </div>
  );
}

export default ChartOfAccountPage;
