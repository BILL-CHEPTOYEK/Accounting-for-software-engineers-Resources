// /04-Application/backend/frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { partyApi, invoiceApi, transactionApi, chartOfAccountApi, userApi, branchApi } from '../services/api';

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalParties: 0,
    totalInvoices: 0,
    totalAccounts: 0,
    totalUsers: 0,
    totalBranches: 0,
    recentTransactions: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch counts for all entities
        const [partiesRes, invoicesRes, accountsRes, usersRes, branchesRes] = await Promise.all([
          partyApi.getAllParties(),
          invoiceApi.getAllInvoices(),
          chartOfAccountApi.getAllChartOfAccounts(),
          userApi.getAllUsers(),
          branchApi.getAllBranches(),
        ]);

        // Fetch recent transactions
        const transactionsRes = await transactionApi.getAllTransactions();

        setStats({
          totalParties: partiesRes.data.length,
          totalInvoices: invoicesRes.data.length,
          totalAccounts: accountsRes.data.length,
          totalUsers: usersRes.data.length,
          totalBranches: branchesRes.data.length,
          // Sort transactions by creation date (descending) and take the latest 5
          recentTransactions: transactionsRes.data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5),
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check the backend server and network connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once after the initial render

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4">
        <i className="bi bi-speedometer2 me-2"></i> Accounting Dashboard Overview
      </h2>

      {/* Overview Cards - Now with different vibrant background colors */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
        <div className="col">
          {/* Parties Card: Using bg-primary */}
          <div className="card h-100 shadow-sm border-primary bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-people-fill me-2"></i> Total Parties</h5>
              <p className="card-text display-4 fw-bold">{stats.totalParties}</p>
            </div>
          </div>
        </div>
        <div className="col">
          {/* Invoices Card: Using bg-success */}
          <div className="card h-100 shadow-sm border-success bg-success text-white">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-receipt-cutoff me-2"></i> Total Invoices</h5>
              <p className="card-text display-4 fw-bold">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>
        <div className="col">
          {/* Accounts Card: Using bg-info */}
          <div className="card h-100 shadow-sm border-info bg-info text-white">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-journal-check me-2"></i> Total Accounts</h5>
              <p className="card-text display-4 fw-bold">{stats.totalAccounts}</p>
            </div>
          </div>
        </div>
        <div className="col">
          {/* Users Card: Using bg-danger */}
          <div className="card h-100 shadow-sm border-danger bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-person-circle me-2"></i> Total Users</h5>
              <p className="card-text display-4 fw-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="col">
          {/* Branches Card: Using bg-warning */}
          <div className="card h-100 shadow-sm border-warning bg-warning text-dark"> {/* text-dark for better contrast on yellow */}
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-building-fill me-2"></i> Total Branches</h5>
              <p className="card-text display-4 fw-bold">{stats.totalBranches}</p>
            </div>
          </div>
        </div>
        {/* Placeholder for more complex financial summaries */}
        <div className="col">
          {/* Keeping this one as bg-light or bg-secondary for a neutral summary */}
          <div className="card h-100 shadow-sm border-light bg-light text-dark">
            <div className="card-body">
              <h5 className="card-title text-muted"><i className="bi bi-graph-up me-2"></i> Financial Summary</h5>
              <p className="card-text text-muted small">
                Profit/Loss, Balance Sheet insights will appear here once reporting APIs are developed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0"><i className="bi bi-clock-history me-2"></i> Recent Transactions</h5>
        </div>
        <div className="card-body p-0">
          {stats.recentTransactions.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Transaction No.</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th className="text-end">Debit</th>
                    <th className="text-end">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((tx) => (
                    <tr key={tx.transaction_id}>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>{tx.transaction_no}</td>
                      <td>{tx.account ? tx.account.name : 'N/A'}</td>
                      <td>{tx.description}</td>
                      <td className="text-end text-danger">{tx.debit > 0 ? `$${tx.debit}` : '-'}</td>
                      <td className="text-end text-success">{tx.credit > 0 ? `$${tx.credit}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-3 text-center text-muted">No recent transactions to display. Start by recording some entries!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
