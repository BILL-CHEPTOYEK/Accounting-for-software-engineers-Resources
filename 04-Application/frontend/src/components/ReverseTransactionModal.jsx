// /04-Application/backend/frontend/src/components/ReverseTransactionModal.jsx

import React, { useState, useEffect } from 'react';

function ReverseTransactionModal({ show, onClose, onSubmit, originalTransactionNo, users, branches }) {
  const [formData, setFormData] = useState({
    original_transaction_no: originalTransactionNo || '',
    addedby: '',
    branch_id: '',
    reversal_date: '',
    description_suffix: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Populate form data when modal opens or originalTransactionNo changes
    setFormData(prev => ({
      ...prev,
      original_transaction_no: originalTransactionNo || '',
      reversal_date: new Date().toISOString().split('T')[0], // Default to today's date
      addedby: users.length > 0 ? users[0].user_id : '', // Default to first user if available
      branch_id: branches.length > 0 ? branches[0].branch_id : '', // Default to first branch if available
    }));
    setErrors({}); // Clear errors
  }, [originalTransactionNo, users, branches, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.original_transaction_no) {
      newErrors.original_transaction_no = 'Original Transaction Number is required.';
    }
    if (!formData.addedby) {
      newErrors.addedby = 'User (Added By) is required.';
    }
    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required.';
    }
    if (!formData.reversal_date) {
      newErrors.reversal_date = 'Reversal Date is required.';
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
          <div className="modal-header bg-danger text-white"> {/* Using danger for reversal header */}
            <h5 className="modal-title">Reverse Journal Entry</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-warning small" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Reversing a Journal Entry creates new, offsetting transactions. This action cannot be undone.
              </div>

              {/* Original Transaction No (pre-filled and read-only) */}
              <div className="mb-3">
                <label htmlFor="original_transaction_no" className="form-label">Original Journal Entry #</label>
                <input
                  type="text"
                  className={`form-control ${errors.original_transaction_no ? 'is-invalid' : ''}`}
                  id="original_transaction_no"
                  name="original_transaction_no"
                  value={formData.original_transaction_no}
                  readOnly // Important: This should not be editable by the user directly
                />
                {errors.original_transaction_no && <div className="invalid-feedback">{errors.original_transaction_no}</div>}
              </div>

              {/* Reversal Date */}
              <div className="mb-3">
                <label htmlFor="reversal_date" className="form-label">Reversal Date</label>
                <input
                  type="date"
                  className={`form-control ${errors.reversal_date ? 'is-invalid' : ''}`}
                  id="reversal_date"
                  name="reversal_date"
                  value={formData.reversal_date}
                  onChange={handleChange}
                />
                {errors.reversal_date && <div className="invalid-feedback">{errors.reversal_date}</div>}
              </div>

              {/* Added By User */}
              <div className="mb-3">
                <label htmlFor="addedby" className="form-label">Reversed By (User)</label>
                <select
                  className={`form-select ${errors.addedby ? 'is-invalid' : ''}`}
                  id="addedby"
                  name="addedby"
                  value={formData.addedby}
                  onChange={handleChange}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.addedby && <div className="invalid-feedback">{errors.addedby}</div>}
              </div>

              {/* Branch */}
              <div className="mb-3">
                <label htmlFor="branch_id" className="form-label">Branch</label>
                <select
                  className={`form-select ${errors.branch_id ? 'is-invalid' : ''}`}
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branch_id && <div className="invalid-feedback">{errors.branch_id}</div>}
              </div>

              {/* Optional Description Suffix */}
              <div className="mb-3">
                <label htmlFor="description_suffix" className="form-label">Additional Reversal Notes (Optional)</label>
                <textarea
                  className="form-control"
                  id="description_suffix"
                  name="description_suffix"
                  rows="3"
                  value={formData.description_suffix}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Confirm Reversal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReverseTransactionModal;
