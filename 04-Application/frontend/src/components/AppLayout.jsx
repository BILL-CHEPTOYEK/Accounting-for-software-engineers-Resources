// /04-Application/backend/frontend/src/components/AppLayout.jsx

import React, { useState } from 'react';
// Import page components from the new 'pages' directory
import HomePage from '../pages/HomePage';
import PartyPage from '../pages/PartyPage';
import InvoicePage from '../pages/InvoicePage';
import TransactionPage from '../pages/TransactionPage';
import AccountTypePage from '../pages/AccountTypePage';
import ChartOfAccountPage from '../pages/ChartOfAccountPage';
import BranchPage from '../pages/BranchPage';
import UserPage from '../pages/UserPage';

function AppLayout() {
  const [currentPage, setCurrentPage] = useState('home'); // State to manage current page view

  // Function to render the correct page component based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'parties':
        return <PartyPage />;
      case 'invoices':
        return <InvoicePage />;
      case 'transactions':
        return <TransactionPage />;
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
    // Main container: d-flex makes it a flex row, vh-100 ensures exact viewport height,
    // overflow-hidden prevents the entire document from scrolling.
    <div className="d-flex vh-100 bg-light overflow-hidden">
      {/* Sidebar - Fixed width, takes full viewport height, content will scroll if too long */}
      <nav className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white shadow-lg vh-100" style={{ width: '200px' }}>
        <a href="#" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none" onClick={() => setCurrentPage('home')}>
          <i className="bi bi-bank fs-4 me-2"></i>
          <span className="fs-5 fw-bold">Acc. App</span>
        </a>
        <hr className="bg-white" />
        {/* Added overflow-y-auto to the ul to allow sidebar links to scroll internally if they overflow */}
        <ul className="nav nav-pills flex-column mb-auto overflow-y-auto">
          <li className="nav-item">
            <a href="#" className={`nav-link text-white ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
              <i className="bi bi-house-door-fill me-2"></i>
              Home
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'parties' ? 'active' : ''}`} onClick={() => setCurrentPage('parties')}>
              <i className="bi bi-people-fill me-2"></i>
              Parties
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'invoices' ? 'active' : ''}`} onClick={() => setCurrentPage('invoices')}>
              <i className="bi bi-receipt-cutoff me-2"></i>
              Invoices
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'transactions' ? 'active' : ''}`} onClick={() => setCurrentPage('transactions')}>
              <i className="bi bi-wallet-fill me-2"></i>
              Transactions
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'accountTypes' ? 'active' : ''}`} onClick={() => setCurrentPage('accountTypes')}>
              <i className="bi bi-bar-chart-fill me-2"></i>
              Acc. Types
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'chartOfAccounts' ? 'active' : ''}`} onClick={() => setCurrentPage('chartOfAccounts')}>
              <i className="bi bi-journal-check me-2"></i>
              Chart of Acc.
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'branches' ? 'active' : ''}`} onClick={() => setCurrentPage('branches')}>
              <i className="bi bi-building-fill me-2"></i>
              Branches
            </a>
          </li>
          <li>
            <a href="#" className={`nav-link text-white ${currentPage === 'users' ? 'active' : ''}`} onClick={() => setCurrentPage('users')}>
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

      {/* Right-side container: flex column to stack main content and footer */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Main Content Area - flex-grow-1 ensures it takes available space, overflow-auto for internal scrolling */}
        <main className="flex-grow-1 p-3 p-md-5 bg-white shadow-sm rounded-lg m-3 overflow-auto">
          {renderPage()}
        </main>

        {/* Footer Section - pushed to the bottom by flex-grow-1 on main */}
        <footer className="w-100 text-center text-muted small py-9 bg-light">
          <p>&copy; {new Date().getFullYear()} Accounting System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
