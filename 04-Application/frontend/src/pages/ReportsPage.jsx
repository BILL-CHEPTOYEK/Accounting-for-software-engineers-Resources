// /04-Application/frontend/src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { transactionApi, chartOfAccountApi, accountTypeApi } from '../services/api';

function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Report states
  const [activeReport, setActiveReport] = useState('general-ledger');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [selectedAccount, setSelectedAccount] = useState('all');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsRes, accountsRes, accountTypesRes] = await Promise.all([
          transactionApi.getAllTransactions(),
          chartOfAccountApi.getAllChartOfAccounts(),
          accountTypeApi.getAllAccountTypes(),
        ]);
        
        setTransactions(transactionsRes.data);
        setAccounts(accountsRes.data);
        setAccountTypes(accountTypesRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return txDate >= start && txDate <= end && tx.is_posted;
  });

  // Calculate account balances
  const calculateAccountBalances = () => {
    const balances = {};
    
    accounts.forEach(account => {
      balances[account.account_id] = {
        account,
        debitTotal: 0,
        creditTotal: 0,
        balance: 0,
        transactions: []
      };
    });

    filteredTransactions.forEach(tx => {
      if (balances[tx.account_id]) {
        balances[tx.account_id].debitTotal += parseFloat(tx.debit || 0);
        balances[tx.account_id].creditTotal += parseFloat(tx.credit || 0);
        balances[tx.account_id].transactions.push(tx);
      }
    });

    // Calculate final balances based on account type
    Object.values(balances).forEach(balance => {
      const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
      const normalBalance = accountType?.normal_balance?.toLowerCase();
      
      if (normalBalance === 'debit') {
        balance.balance = balance.debitTotal - balance.creditTotal;
      } else {
        balance.balance = balance.creditTotal - balance.debitTotal;
      }
    });

    return balances;
  };

  // General Ledger Component
  const GeneralLedger = () => {
    const balances = calculateAccountBalances();
    const accountsWithActivity = Object.values(balances).filter(balance => 
      balance.transactions.length > 0 && 
      (selectedAccount === 'all' || balance.account.account_id.toString() === selectedAccount)
    );

    return (
      <div>
        <div className="row mb-4">
          <div className="col-md-4">
            <select 
              className="form-select"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.account_id} value={account.account_id}>
                  {account.account_code} - {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Single General Ledger Table */}
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-journal-text me-2"></i>
              General Ledger
              <small className="ms-3">Period: {dateRange.startDate} to {dateRange.endDate}</small>
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '180px' }}>Account</th>
                    <th style={{ width: '90px' }}>Date</th>
                    <th style={{ width: '140px' }}>Transaction #</th>
                    <th>Description</th>
                    <th className="text-end" style={{ width: '90px' }}>Debit</th>
                    <th className="text-end" style={{ width: '90px' }}>Credit</th>
                    <th className="text-end" style={{ width: '100px' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsWithActivity.map(balance => {
                    const sortedTransactions = balance.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    return sortedTransactions.map((tx, index) => {
                      // Calculate running balance for this account
                      const runningBalance = sortedTransactions
                        .slice(0, index + 1)
                        .reduce((sum, t) => {
                          const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
                          const normalBalance = accountType?.normal_balance?.toLowerCase();
                          if (normalBalance === 'debit') {
                            return sum + parseFloat(t.debit || 0) - parseFloat(t.credit || 0);
                          } else {
                            return sum + parseFloat(t.credit || 0) - parseFloat(t.debit || 0);
                          }
                        }, 0);

                      return (
                        <tr key={`${balance.account.account_id}-${tx.transaction_id}`}>
                          <td style={{ verticalAlign: 'top' }}>
                            {index === 0 && (
                              <div>
                                <div className="fw-semibold text-primary">{balance.account.account_code}</div>
                                <div className="small text-muted">{balance.account.name}</div>
                              </div>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'top' }}>{new Date(tx.date).toLocaleDateString()}</td>
                          <td style={{ verticalAlign: 'top' }}>
                            <div className="small" style={{ 
                              wordBreak: 'break-all',
                              lineHeight: '1.3',
                              maxWidth: '130px',
                              fontSize: '0.75rem'
                            }}>
                              {tx.transaction_no}
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'top' }}>
                            <div className="small" style={{ 
                              lineHeight: '1.4',
                              wordBreak: 'break-word',
                              maxWidth: '250px'
                            }}>
                              {tx.description}
                            </div>
                          </td>
                          <td className="text-end" style={{ verticalAlign: 'top' }}>
                            {tx.debit ? `$${parseFloat(tx.debit).toFixed(2)}` : '-'}
                          </td>
                          <td className="text-end" style={{ verticalAlign: 'top' }}>
                            {tx.credit ? `$${parseFloat(tx.credit).toFixed(2)}` : '-'}
                          </td>
                          <td className="text-end fw-semibold" style={{ verticalAlign: 'top' }}>
                            <div className="small">
                              ${Math.abs(runningBalance).toFixed(2)}
                              <div className={runningBalance >= 0 ? 'text-primary' : 'text-secondary'}>
                                {runningBalance >= 0 ? 'DR' : 'CR'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Balance Sheet Component
  const BalanceSheet = () => {
    const balances = calculateAccountBalances();
    
    const assetAccounts = Object.values(balances).filter(balance => {
      const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
      return accountType?.category?.toLowerCase() === 'asset' && balance.balance !== 0;
    });

    const liabilityAccounts = Object.values(balances).filter(balance => {
      const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
      return accountType?.category?.toLowerCase() === 'liability' && balance.balance !== 0;
    });

    const equityAccounts = Object.values(balances).filter(balance => {
      const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
      return accountType?.category?.toLowerCase() === 'equity' && balance.balance !== 0;
    });

    const totalAssets = assetAccounts.reduce((sum, balance) => sum + balance.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, balance) => sum + balance.balance, 0);
    const totalEquity = equityAccounts.reduce((sum, balance) => sum + balance.balance, 0);

    return (
      <div className="row">
        <div className="col-md-6">
          {/* Assets */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Assets</h5>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  {assetAccounts.map(balance => (
                    <tr key={balance.account.account_id}>
                      <td>{balance.account.name}</td>
                      <td className="text-end">${balance.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="table-success fw-bold">
                    <td>Total Assets</td>
                    <td className="text-end">${totalAssets.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          {/* Liabilities */}
          <div className="card mb-3 shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Liabilities</h5>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  {liabilityAccounts.map(balance => (
                    <tr key={balance.account.account_id}>
                      <td>{balance.account.name}</td>
                      <td className="text-end">${balance.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="table-warning fw-bold">
                    <td>Total Liabilities</td>
                    <td className="text-end">${totalLiabilities.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Equity */}
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Equity</h5>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  {equityAccounts.map(balance => (
                    <tr key={balance.account.account_id}>
                      <td>{balance.account.name}</td>
                      <td className="text-end">${balance.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="table-info fw-bold">
                    <td>Total Equity</td>
                    <td className="text-end">${totalEquity.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Check */}
          <div className="card mt-3 shadow-sm">
            <div className="card-body">
              <h6 className="text-center">Balance Check</h6>
              <div className="text-center">
                <p className="mb-2">
                  Assets: ${totalAssets.toFixed(2)} = 
                  Liabilities + Equity: ${(totalLiabilities + totalEquity).toFixed(2)}
                </p>
                <div className="mb-3">
                  {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 
                    <span className="badge bg-success">✓ Balanced</span> : 
                    <span className="badge bg-warning">⚠ Not Balanced</span>
                  }
                </div>
                
                {/* Debug Information */}
                {Math.abs(totalAssets - (totalLiabilities + totalEquity)) >= 0.01 && (
                  <div className="alert alert-warning small">
                    <h6 className="mb-2">⚠ Balance Sheet Issue:</h6>
                    <p className="mb-2">
                      <strong>Difference:</strong> ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}
                    </p>
                    <p className="mb-2">
                      <strong>To fix this imbalance:</strong>
                    </p>
                    <ol className="mb-2 text-start small">
                      <li>Go to <strong>Chart of Accounts</strong> page</li>
                      <li>Add equity accounts if missing:
                        <ul>
                          <li><strong>Owner's Capital</strong> (Account Type: Equity)</li>
                          <li><strong>Retained Earnings</strong> (Account Type: Equity)</li>
                        </ul>
                      </li>
                      <li>Go to <strong>Transactions</strong> page</li>
                      <li>Create initial capital entry:
                        <ul>
                          <li><strong>Debit:</strong> Cash (or assets you started with)</li>
                          <li><strong>Credit:</strong> Owner's Capital</li>
                        </ul>
                      </li>
                      <li>Post the transaction to make it official</li>
                    </ol>
                    <p className="mb-0">
                      <strong>Note:</strong> Every business needs initial equity entries to balance the books
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Income Statement Component
  const IncomeStatement = () => {
    const balances = calculateAccountBalances();
    
    const revenueAccounts = Object.values(balances).filter(balance => {
      const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
      return accountType?.category?.toLowerCase() === 'income' && balance.balance !== 0;
    });

    const expenseAccounts = Object.values(balances).filter(balance => {
      const accountType = accountTypes.find(type => type.account_type_id === balance.account.account_type_id);
      return accountType?.category?.toLowerCase() === 'expense' && balance.balance !== 0;
    });

    const totalRevenue = revenueAccounts.reduce((sum, balance) => sum + balance.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, balance) => sum + balance.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    return (
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center">
              <h4 className="mb-0">Income Statement</h4>
              <small>For the period {dateRange.startDate} to {dateRange.endDate}</small>
            </div>
            <div className="card-body">
              {/* Revenue Section */}
              <div className="mb-4">
                <h5 className="text-success">Revenue</h5>
                <table className="table table-sm">
                  <tbody>
                    {revenueAccounts.map(balance => (
                      <tr key={balance.account.account_id}>
                        <td className="ps-3">{balance.account.name}</td>
                        <td className="text-end">${balance.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="table-success fw-bold">
                      <td>Total Revenue</td>
                      <td className="text-end">${totalRevenue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses Section */}
              <div className="mb-4">
                <h5 className="text-danger">Expenses</h5>
                <table className="table table-sm">
                  <tbody>
                    {expenseAccounts.map(balance => (
                      <tr key={balance.account.account_id}>
                        <td className="ps-3">{balance.account.name}</td>
                        <td className="text-end">${balance.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="table-danger fw-bold">
                      <td>Total Expenses</td>
                      <td className="text-end">${totalExpenses.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Income */}
              <div className="border-top pt-3">
                <table className="table table-sm">
                  <tbody>
                    <tr className={`fw-bold fs-5 ${netIncome >= 0 ? 'table-success' : 'table-danger'}`}>
                      <td>Net Income</td>
                      <td className="text-end">
                        ${Math.abs(netIncome).toFixed(2)} {netIncome >= 0 ? '(Profit)' : '(Loss)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="ms-3 text-primary fw-semibold">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger text-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="h3 fw-bold text-dark mb-0">
            <i className="bi bi-graph-up me-3 text-primary"></i>
            Financial Reports
          </h2>
        </div>
      </div>

      {/* Report Navigation & Date Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="btn-group" role="group">
                    <button
                      className={`btn ${activeReport === 'general-ledger' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setActiveReport('general-ledger')}
                    >
                      <i className="bi bi-journal-text me-2"></i>General Ledger
                    </button>
                    <button
                      className={`btn ${activeReport === 'balance-sheet' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setActiveReport('balance-sheet')}
                    >
                      <i className="bi bi-clipboard-data me-2"></i>Balance Sheet
                    </button>
                    <button
                      className={`btn ${activeReport === 'income-statement' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setActiveReport('income-statement')}
                    >
                      <i className="bi bi-graph-up me-2"></i>Income Statement
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label small">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="row">
        <div className="col-12">
          {activeReport === 'general-ledger' && <GeneralLedger />}
          {activeReport === 'balance-sheet' && <BalanceSheet />}
          {activeReport === 'income-statement' && <IncomeStatement />}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
