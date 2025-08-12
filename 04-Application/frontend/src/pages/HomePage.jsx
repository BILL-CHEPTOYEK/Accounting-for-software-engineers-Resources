// /04-Application/backend/frontend/src/pages/HomePage.jsx

import React from 'react';

function HomePage({ setCurrentPage }) {
  return (
    <div className="text-center py-5">
      <h1 className="display-4 fw-bold text-primary mb-3">
        Welcome to Your Accounting System 📊
      </h1>
      <p className="lead text-secondary mb-5">
        Manage your parties, invoices, accounts, and transactions with ease.
      </p>
      <div className="d-flex flex-wrap justify-content-center gap-3">
        <button
          className="btn btn-lg btn-info shadow-sm text-white"
          onClick={() => setCurrentPage('parties')}
        >
          <i className="bi bi-people-fill me-2"></i> Parties
        </button>
        <button
          className="btn btn-lg btn-warning shadow-sm text-white"
          onClick={() => setCurrentPage('invoices')}
        >
          <i className="bi bi-receipt-cutoff me-2"></i> Invoices
        </button>
        <button
          className="btn btn-lg btn-success shadow-sm text-white"
          onClick={() => setCurrentPage('transactions')}
        >
          <i className="bi bi-wallet-fill me-2"></i> Transactions
        </button>
        <button
          className="btn btn-lg btn-secondary shadow-sm"
          onClick={() => setCurrentPage('accountTypes')}
        >
          <i className="bi bi-bar-chart-fill me-2"></i> Account Types
        </button>
        <button
          className="btn btn-lg btn-secondary shadow-sm"
          onClick={() => setCurrentPage('chartOfAccounts')}
        >
          <i className="bi bi-journal-check me-2"></i> Chart of Accounts
        </button>
        <button
          className="btn btn-lg btn-secondary shadow-sm"
          onClick={() => setCurrentPage('branches')}
        >
          <i className="bi bi-building-fill me-2"></i> Branches
        </button>
        <button
          className="btn btn-lg btn-secondary shadow-sm"
          onClick={() => setCurrentPage('users')}
        >
          <i className="bi bi-person-circle me-2"></i> Users
        </button>
      </div>
    </div>
  );
}

export default HomePage;