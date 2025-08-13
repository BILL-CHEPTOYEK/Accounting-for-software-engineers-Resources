// /04-Application/backend/frontend/src/components/PartyFormModal.jsx

import React, { useState, useEffect } from 'react';

function PartyFormModal({ show, onClose, onSubmit, party }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    party_type: 'Customer', // Default to Customer
    contact_info: { email: '', phone: '' },
  });
  const [errors, setErrors] = useState({}); // State for validation errors

  // Effect to populate form data when 'party' prop changes (for editing)
  useEffect(() => {
    if (party) {
      setFormData({
        first_name: party.first_name || '',
        last_name: party.last_name || '',
        party_type: party.party_type || 'Customer',
        contact_info: party.contact_info || { email: '', phone: '' },
      });
    } else {
      // Reset form for adding new party
      setFormData({
        first_name: '',
        last_name: '',
        party_type: 'Customer',
        contact_info: { email: '', phone: '' },
      });
    }
    setErrors({}); // Clear errors when modal opens/changes context
  }, [party, show]); // Re-run when 'party' or 'show' changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email' || name === 'phone') {
      setFormData(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First Name is required.';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last Name is required.';
    }
    if (!formData.party_type) {
      newErrors.party_type = 'Party Type is required.';
    }
    if (formData.contact_info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_info.email)) {
      newErrors.email = 'Invalid email format.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData); // Call the onSubmit prop passed from PartyPage
    }
  };

  // Bootstrap modal classes control visibility
  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">{party ? 'Edit Party' : 'Add New Party'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* First Name */}
              <div className="mb-3">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
              </div>
              {/* Last Name */}
              <div className="mb-3">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
              </div>
              {/* Party Type */}
              <div className="mb-3">
                <label htmlFor="party_type" className="form-label">Party Type</label>
                <select
                  className={`form-select ${errors.party_type ? 'is-invalid' : ''}`}
                  id="party_type"
                  name="party_type"
                  value={formData.party_type}
                  onChange={handleChange}
                >
                  <option value="">Select Type</option>
                  <option value="Customer">Customer</option>
                  <option value="Supplier">Supplier</option>
                </select>
                {errors.party_type && <div className="invalid-feedback">{errors.party_type}</div>}
              </div>
              {/* Contact Info - Email */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.contact_info.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              {/* Contact Info - Phone */}
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.contact_info.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary">
                Save Party
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PartyFormModal;
