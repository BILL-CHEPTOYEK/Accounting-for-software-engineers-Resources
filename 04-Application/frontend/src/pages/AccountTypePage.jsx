// /04-Application/backend/frontend/src/pages/AccountTypePage.jsx

import React, { useState, useEffect } from 'react';
import { accountTypeApi } from '../services/api'; // Ensure you have accountTypeApi in your services

import AccountTypeFormModal from '../components/AccountTypeFormModal'; // The modal for add/edit operations

function AccountTypePage() {
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAccountType, setCurrentAccountType] = useState(null); // For editing

  // Fetch all account types
  const fetchAccountTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountTypeApi.getAllAccountTypes();
      setAccountTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch account types:', err);
      setError('Failed to load account types. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountTypes();
  }, []);

  // Handler for adding a new account type
  const handleAddAccountType = () => {
    setCurrentAccountType(null); // Clear any previous data for adding new
    setShowModal(true);
  };

  // Handler for editing an existing account type
  const handleEditAccountType = (accountType) => {
    setCurrentAccountType(accountType); // Set data for editing
    setShowModal(true);
  };

  // Handler for deleting an account type
  const handleDeleteAccountType = async (accountTypeId) => {
    if (window.confirm('Are you sure you want to delete this account type? This action cannot be undone and may affect existing Chart of Accounts entries.')) {
      try {
        await accountTypeApi.deleteAccountType(accountTypeId);
        alert('Account Type deleted successfully!');
        fetchAccountTypes(); // Re-fetch data to update the list
      } catch (err) {
        console.error('Failed to delete account type:', err);
        setError('Failed to delete account type: ' + (err.response?.data?.error || err.message));
        alert('Failed to delete account type: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
      }
    }
  };

  // Handler for submitting the form (add or edit)
  const handleSubmitAccountType = async (formData) => {
    try {
      if (currentAccountType) {
        // Editing existing account type
        await accountTypeApi.updateAccountType(currentAccountType.account_type_id, formData);
        alert('Account Type updated successfully!');
      } else {
        // Adding new account type
        await accountTypeApi.createAccountType(formData);
        alert('Account Type added successfully!');
      }
      setShowModal(false); // Close modal
      fetchAccountTypes(); // Re-fetch data to update the list
    } catch (err) {
      console.error('Failed to save account type:', err);
      setError('Failed to save account type: ' + (err.response?.data?.error || err.message));
      alert('Failed to save account type: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-bar-chart-fill me-2 text-primary"></i> Manage Account Types</span>
        <button className="btn btn-primary shadow-sm" onClick={handleAddAccountType}>
          <i className="bi bi-plus-circle me-2"></i> Add New Account Type
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="ms-3 text-primary">Loading account types...</p>
        </div>
      ) : accountTypes.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
          No account types found. Click "Add New Account Type" to create one.
        </div>
      ) : (
        <div className="table-responsive rounded-4 border">
          <table className="table table-hover mb-0">
            <thead className="table-primary">
              <tr>
                <th className="py-3 px-4 fw-semibold">Name</th>
                <th className="py-3 px-4 fw-semibold">Category</th>
                <th className="py-3 px-4 fw-semibold">Normal Balance</th>
                <th className="py-3 px-4 fw-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#fafafa' }}>
              {accountTypes.map((type) => (
                <tr key={type.account_type_id}>
                  <td>{type.name}</td>
                  <td>{type.category}</td>
                  <td>{type.normal_balance}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => handleEditAccountType(type)}
                      title="Edit Account Type"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteAccountType(type.account_type_id)}
                      title="Delete Account Type"
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

      {/* Account Type Add/Edit Modal */}
      <AccountTypeFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitAccountType}
        accountType={currentAccountType}
      />
    </div>
  );
}

export default AccountTypePage;
