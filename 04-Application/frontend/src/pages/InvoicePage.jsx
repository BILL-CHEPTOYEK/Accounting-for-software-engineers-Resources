// /04-Application/backend/frontend/src/pages/InvoicePage.jsx

import React, { useState, useEffect } from 'react';
import { invoiceApi, partyApi, userApi, branchApi } from '../services/api';
import InvoiceList from '../components/InvoiceList';
// import InvoiceFormModal from '../components/InvoiceFormModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

function InvoicePage({ setCurrentPage }) { // Receive setCurrentPage from AppLayout
  const [invoices, setInvoices] = useState([]);
  const [parties, setParties] = useState([]); // State to hold parties for dropdown
  const [users, setUsers] = useState([]); // State to hold users for posting
  const [branches, setBranches] = useState([]); // State to hold branches for posting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postInvoiceError, setPostInvoiceError] = useState(null); // For posting specific errors
  const [postInvoiceSuccess, setPostInvoiceSuccess] = useState(false); // For posting success message

  // const [showAddEditModal, setShowAddEditModal] = useState(false); // No longer needed
  const [currentInvoice, setCurrentInvoice] = useState(null); // For viewing details

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPostingConfirmation, setShowPostingConfirmation] = useState(false); // For posting confirmation

  // Function to fetch all invoices, parties, users, and branches
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invoicesRes, partiesRes, usersRes, branchesRes] = await Promise.all([
        invoiceApi.getAllInvoices(),
        partyApi.getAllParties(),
        userApi.getAllUsers(), // Fetch users
        branchApi.getAllBranches(), // Fetch branches
      ]);
      setInvoices(invoicesRes.data);
      setParties(partiesRes.data);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error('Failed to fetch invoice, party, user, or branch data:', err);
      setError('Failed to load data. Please check your network and backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNewInvoice = () => {
    setCurrentPage('invoiceForm', null); // Navigate to InvoiceFormPage for new invoice
  };

  const handleEditInvoice = (invoice) => {
    setCurrentPage('invoiceForm', invoice); // Navigate to InvoiceFormPage with invoice data for editing
  };

  const handleViewDetails = (invoice) => {
    setCurrentInvoice(invoice); // Set data for 'details' mode
    setShowDetailModal(true);
  };

  // Handler for initiating the invoice posting process
  const handleInitiatePostInvoice = (invoice) => {
    setCurrentInvoice(invoice); // Set the invoice to be posted
    setPostInvoiceError(null); // Clear previous errors
    setPostInvoiceSuccess(false); // Clear previous success
    setShowPostingConfirmation(true); // Show confirmation modal
  };

  // Handler for confirming and executing invoice posting
  const handleConfirmPostInvoice = async (paymentMethod) => {
    setShowPostingConfirmation(false); // Close confirmation modal
    setPostInvoiceError(null);
    setPostInvoiceSuccess(false);

    if (!currentInvoice) {
      setPostInvoiceError('No invoice selected for posting.');
      return;
    }

    // In a real app, addedby and branch_id would come from user session
    // For now, let's use the first available user/branch as a placeholder
    const defaultUser = users[0]?.user_id;
    const defaultBranch = branches[0]?.branch_id;

    if (!defaultUser || !defaultBranch) {
      setPostInvoiceError('Cannot post invoice: User or Branch data not loaded. Please ensure you have users and branches created.');
      return;
    }

    try {
      // Call the new postInvoice API endpoint
      await invoiceApi.postInvoice(currentInvoice.invoice_id, {
        payment_method: paymentMethod,
        addedby: defaultUser,
        branch_id: defaultBranch,
      });
      setPostInvoiceSuccess(true);
      fetchData(); // Re-fetch all data to update invoice statuses
    } catch (err) {
      console.error('Error posting invoice:', err);
      setPostInvoiceError('Failed to post invoice: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* HEADER SECTION - Enhanced Design */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1">
                <i className="bi bi-receipt-cutoff me-3 text-danger"></i>
                Customer Invoices
              </h1>
              <p className="text-muted mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Manage sales invoices, track payments, and post to accounting system
              </p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.reload()}
                title="Refresh Data"
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                <span className="d-none d-md-inline">Refresh</span>
              </button>
              <button 
                className="btn btn-danger shadow-sm px-4" 
                onClick={handleCreateNewInvoice}
                title="Create New Invoice"
              >
                <i className="bi bi-plus-circle me-2"></i>
                <span className="fw-semibold">New Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS/ERROR ALERTS - Enhanced Design */}
      {postInvoiceSuccess && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                <div>
                  <h6 className="mb-0 fw-semibold">Success!</h6>
                  <small>Invoice posted successfully to accounting system</small>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostInvoiceSuccess(false)}></button>
            </div>
          </div>
        </div>
      )}

      {postInvoiceError && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-3 fs-5"></i>
                <div>
                  <h6 className="mb-0 fw-semibold">Error!</h6>
                  <small>{postInvoiceError}</small>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostInvoiceError(false)}></button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-warning alert-dismissible fade show shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-circle-fill me-3 fs-5"></i>
                <div>
                  <h6 className="mb-0 fw-semibold">Connection Issue</h6>
                  <small>{error}</small>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError(null)}></button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="row">
        <div className="col-12">
          {/* Summary Stats Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="mb-0 fw-semibold text-dark">
                    <i className="bi bi-bar-chart me-2 text-danger"></i>
                    Overview
                  </h5>
                  <small className="text-muted">
                    {loading ? 'Loading...' : `${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'} total`}
                  </small>
                </div>
                <div className="col-auto">
                  <div className="d-flex gap-2">
                    <span className="badge bg-danger">Active</span>
                    <span className="badge bg-light text-dark">{new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standalone Table */}
          <div className="shadow-sm rounded-4">
            <InvoiceList
              invoices={invoices}
              loading={loading}
              error={error}
              onEdit={handleEditInvoice}
              onViewDetails={handleViewDetails}
              onPostInvoice={handleInitiatePostInvoice}
            />
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal (Remains) */}
      <InvoiceDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        invoice={currentInvoice}
        parties={parties} // Pass parties to help display party name
      />

      {/* Invoice Posting Confirmation Modal */}
      {showPostingConfirmation && currentInvoice && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Invoice Posting</h5>
                <button type="button" className="btn-close" onClick={() => setShowPostingConfirmation(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="fw-bold">Are you sure you want to post Invoice #{currentInvoice.document_no}?</p>
                <p>This action will generate accounting transactions and cannot be directly undone (only reversed with a new entry).</p>
                <p>Please select the payment method:</p>
                <div className="d-flex gap-3 mt-3">
                  <button
                    type="button"
                    className="btn btn-success flex-fill"
                    onClick={() => handleConfirmPostInvoice('Cash')}
                  >
                    <i className="bi bi-cash me-2"></i> Cash Sale (Paid Now)
                  </button>
                  <button
                    type="button"
                    className="btn btn-info flex-fill"
                    onClick={() => handleConfirmPostInvoice('Credit')}
                  >
                    <i className="bi bi-credit-card me-2"></i> Credit Sale (Pay Later)
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostingConfirmation(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicePage;
