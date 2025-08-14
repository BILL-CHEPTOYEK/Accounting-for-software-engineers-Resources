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
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-receipt-cutoff me-2 text-danger"></i> Invoices</span>
        <button className="btn btn-warning text-white shadow-sm" onClick={handleCreateNewInvoice}>
          <i className="bi bi-plus-circle me-2"></i> Create New Invoice
        </button>
      </h2>

      {postInvoiceSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> Invoice posted successfully!
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostInvoiceSuccess(false)}></button>
        </div>
      )}
      {postInvoiceError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {postInvoiceError}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostInvoiceError(false)}></button>
        </div>
      )}
      {error && ( // General data loading error
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError(null)}></button>
        </div>
      )}


      {/* Invoice List Table */}
      <InvoiceList
        invoices={invoices}
        loading={loading}
        error={error} // Pass general error to list as well
        onEdit={handleEditInvoice}
        onViewDetails={handleViewDetails}
        onPostInvoice={handleInitiatePostInvoice} // Pass the new handler for posting
      />

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
