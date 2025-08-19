// /04-Application/backend/frontend/src/pages/TransactionPage.jsx

import React, { useState, useEffect } from 'react';
import { transactionApi, chartOfAccountApi, userApi, branchApi } from '../services/api';
import TransactionList from '../components/TransactionList'; // Component to display the table
import TransactionDetailModal from '../components/TransactionDetailModal'; // Modal for viewing full JE details
import ReverseTransactionModal from '../components/ReverseTransactionModal'; // Modal for reversing journal entries

function TransactionPage({ setCurrentPage }) { // Receive setCurrentPage for navigation
  const [transactions, setTransactions] = useState([]); // State to hold all transaction lines
  const [accounts, setAccounts] = useState([]); // For Chart of Accounts dropdown
  const [users, setUsers] = useState([]);       // For Users dropdown (addedby)
  const [branches, setBranches] = useState([]); // For Branches dropdown

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false); // Controls detail modal visibility
  const [transactionNoToView, setTransactionNoToView] = useState(null); // Holds transaction_no for detail view

  const [showReverseModal, setShowReverseModal] = useState(false); // Controls reversal modal visibility
  const [transactionNoToReverse, setTransactionNoToReverse] = useState(null); // Holds transaction_no for reversal

  // Function to fetch all necessary data from the backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [transactionsRes, accountsRes, usersRes, branchesRes] = await Promise.all([
        transactionApi.getAllTransactions(),
        chartOfAccountApi.getAllChartOfAccounts(),
        userApi.getAllUsers(),
        branchApi.getAllBranches(),
      ]);
      setTransactions(transactionsRes.data);
      setAccounts(accountsRes.data);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error('Failed to fetch transaction data or related entities:', err);
      setError('Failed to load data. Please check your network connection and backend server.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for opening/closing modals and operations
  const handleRecordNewJournalEntry = () => {
    setCurrentPage('recordJournalEntry', null); // Navigate to new page, no transaction data
  };

  const handleEditTransaction = (transaction) => {
    // IMPORTANT: Only allow editing if the transaction line is NOT posted
    if (transaction.is_posted) {
      alert('Cannot directly edit a posted transaction line. Please use the "Reverse Journal Entry" option for corrections to the entire journal entry.');
      return;
    }
    setCurrentPage('recordJournalEntry', transaction); // Navigate to the record page with transaction data for editing
  };

  const handleViewDetails = (transactionNo) => { // Now expects transaction_no
    setTransactionNoToView(transactionNo);
    setShowDetailModal(true);
  };

  const handleReverseJournalEntry = (transactionNo) => {
    setTransactionNoToReverse(transactionNo); // Set the transaction_no to be reversed
    setShowReverseModal(true);
  };

  // Handle confirming and executing a journal entry reversal
  const handleConfirmReversal = async (reversalData) => {
    try {
      await transactionApi.reverseTransaction(reversalData);
      alert('Journal Entry reversed successfully!');
      setShowReverseModal(false); // Close the reversal modal
      fetchData(); // Re-fetch all data to show the new reversal entries
    } catch (err) {
      console.error('Error reversing transaction:', err);
      setError('Failed to reverse transaction: ' + (err.response?.data?.error || err.message));
      alert('Failed to reverse transaction: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Enhanced Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h3 fw-bold text-dark mb-0">
              <i className="bi bi-journal-text me-3 text-primary"></i>
              Journal Entries & Transactions
            </h2>
            <button 
              className="btn btn-primary btn-lg shadow-sm" 
              onClick={handleRecordNewJournalEntry}
            >
              <i className="bi bi-plus-circle me-2"></i> Record New Journal Entry
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      {!loading && !error && transactions.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-journal-check fs-1 text-success mb-2"></i>
                <h5 className="card-title text-muted">Total Entries</h5>
                <h3 className="text-primary fw-bold">{Object.keys(transactions.reduce((acc, tx) => {
                  acc[tx.transaction_no] = true;
                  return acc;
                }, {})).length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-arrow-up-circle fs-1 text-success mb-2"></i>
                <h5 className="card-title text-muted">Total Debits</h5>
                <h3 className="text-success fw-bold">${transactions.reduce((sum, tx) => sum + parseFloat(tx.debit || 0), 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-arrow-down-circle fs-1 text-danger mb-2"></i>
                <h5 className="card-title text-muted">Total Credits</h5>
                <h3 className="text-danger fw-bold">${transactions.reduce((sum, tx) => sum + parseFloat(tx.credit || 0), 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-check-circle fs-1 text-info mb-2"></i>
                <h5 className="card-title text-muted">Posted Entries</h5>
                <h3 className="text-info fw-bold">{transactions.filter(tx => tx.is_posted).reduce((acc, tx) => {
                  acc[tx.transaction_no] = true;
                  return acc;
                }, {}) && Object.keys(transactions.filter(tx => tx.is_posted).reduce((acc, tx) => {
                  acc[tx.transaction_no] = true;
                  return acc;
                }, {})).length}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Error Display */}
      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger border-0 shadow-sm" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Transaction List Table */}
      <TransactionList
        transactions={transactions}
        loading={loading}
        error={error}
        onEdit={handleEditTransaction} // Re-added onEdit prop
        onViewDetails={handleViewDetails} // Now passes transaction_no
        onReverseJournalEntry={handleReverseJournalEntry}
        accounts={accounts} // Pass accounts to list for display
        users={users}     // Pass users to list for display
        branches={branches} // Pass branches to list for display
      />

      {/* View Full Journal Entry Details Modal */}
      <TransactionDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedTransactionNo={transactionNoToView} // Pass the transaction_no for the modal to filter
        allTransactions={transactions} // Pass all transactions for filtering in modal
        accounts={accounts}
        users={users}
        branches={branches}
      />

      {/* Reverse Journal Entry Modal */}
      <ReverseTransactionModal
        show={showReverseModal}
        onClose={() => setShowReverseModal(false)}
        onSubmit={handleConfirmReversal}
        originalTransactionNo={transactionNoToReverse} // Pass the transaction number to be reversed
        users={users}     // For user selection in reversal form
        branches={branches} // For branch selection in reversal form
      />
    </div>
  );
}

export default TransactionPage;
