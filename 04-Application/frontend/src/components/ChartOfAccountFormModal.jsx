// /04-Application/backend/frontend/src/components/ChartOfAccountFormModal.jsx

import React, { useState, useEffect } from 'react';

function ChartOfAccountFormModal({ show, onClose, onSubmit, account, accountTypes, parentAccounts }) {
  // Initial state for the form, setting defaults or pre-filling for edit
  const [formData, setFormData] = useState({
    name: '',
    account_no: '',
    account_type_id: '',
    parent_id: '', // Optional
  });
  const [errors, setErrors] = useState({});

  // Effect to populate form data when 'account' prop changes (for editing)
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        account_no: account.account_no || '',
        account_type_id: account.account_type_id || '',
        parent_id: account.parent_id || '',
      });
    } else {
      // Reset form for adding new if no account is provided
      setFormData({
        name: '',
        account_no: '',
        account_type_id: '',
        parent_id: '',
      });
    }
    setErrors({}); // Clear errors when modal opens or account changes
  }, [account, show]); // Depend on show to reset when modal visibility changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Account Name is required.';
    }
    if (!formData.account_no.trim()) {
      newErrors.account_no = 'Account Number is required.';
    }
    if (!formData.account_type_id) {
      newErrors.account_type_id = 'Account Type is required.';
    }
    // Basic validation for parent_id: ensure it's not the same as the account being edited
    if (account && formData.parent_id && formData.parent_id === account.account_id) {
        newErrors.parent_id = 'An account cannot be its own parent.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">{account ? 'Edit Account' : 'Add New Account'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="account_no" className="form-label">Account Number</label>
                <input
                  type="text"
                  className={`form-control ${errors.account_no ? 'is-invalid' : ''}`}
                  id="account_no"
                  name="account_no"
                  value={formData.account_no}
                  onChange={handleChange}
                  placeholder="e.g., 1000, 4000, 5000"
                />
                {errors.account_no && <div className="invalid-feedback">{errors.account_no}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Account Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Cash, Accounts Receivable, Sales Revenue"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="account_type_id" className="form-label">Account Type</label>
                <select
                  className={`form-select ${errors.account_type_id ? 'is-invalid' : ''}`}
                  id="account_type_id"
                  name="account_type_id"
                  value={formData.account_type_id}
                  onChange={handleChange}
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map(type => (
                    <option key={type.account_type_id} value={type.account_type_id}>
                      {type.name} ({type.category} - {type.normal_balance})
                    </option>
                  ))}
                </select>
                {errors.account_type_id && <div className="invalid-feedback">{errors.account_type_id}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="parent_id" className="form-label">Parent Account (Optional)</label>
                <select
                  className={`form-select ${errors.parent_id ? 'is-invalid' : ''}`}
                  id="parent_id"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleChange}
                >
                  <option value="">No Parent Account</option>
                  {parentAccounts.filter(pa => pa.account_id !== formData.account_id).map(pa => ( // Prevent self-selection
                    <option key={pa.account_id} value={pa.account_id}>
                      {pa.account_no} - {pa.name}
                    </option>
                  ))}
                </select>
                {errors.parent_id && <div className="invalid-feedback">{errors.parent_id}</div>}
                <small className="form-text text-muted">For hierarchical accounts (e.g., "Current Assets" as parent of "Cash").</small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {account ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChartOfAccountFormModal;
