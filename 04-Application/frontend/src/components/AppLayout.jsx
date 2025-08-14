// /04-Application/backend/frontend/src/components/AppLayout.jsx

import React, { useState } from 'react';
// Import page components
import HomePage from '../pages/HomePage';
import PartyPage from '../pages/PartyPage';
import InvoicePage from '../pages/InvoicePage';
import InvoiceFormPage from '../pages/InvoiceFormPage';
import BillPage from '../pages/BillPage'; 
import BillFormPage from '../pages/BillFormPage'; // NEW: Import BillFor
import TransactionPage from '../pages/TransactionPage';
import RecordJournalEntryPage from '../pages/RecordJournalEntryPage';
import AccountTypePage from '../pages/AccountTypePage';
import ChartOfAccountPage from '../pages/ChartOfAccountPage';
import BranchPage from '../pages/BranchPage';
import UserPage from '../pages/UserPage';

function AppLayout() {
  const [currentAppState, setCurrentAppState] = useState({ page: 'home', data: null });

  const navigateToPage = (pageName, data = null) => {
    setCurrentAppState({ page: pageName, data: data });
  };

  const renderPage = () => {
    switch (currentAppState.page) {
      case 'home':
        return <HomePage setCurrentPage={navigateToPage} />;
      case 'parties':
        return <PartyPage />;
      case 'invoices':
        return <InvoicePage setCurrentPage={navigateToPage} />;
      case 'invoiceForm':
        return <InvoiceFormPage setCurrentPage={navigateToPage} invoiceToEdit={currentAppState.data} />;
      case 'bills': // NEW: Bills page route
        return <BillPage setCurrentPage={navigateToPage} />;
      case 'billForm': // NEW: Bill form page route
        return <BillFormPage setCurrentPage={navigateToPage} billToEdit={currentAppState.data} />;
      case 'transactions':
        return <TransactionPage setCurrentPage={navigateToPage} />;
      case 'recordJournalEntry':
        return <RecordJournalEntryPage setCurrentPage={navigateToPage} transactionToEdit={currentAppState.data} />;
      case 'accountTypes':
        return <AccountTypePage />;
      case 'chartOfAccounts':
        return <ChartOfAccountPage />;
      case 'branches':
        return <BranchPage />;
      case 'users':
        return <UserPage />;
      default:
        return <p className="text-danger">Page not found.</p>;
    }
  };

  return (
    <div className="d-flex vh-100 bg-light overflow-hidden">
      {/* Sidebar - Fixed width, takes full viewport height, content will scroll if too long */}
      <nav className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white shadow-lg vh-100" style={{ width: '200px' }}>
        <a href="#" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none" onClick={() => navigateToPage('home')}>
          <i className="bi bi-bank fs-4 me-2"></i>
          <span className="fs-5 fw-bold">Acc. App</span>
        </a>
        <hr className="bg-white" />
        <ul className="nav nav-pills flex-column mb-auto overflow-y-auto">
          <li className="nav-item">
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'home' ? 'active' : ''}`} onClick={() => navigateToPage('home')}>
              <i className="bi bi-house-door-fill me-2"></i>
              Home
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'parties' ? 'active' : ''}`} onClick={() => navigateToPage('parties')}>
              <i className="bi bi-people-fill me-2"></i>
              Parties
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'invoices' || currentAppState.page === 'invoiceForm' ? 'active' : ''}`} onClick={() => navigateToPage('invoices')}>
              <i className="bi bi-receipt-cutoff me-2"></i>
              Invoices
            </a>
          </li>
         
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'bills' || currentAppState.page === 'billForm' ? 'active' : ''}`} onClick={() => navigateToPage('bills')}>
              <i className="bi bi-wallet-fill me-2"></i> 
              Bills
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'transactions' ? 'active' : ''}`} onClick={() => navigateToPage('transactions')}>
              <i className="bi bi-wallet-fill me-2"></i>
              Transactions
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'recordJournalEntry' ? 'active' : ''}`} onClick={() => navigateToPage('recordJournalEntry')}>
              <i className="bi bi-journal-plus me-2"></i>
              Record JE
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'accountTypes' ? 'active' : ''}`} onClick={() => navigateToPage('accountTypes')}>
              <i className="bi bi-bar-chart-fill me-2"></i>
              Acc. Types
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'chartOfAccounts' ? 'active' : ''}`} onClick={() => navigateToPage('chartOfAccounts')}>
              <i className="bi bi-journal-check me-2"></i>
              Chart of Acc.
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'branches' ? 'active' : ''}`} onClick={() => navigateToPage('branches')}>
              <i className="bi bi-building-fill me-2"></i>
              Branches
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentAppState.page === 'users' ? 'active' : ''}`} onClick={() => navigateToPage('users')}>
              <i className="bi bi-person-circle me-2"></i>
              Users
            </a>
          </li>
        </ul>
        <hr className="bg-white" />
        {/* User profile section - optional */}
        <div className="dropdown">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://placehold.co/32x32/FFC107/FFFFFF?text=JD" alt="" width="32" height="32" className="rounded-circle me-2" />
            <strong>user</strong>
          </a>
          <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
            <li><a className="dropdown-item" href="#">New project...</a></li>
            <li><a className="dropdown-item" href="#">Settings</a></li>
            <li><a className="dropdown-item" href="#">Profile</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item" href="#">Sign out</a></li>
          </ul>
        </div>
      </nav>

      <div className="d-flex flex-column flex-grow-1">
        <main className="flex-grow-1 p-4 p-md-5 bg-white shadow-sm rounded-lg m-3 overflow-auto">
          {renderPage()}
        </main>

        <footer className="w-100 text-center text-muted small py-3">
          <p>&copy; {new Date().getFullYear()} Accounting System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
