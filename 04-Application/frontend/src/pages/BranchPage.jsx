// /04-Application/backend/frontend/src/pages/BranchPage.jsx

import React, { useState, useEffect } from 'react';
import { branchApi } from '../services/api'; // Ensure you have branchApi in your services

import BranchFormModal from '../components/BranchFormModal'; // The modal for add/edit operations

function BranchPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(null); // For editing

  // Fetch all branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await branchApi.getAllBranches();
      setBranches(response.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError('Failed to load branches. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Handler for adding a new branch
  const handleAddBranch = () => {
    setCurrentBranch(null); // Clear any previous data for adding new
    setShowModal(true);
  };

  // Handler for editing an existing branch
  const handleEditBranch = (branch) => {
    setCurrentBranch(branch); // Set data for editing
    setShowModal(true);
  };

  // Handler for deleting a branch
  const handleDeleteBranch = async (branchId) => {
    // IMPORTANT: In a real system, you'd check for dependent records (transactions, users)
    // before allowing deletion, or implement soft deletes.
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone and may affect associated data.')) {
      try {
        await branchApi.deleteBranch(branchId);
        alert('Branch deleted successfully!');
        fetchBranches(); // Re-fetch data to update the list
      } catch (err) {
        console.error('Failed to delete branch:', err);
        setError('Failed to delete branch: ' + (err.response?.data?.error || err.message));
        alert('Failed to delete branch: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
      }
    }
  };

  // Handler for submitting the form (add or edit)
  const handleSubmitBranch = async (formData) => {
    try {
      if (currentBranch) {
        // Editing existing branch
        await branchApi.updateBranch(currentBranch.branch_id, formData);
        alert('Branch updated successfully!');
      } else {
        // Adding new branch
        await branchApi.createBranch(formData);
        alert('Branch added successfully!');
      }
      setShowModal(false); // Close modal
      fetchBranches(); // Re-fetch data to update the list
    } catch (err) {
      console.error('Failed to save branch:', err);
      setError('Failed to save branch: ' + (err.response?.data?.error || err.message));
      alert('Failed to save branch: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-building-fill me-2 text-secondary"></i> Manage Branches</span>
        <button className="btn btn-secondary shadow-sm" onClick={handleAddBranch}>
          <i className="bi bi-plus-circle me-2"></i> Add New Branch
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
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="ms-3 text-secondary">Loading branches...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
          No branches found. Click "Add New Branch" to create one.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
            <thead className="bg-secondary text-white">
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Address</th>
                <th scope="col">Contact Person</th>
                <th scope="col">Phone Number</th>
                <th scope="col">Active</th>
                <th scope="col" className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.branch_id}>
                  <td>{branch.name}</td>
                  <td>{branch.address || 'N/A'}</td>
                  <td>{branch.contact_person || 'N/A'}</td>
                  <td>{branch.phone_number || 'N/A'}</td>
                  <td>{branch.is_active ? 'Yes' : 'No'}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => handleEditBranch(branch)}
                      title="Edit Branch"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteBranch(branch.branch_id)}
                      title="Delete Branch"
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

      {/* Branch Add/Edit Modal */}
      <BranchFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitBranch}
        branch={currentBranch}
      />
    </div>
  );
}

export default BranchPage;
// /04-Application/backend/frontend/src/pages/PartyPage.j
