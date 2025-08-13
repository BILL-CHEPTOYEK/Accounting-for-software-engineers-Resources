// /04-Application/backend/frontend/src/components/AccountTypeFormModal.jsx

import React, { useState, useEffect } from 'react';

function AccountTypeFormModal({ show, onClose, onSubmit, accountType }) {
  // Initial state for the form, setting defaults or pre-filling for edit
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    normal_balance: '', // 'DR' or 'CR'
  });
  const [errors, setErrors] = useState({});

  // Effect to populate form data when 'accountType' prop changes (for editing)
  useEffect(() => {
    if (accountType) {
      setFormData({
        name: accountType.name || '',
        category: accountType.category || '',
        normal_balance: accountType.normal_balance || '',
      });
    } else {
      // Reset form for adding new if no accountType is provided
      setFormData({
        name: '',
        category: '',
        normal_balance: '',
      });
    }
    setErrors({}); // Clear errors when modal opens or accountType changes
  }, [accountType, show]); // Depend on show to reset when modal visibility changes

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
      newErrors.name = 'Account Type Name is required.';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required.';
    }
    if (!formData.normal_balance) {
      newErrors.normal_balance = 'Normal Balance is required (Debit/Credit).';
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
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">{accountType ? 'Edit Account Type' : 'Add New Account Type'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Account Type Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Current Asset, Revenue, Operating Expense"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="category" className="form-label">Category</label>
                <input
                  type="text"
                  className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Asset, Liability, Equity, Revenue, Expense"
                />
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="normal_balance" className="form-label">Normal Balance</label>
                <select
                  className={`form-select ${errors.normal_balance ? 'is-invalid' : ''}`}
                  id="normal_balance"
                  name="normal_balance"
                  value={formData.normal_balance}
                  onChange={handleChange}
                >
                  <option value="">Select Normal Balance</option>
                  <option value="DR">Debit (DR)</option>
                  <option value="CR">Credit (CR)</option>
                </select>
                {errors.normal_balance && <div className="invalid-feedback">{errors.normal_balance}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {accountType ? 'Save Changes' : 'Add Account Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AccountTypeFormModal;
