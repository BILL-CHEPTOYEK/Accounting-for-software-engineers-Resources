// /04-Application/backend/frontend/src/components/UserFormModal.jsx

import React, { useState, useEffect } from 'react';

function UserFormModal({ show, onClose, onSubmit, user, branches }) {
  const isEditMode = !!user;

  // Initial state for the form, setting defaults or pre-filling for edit
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '', // Only for new users or password reset
    confirm_password: '', // Only for new users or password reset
    first_name: '',
    last_name: '',
    role: 'Employee', // Default role
    is_active: true,
    branch_id: '', // New: Associate user with a branch
  });
  const [errors, setErrors] = useState({});

  // Effect to populate form data when 'user' prop changes (for editing)
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Never pre-fill passwords for security
        confirm_password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'Employee',
        is_active: user.is_active !== undefined ? user.is_active : true,
        branch_id: user.branch_id || (branches.length > 0 ? branches[0].branch_id : ''), // Pre-fill branch
      });
    } else {
      // Reset form for adding new if no user is provided
      setFormData({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
        role: 'Employee',
        is_active: true,
        branch_id: branches.length > 0 ? branches[0].branch_id : '', // Default to first branch for new user
      });
    }
    setErrors({}); // Clear errors when modal opens or user changes
  }, [user, show, isEditMode, branches]); // Depend on branches to update default selection if they load later

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format.';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First Name is required.';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last Name is required.';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required.';
    }
    if (!formData.branch_id) { // Branch is now a required field
      newErrors.branch_id = 'Branch is required.';
    }


    if (!isEditMode || (isEditMode && formData.password)) { // Password required for new or if changing in edit
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required.';
      } else if (formData.password.length < 6) { // Basic password length check
        newErrors.password = 'Password must be at least 6 characters long.';
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Create a copy of formData and remove confirm_password before submitting
      const dataToSubmit = { ...formData };
      delete dataToSubmit.confirm_password;
      // If in edit mode and password is not provided, don't send an empty password
      if (isEditMode && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      onSubmit(dataToSubmit);
    }
  };

  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">{isEditMode ? 'Edit User' : 'Add New User'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g., John"
                />
                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g., Doe"
                />
                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., user@example.com"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              {/* Username field - currently not explicitly used but kept for schema compatibility */}
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g., johndoe"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="role" className="form-label">Role</label>
                <select
                  className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Employee">Employee</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Admin">Admin</option>
                </select>
                {errors.role && <div className="invalid-feedback">{errors.role}</div>}
              </div>

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

              <div className="mb-3">
                <label htmlFor="password" className="form-label">{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditMode ? 'Enter new password or leave blank' : 'Enter password'}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
                {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
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
                {isEditMode ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserFormModal;
