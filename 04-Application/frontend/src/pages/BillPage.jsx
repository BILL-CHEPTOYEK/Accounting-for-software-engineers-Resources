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
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-wallet-fill me-2 text-primary"></i> Bills (Purchases & Expenses)</span>
        <button className="btn btn-primary text-white shadow-sm" onClick={handleCreateNewBill}>
          <i className="bi bi-plus-circle me-2"></i> Record New Bill
        </button>
      </h2>

      {postBillSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> Bill posted successfully!
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostBillSuccess(false)}></button>
        </div>
      )}
      {postBillError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {postBillError}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setPostBillError(false)}></button>
        </div>
      )}
      {error && ( // General data loading error
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Bill List Table */}
      <BillList
        bills={bills}
        loading={loading}
        error={error}
        onEdit={handleEditBill}
        onViewDetails={handleViewDetails}
        onPostBill={handleInitiatePostBill}
      />

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
