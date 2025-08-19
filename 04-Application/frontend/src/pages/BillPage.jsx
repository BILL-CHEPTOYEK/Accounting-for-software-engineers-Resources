// /04-Application/backend/frontend/src/pages/BillPage.jsx

import React, { useState, useEffect } from 'react';
import { billApi, partyApi, userApi, branchApi, chartOfAccountApi } from '../services/api'; 
import BillList from '../components/BillList'; 
import BillDetailModal from '../components/BillDetailModal'; 

function BillPage({ setCurrentPage }) {
  const [bills, setBills] = useState([]);
  const [parties, setParties] = useState([]); // All parties (to filter for suppliers)
  const [accounts, setAccounts] = useState([]); // Chart of Accounts for BillLineItem dropdown
  const [users, setUsers] = useState([]); // Users for 'addedby' field
  const [branches, setBranches] = useState([]); // Branches for 'branch_id' field

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postBillError, setPostBillError] = useState(null);
  const [postBillSuccess, setPostBillSuccess] = useState(false);

  const [currentBill, setCurrentBill] = useState(null); // For viewing details
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPostingConfirmation, setShowPostingConfirmation] = useState(false);

  // Function to fetch all bills and necessary lookup data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [billsRes, partiesRes, accountsRes, usersRes, branchesRes] = await Promise.all([
        billApi.getAllBills(),
        partyApi.getAllParties(),
        chartOfAccountApi.getAllChartOfAccounts(), // Fetch all accounts
        userApi.getAllUsers(),
        branchApi.getAllBranches(),
      ]);
      setBills(billsRes.data);
      setParties(partiesRes.data);
      setAccounts(accountsRes.data);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error('Failed to fetch bill or lookup data:', err);
      setError('Failed to load bills data. Please check your network and backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNewBill = () => {
    setCurrentPage('billForm', null); // Navigate to BillFormPage for new bill
  };

  const handleEditBill = (bill) => {
    setCurrentPage('billForm', bill); // Navigate to BillFormPage with bill data for editing
  };

  const handleViewDetails = (bill) => {
    setCurrentBill(bill); // Set data for 'details' mode
    setShowDetailModal(true);
  };

  // Handler for initiating the bill posting process
  const handleInitiatePostBill = (bill) => {
    setCurrentBill(bill); // Set the bill to be posted
    setPostBillError(null);
    setPostBillSuccess(false);
    setShowPostingConfirmation(true);
  };

  // Handler for confirming and executing bill posting
  const handleConfirmPostBill = async (paymentMethod) => {
    setShowPostingConfirmation(false);
    setPostBillError(null);
    setPostBillSuccess(false);

    if (!currentBill) {
      setPostBillError('No bill selected for posting.');
      return;
    }

    // addedby and branch_id should come from user session
    // using the first available user/branch as my placeholder
    const defaultUser = users[0]?.user_id;
    const defaultBranch = branches[0]?.branch_id;

    if (!defaultUser || !defaultBranch) {
      setPostBillError('Cannot post bill: User or Branch data not loaded. Please ensure you have users and branches created.');
      return;
    }

    try {
      await billApi.postBill(currentBill.bill_id, {
        payment_method: paymentMethod,
        addedby: defaultUser,
        branch_id: defaultBranch,
      });
      setPostBillSuccess(true);
      fetchData(); // Re-fetch all data to update bill statuses
    } catch (err) {
      console.error('Error posting bill:', err);
      setPostBillError('Failed to post bill: ' + (err.response?.data?.error || err.message));
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
                <i className="bi bi-wallet-fill me-3 text-primary"></i>
                Supplier Bills
              </h1>
              <p className="text-muted mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Manage purchase bills, track expenses, and post to accounting system
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
                className="btn btn-primary shadow-sm px-4" 
                onClick={handleCreateNewBill}
                title="Record New Bill"
              >
                <i className="bi bi-plus-circle me-2"></i>
                <span className="fw-semibold">New Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS/ERROR ALERTS - Enhanced Design */}
      {postBillSuccess && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                <div>
                  <h6 className="mb-0 fw-semibold">Success!</h6>
                  <small>Bill posted successfully to accounting system</small>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostBillSuccess(false)}></button>
            </div>
          </div>
        </div>
      )}

      {postBillError && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-3 fs-5"></i>
                <div>
                  <h6 className="mb-0 fw-semibold">Error!</h6>
                  <small>{postBillError}</small>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostBillError(false)}></button>
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
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="mb-0 fw-semibold text-dark">
                    <i className="bi bi-bar-chart me-2 text-primary"></i>
                    Overview
                  </h5>
                  <small className="text-muted">
                    {loading ? 'Loading...' : `${bills.length} ${bills.length === 1 ? 'bill' : 'bills'} total`}
                  </small>
                </div>
                <div className="col-auto">
                  <div className="d-flex gap-2">
                    <span className="badge bg-primary">Active</span>
                    <span className="badge bg-light text-dark">{new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standalone Table */}
          <div className="shadow-sm rounded-4">
            <BillList
              bills={bills}
              loading={loading}
              error={error}
              onEdit={handleEditBill}
              onViewDetails={handleViewDetails}
              onPostBill={handleInitiatePostBill}
            />
          </div>
        </div>
      </div>

      {/* Bill Detail Modal */}
      <BillDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        bill={currentBill}
        parties={parties} // Pass parties to help display party name
        accounts={accounts} // Pass accounts to help display account names in line items
      />

      {/* Bill Posting Confirmation Modal */}
      {showPostingConfirmation && currentBill && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><i className="bi bi-patch-check-fill me-2"></i> Confirm Bill Posting</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPostingConfirmation(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="fw-bold">Are you sure you want to process Bill #{currentBill.document_no}?</p>
                <p>This action will generate accounting transactions and update your Accounts Payable or Cash balance.</p>
                <p>Please select the payment method:</p>
                <div className="d-flex gap-3 mt-3">
                  <button
                    type="button"
                    className="btn btn-success flex-fill"
                    onClick={() => handleConfirmPostBill('Cash')}
                  >
                    <i className="bi bi-cash me-2"></i> Cash Payment (Paid Now)
                  </button>
                  <button
                    type="button"
                    className="btn btn-info flex-fill"
                    onClick={() => handleConfirmPostBill('Credit')}
                  >
                    <i className="bi bi-credit-card me-2"></i> Credit Purchase (Pay Later)
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

export default BillPage;
