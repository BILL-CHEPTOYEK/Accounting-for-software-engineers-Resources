// /04-Application/backend/frontend/src/pages/UserPage.jsx

import React, { useState, useEffect } from 'react';
import { userApi, branchApi } from '../services/api';

import UserFormModal from '../components/UserFormModal'; 

function UserPage() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]); // To pass to the form for branch selection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // For editing

  // Fetch all users and branches
  const fetchUsersAndBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, branchesRes] = await Promise.all([
        userApi.getAllUsers(),
        branchApi.getAllBranches(),
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error('Failed to fetch users or branches:', err);
      setError('Failed to load user or branch data. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndBranches();
  }, []);

  // Handler for adding a new user
  const handleAddUser = () => {
    setCurrentUser(null); // Clear any previous data for adding new
    setShowModal(true);
  };

  // Handler for editing an existing user
  const handleEditUser = (user) => {
    setCurrentUser(user); // Set data for editing
    setShowModal(true);
  };

  // Handler for deleting a user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userApi.deleteUser(userId);
        alert('User deleted successfully!');
        fetchUsersAndBranches(); // Re-fetch data to update the list
      } catch (err) {
        console.error('Failed to delete user:', err);
        setError('Failed to delete user: ' + (err.response?.data?.error || err.message));
        alert('Failed to delete user: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
      }
    }
  };

  // Handler for submitting the form (add or edit)
  const handleSubmitUser = async (formData) => {
    try {
      if (currentUser) {
        // Editing existing user
        await userApi.updateUser(currentUser.user_id, formData);
        alert('User updated successfully!');
      } else {
        // Adding new user
        await userApi.createUser(formData);
        alert('User added successfully!');
      }
      setShowModal(false); // Close modal
      fetchUsersAndBranches(); // Re-fetch data to update the list
    } catch (err) {
      console.error('Failed to save user:', err);
      setError('Failed to save user: ' + (err.response?.data?.error || err.message));
      alert('Failed to save user: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-person-circle me-2 text-info"></i> Manage Users</span>
        <button className="btn btn-info text-white shadow-sm" onClick={handleAddUser}>
          <i className="bi bi-plus-circle me-2"></i> Add New User
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
          <p className="ms-3 text-info">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
          No users found. Click "Add New User" to create one.
        </div>
      ) : (
        <div className="table-responsive rounded-3 border">
          <table className="table table-hover mb-0">
            <thead className="table-warning">
              <tr>
                <th className="py-3 px-4 fw-semibold">Name</th>
                <th className="py-3 px-4 fw-semibold">Email</th>
                <th className="py-3 px-4 fw-semibold">Role</th>
                <th className="py-3 px-4 fw-semibold">Branch</th> 
                <th className="py-3 px-4 fw-semibold">Active</th>
                <th className="py-3 px-4 fw-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#fafafa' }}>
              {users.map((user) => {
                const userBranch = branches.find(b => b.branch_id === user.branch_id); 
                return (
                  <tr key={user.user_id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{userBranch ? userBranch.name : 'N/A'}</td> 
                    <td>{user.is_active ? 'Yes' : 'No'}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-info me-2"
                        onClick={() => handleEditUser(user)}
                        title="Edit User"
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteUser(user.user_id)}
                        title="Delete User"
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Add/Edit Modal */}
      <UserFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitUser}
        user={currentUser}
        branches={branches} // Pass branches to the modal for selection
      />
    </div>
  );
}

export default UserPage;
