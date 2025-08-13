// /04-Application/backend/frontend/src/pages/TransactionPage.jsx

import React, { useState, useEffect } from 'react';
import { transactionApi, chartOfAccountApi, userApi, branchApi } from '../services/api';
import TransactionList from '../components/TransactionList'; // Component to display the table
import TransactionFormModal from '../components/TransactionFormModal'; // Modal for adding/editing transactions
import TransactionDetailModal from '../components/TransactionDetailModal'; // Modal for viewing single line details
import ReverseTransactionModal from '../components/ReverseTransactionModal'; // Modal for reversing journal entries

function TransactionPage() {
  const [transactions, setTransactions] = useState([]); // State to hold all transaction lines
  const [accounts, setAccounts] = useState([]); // For Chart of Accounts dropdown
  const [users, setUsers] = useState([]);       // For Users dropdown (addedby)
  const [branches, setBranches] = useState([]); // For Branches dropdown

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false); // Controls add/edit form modal visibility
  const [currentTransactionToEdit, setCurrentTransactionToEdit] = useState(null); // For editing a single line

  const [showDetailModal, setShowDetailModal] = useState(false); // Controls detail modal visibility
  const [currentTransactionToView, setCurrentTransactionToView] = useState(null); // For viewing single line details

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
  const handleAddTransaction = () => {
    setCurrentTransactionToEdit(null); // Clear data for 'add' mode
    setShowFormModal(true);
  };

  // Note: Editing a transaction is only allowed if it's NOT posted.
  const handleEditTransaction = (transaction) => {
    if (transaction.is_posted) {
      alert('Cannot edit a posted transaction. Please use the "Reverse Journal Entry" option for corrections.');
      return;
    }
    setCurrentTransactionToEdit(transaction); // Set data for 'edit' mode
    setShowFormModal(true);
  };

  const handleViewDetails = (transaction) => {
    setCurrentTransactionToView(transaction); // Set data for 'details' mode
    setShowDetailModal(true);
  };

  const handleReverseJournalEntry = (transactionNo) => {
    setTransactionNoToReverse(transactionNo); // Set the transaction_no to be reversed
    setShowReverseModal(true);
  };

  // Handle saving a new journal entry or updating a single transaction line
  const handleSaveTransaction = async (data) => {
    try {
      if (currentTransactionToEdit) {
        // This path is for updating a single EXISTING, UNPOSTED transaction line
        await transactionApi.updateTransaction(currentTransactionToEdit.transaction_id, data);
        alert('Transaction line updated successfully!');
      } else {
        // This path is for creating a NEW JOURNAL ENTRY (array of lines)
        await transactionApi.createTransaction(data);
        alert('Journal Entry created successfully!');
      }
      setShowFormModal(false); // Close the form modal
      fetchData(); // Re-fetch all data to update the list and counts
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError('Error saving transaction: ' + (err.response?.data?.error || err.message));
      alert('Failed to save transaction: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
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
      setError('Error reversing transaction: ' + (err.response?.data?.error || err.message));
      alert('Failed to reverse transaction: ' + (err.response?.data?.error || 'An unexpected error occurred.'));
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-wallet-fill me-2 text-success"></i> Journal Entries & Transactions</span>
        {/* Button to open the modal for creating a new Journal Entry */}
        <button className="btn btn-success text-white shadow-sm" onClick={handleAddTransaction}>
          <i className="bi bi-plus-circle me-2"></i> Record New Journal Entry
        </button>
      </h2>

      {/* Transaction List Table */}
      <TransactionList
        transactions={transactions}
        loading={loading}
        error={error}
        onEdit={handleEditTransaction}
        onViewDetails={handleViewDetails}
        onReverseJournalEntry={handleReverseJournalEntry}
        accounts={accounts} // Pass accounts to list for display
        users={users}     // Pass users to list for display
        branches={branches} // Pass branches to list for display
      />

      {/* Add/Edit Transaction Form Modal */}
      <TransactionFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSaveTransaction}
        transaction={currentTransactionToEdit} // Pass transaction for editing (null for adding)
        accounts={accounts} // Pass for account dropdown
        users={users}       // Pass for addedby dropdown
        branches={branches} // Pass for branch dropdown
      />

      {/* View Single Transaction Line Details Modal */}
      <TransactionDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        transaction={currentTransactionToView}
        accounts={accounts}
        users={users}
        branches={branches}
      />

      {/* Reverse Journal Entry Modal */}
      <ReverseTransactionModal
        show={showReverseModal}
        onClose={() => setShowReverseModal(false)}
        onSubmit={handleConfirmReversal}
        transactionNo={transactionNoToReverse} // Pass the transaction number to be reversed
        users={users}     // For user selection in reversal form
        branches={branches} // For branch selection in reversal form
      />
    </div>
  );
}

export default TransactionPage;
