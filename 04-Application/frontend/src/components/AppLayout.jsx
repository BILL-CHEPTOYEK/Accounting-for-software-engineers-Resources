// /04-Application/frontend/src/components/AppLayout.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { tokenManager } from '../services/api';
// Import page components
import HomePage from '../pages/HomePage';
import PartyPage from '../pages/PartyPage';
import InvoicePage from '../pages/InvoicePage';
import InvoiceFormPage from '../pages/InvoiceFormPage';
import BillPage from '../pages/BillPage';
import BillFormPage from '../pages/BillFormPage';
import TransactionPage from '../pages/TransactionPage';
import RecordJournalEntryPage from '../pages/RecordJournalEntryPage';
import AccountTypePage from '../pages/AccountTypePage';
import ChartOfAccountPage from '../pages/ChartOfAccountPage';
import BranchPage from '../pages/BranchPage';
import UserPage from '../pages/UserPage';
import PartiesPaymentPage from '../pages/PartiesPaymentPage';
import ReportsPage from '../pages/ReportsPage';

function AppLayout({ setIsAuthenticated }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get current user data
    const userData = tokenManager.getUser();
    setCurrentUser(userData);
  }, []);

  const navigateToPage = (pageName, data = null) => {
    const pageUrls = {
      'home': '/dashboard',
      'parties': '/parties', 
      'invoices': '/invoices',
      'invoiceForm': '/invoices/new',
      'bills': '/bills',
      'billForm': '/bills/new', 
      'parties-payment': '/payments',
      'transactions': '/transactions',
      'recordJournalEntry': '/transactions/new',
      'accountTypes': '/account-types',
      'chartOfAccounts': '/chart-of-accounts',
      'reports': '/reports',
      'branches': '/branches',
      'users': '/users'
    };
    
    const url = pageUrls[pageName] || `/${pageName}`;
    navigate(url, { state: data });
  };

  const handleLogout = () => {
    tokenManager.logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const menuItems = [
    { page: 'home', icon: 'house-door-fill', label: 'Dashboard' },
    { page: 'parties', icon: 'people-fill', label: 'Parties' },
    { page: 'invoices', icon: 'receipt-cutoff', label: 'Invoices', subPages: ['invoiceForm'] },
    { page: 'bills', icon: 'wallet-fill', label: 'Bills', subPages: ['billForm'] },
    { page: 'parties-payment', icon: 'cash-coin', label: 'Payments' },
    { page: 'transactions', icon: 'arrow-left-right', label: 'Transactions', subPages: ['recordJournalEntry'] },
    { page: 'reports', icon: 'file-earmark-text', label: 'Reports' },
    { page: 'accountTypes', icon: 'bar-chart-fill', label: 'Account Types' },
    { page: 'chartOfAccounts', icon: 'journal-check', label: 'Chart of Accounts' },
    { page: 'branches', icon: 'building-fill', label: 'Branches' },
    { page: 'users', icon: 'person-circle', label: 'Users' },
  ];

  return (
    <div className="d-flex vh-100 bg-primary overflow-hidden">
      {/* Improved Sidebar */}
      <nav 
        className={`sidebar d-flex flex-column flex-shrink-0 shadow-lg vh-100 ${
          sidebarCollapsed ? 'sidebar-collapsed' : ''
        }`} 
        style={{ 
          width: sidebarCollapsed ? '80px' : '280px',
          background: 'linear-gradient(135deg, #1a1d29 0%, #26293b 50%, #1f2937 100%)',
          transition: 'width 0.3s ease-in-out',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="d-flex align-items-center justify-content-between">
            {!sidebarCollapsed && (
              <div className="d-flex align-items-center text-white">
                <i className="bi bi-calculator fs-3 me-2" style={{ color: '#60a5fa' }}></i>
                <div>
                  <div className="fs-5 fw-bold">AccSystem</div>
                  <div className="small" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>v1.0</div>
                </div>
              </div>
            )}
            <button 
              className="btn btn-outline-light btn-sm border-0"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#e5e7eb'
              }}
            >
              <i className={`bi bi-${sidebarCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-grow-1 overflow-y-auto py-3">
          <div className="nav flex-column px-2">
            {menuItems.map((item) => {
              // Get current path for checking active state
              const currentPath = location.pathname;
              
              // Define URL mappings
              const pageUrls = {
                'home': '/dashboard',
                'parties': '/parties', 
                'invoices': '/invoices',
                'bills': '/bills',
                'parties-payment': '/payments',
                'transactions': '/transactions',
                'accountTypes': '/account-types',
                'chartOfAccounts': '/chart-of-accounts',
                'reports': '/reports',
                'branches': '/branches',
                'users': '/users'
              };
              
              // Check if current item is active
              const itemUrl = pageUrls[item.page] || `/${item.page}`;
              let isActive = currentPath === itemUrl;
              
              // Check subpages for transactions and other items with subpages
              if (!isActive && item.subPages) {
                isActive = item.subPages.some(subPage => {
                  if (subPage === 'recordJournalEntry') {
                    return currentPath === '/transactions/new';
                  }
                  if (subPage === 'invoiceForm') {
                    return currentPath === '/invoices/new';
                  }
                  if (subPage === 'billForm') {
                    return currentPath === '/bills/new';
                  }
                  return false;
                });
              }
              
              return (
                <div key={item.page} className="nav-item mb-1">
                  <button
                    className="nav-link btn text-start w-100 border-0 rounded-3 d-flex align-items-center"
                    onClick={() => navigateToPage(item.page)}
                    style={{
                      transition: 'all 0.2s ease-in-out',
                      minHeight: '44px',
                      backgroundColor: isActive ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                      color: isActive ? '#ffffff' : '#d1d5db',
                      borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                      fontWeight: isActive ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.color = '#ffffff';
                        e.target.style.transform = 'translateX(4px)';
                        e.target.style.borderLeft = '3px solid rgba(96, 165, 250, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#d1d5db';
                        e.target.style.transform = 'translateX(0)';
                        e.target.style.borderLeft = '3px solid transparent';
                      }
                    }}
                  >
                    <i 
                      className={`bi bi-${item.icon} flex-shrink-0 ${
                        sidebarCollapsed ? 'fs-5' : 'me-3 fs-6'
                      }`}
                      style={{ 
                        width: sidebarCollapsed ? 'auto' : '20px',
                        color: isActive ? '#60a5fa' : '#9ca3af'
                      }}
                    ></i>
                    {!sidebarCollapsed && (
                      <span className="fw-medium" style={{
                        fontWeight: isActive ? '600' : '500'
                      }}>{item.label}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          {!sidebarCollapsed ? (
            <div className="dropdown dropup">
              <button
                className="btn w-100 d-flex align-items-center text-start border-0"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px'
                }}
              >
                <div className="bg-gradient rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3" 
                     style={{ 
                       width: '36px', 
                       height: '36px', 
                       fontSize: '14px',
                       background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                     }}>
                  {currentUser ? `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}` : 'U'}
                </div>
                <div className="flex-grow-1 text-white">
                  <div className="fw-semibold small">
                    {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'User'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {currentUser?.role || 'User'}
                  </div>
                </div>
                <i className="bi bi-three-dots-vertical" style={{ color: 'rgba(255, 255, 255, 0.7)' }}></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mb-2">
                <li>
                  <h6 className="dropdown-header">
                    <i className="bi bi-person-circle me-2"></i>
                    Account
                  </h6>
                </li>
                <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
                <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>Profile</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Sign out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="text-center">
              <div className="dropdown dropup">
                <button
                  className="btn border-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="User menu"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px'
                  }}
                >
                  <div className="bg-gradient rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" 
                       style={{ 
                         width: '32px', 
                         height: '32px', 
                         fontSize: '12px',
                         background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                       }}>
                    {currentUser ? `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}` : 'U'}
                  </div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mb-2">
                  <li><h6 className="dropdown-header">Account</h6></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>Profile</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Sign out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-bottom p-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-0 text-dark fw-bold">
                {(() => {
                  const currentPath = location.pathname;
                  const pathToPageMap = {
                    '/dashboard': 'Dashboard',
                    '/parties': 'Parties',
                    '/invoices': 'Invoices',
                    '/invoices/new': 'New Invoice',
                    '/bills': 'Bills', 
                    '/bills/new': 'New Bill',
                    '/payments': 'Payments',
                    '/transactions': 'Transactions',
                    '/transactions/new': 'New Journal Entry',
                    '/account-types': 'Account Types',
                    '/chart-of-accounts': 'Chart of Accounts',
                    '/reports': 'Reports',
                    '/branches': 'Branches',
                    '/users': 'Users'
                  };
                  return pathToPageMap[currentPath] || 'Dashboard';
                })()}
              </h5>
              <small className="text-muted">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </small>
            </div>
            <div className="d-flex align-items-center">
              <div className="text-end me-3">
                <div className="fw-semibold text-dark">
                  {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Welcome'}
                </div>
                <small className="text-muted">{currentUser?.email || ''}</small>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow-1 p-4 bg-light overflow-auto">
          <div className="container-fluid">
            <Routes>
              <Route path="/dashboard" element={<HomePage setCurrentPage={navigateToPage} />} />
              <Route path="/parties" element={<PartyPage />} />
              <Route path="/invoices" element={<InvoicePage setCurrentPage={navigateToPage} />} />
              <Route path="/invoices/new" element={<InvoiceFormPage setCurrentPage={navigateToPage} invoiceToEdit={location.state} />} />
              <Route path="/bills" element={<BillPage setCurrentPage={navigateToPage} />} />
              <Route path="/bills/new" element={<BillFormPage setCurrentPage={navigateToPage} billToEdit={location.state} />} />
              <Route path="/payments" element={<PartiesPaymentPage setCurrentPage={navigateToPage} />} />
              <Route path="/transactions" element={<TransactionPage setCurrentPage={navigateToPage} />} />
              <Route path="/transactions/new" element={<RecordJournalEntryPage setCurrentPage={navigateToPage} transactionToEdit={location.state} />} />
              <Route path="/account-types" element={<AccountTypePage />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccountPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/branches" element={<BranchPage />} />
              <Route path="/users" element={<UserPage />} />
              <Route path="/" element={<HomePage setCurrentPage={navigateToPage} />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-top text-center text-muted py-3">
          <small>&copy; {new Date().getFullYear()} Accounting System. All rights reserved.</small>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
