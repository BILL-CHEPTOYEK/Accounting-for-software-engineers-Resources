// /04-Application/backend/frontend/src/components/BranchFormModal.jsx

import React, { useState, useEffect } from 'react';

function BranchFormModal({ show, onClose, onSubmit, branch }) {
  // Initial state for the form, setting defaults or pre-filling for edit
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_person: '',
    phone_number: '',
    is_active: true, // Default to active for new branches
  });
  const [errors, setErrors] = useState({});

  // Effect to populate form data when 'branch' prop changes (for editing)
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        contact_person: branch.contact_person || '',
        phone_number: branch.phone_number || '',
        is_active: branch.is_active !== undefined ? branch.is_active : true,
      });
    } else {
      // Reset form for adding new if no branch is provided
      setFormData({
        name: '',
        address: '',
        contact_person: '',
        phone_number: '',
        is_active: true,
      });
    }
    setErrors({}); // Clear errors when modal opens or branch changes
  }, [branch, show]); // Depend on show to reset when modal visibility changes

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Branch Name is required.';
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
          <div className="modal-header bg-secondary text-white"> {/* Using secondary for branch header */}
            <h5 className="modal-title">{branch ? 'Edit Branch' : 'Add New Branch'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Branch Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Main Office, Downtown Branch"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="address" className="form-label">Address</label>
                <textarea
                  className="form-control"
                  id="address"
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main St, City, Country"
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="contact_person" className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="form-control"
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="e.g., Jane Doe"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phone_number" className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="e.g., +1234567890"
                />
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_active">Is Active</label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {branch ? 'Save Changes' : 'Add Branch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BranchFormModal;
