// /04-Application/backend/frontend/src/components/BillList.jsx

import React from 'react';

function BillList({ bills, loading, error, onEdit, onViewDetails, onPostBill }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading bills...</p>
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

  if (bills.length === 0) {
    return (
      <div className="alert alert-info text-center" role="alert">
        No bills found. Click "Record New Bill" to add one.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
        <thead className="bg-primary text-white">
          <tr>
            <th>Document No.</th>
            <th>Supplier</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.bill_id}>
              <td>{bill.document_no}</td>
              <td>{bill.party ? `${bill.party.first_name} ${bill.party.last_name}` : 'N/A'}</td>
              <td>{new Date(bill.issue_date).toLocaleDateString()}</td>
              <td>{new Date(bill.due_date).toLocaleDateString()}</td>
              <td>${parseFloat(bill.total_amount).toFixed(2)}</td>
              <td>
                <span className={`badge ${
                  bill.status === 'Draft' ? 'bg-secondary' :
                  bill.status === 'Approved' ? 'bg-info' : // Approved for Credit Purchase (Accounts Payable)
                  bill.status === 'Paid' ? 'bg-success' :
                  bill.status === 'Cancelled' ? 'bg-danger' :
                  'bg-warning'
                }`}>
                  {bill.status}
                </span>
              </td>
              <td className="text-center">
                <div className="d-flex justify-content-center flex-wrap gap-2">
                  {(bill.status === 'Draft' || bill.status === 'Pending Approval') && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(bill)}
                      title="Edit Bill"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onViewDetails(bill)}
                    title="View Details"
                  >
                    <i className="bi bi-eye"></i> View
                  </button>
                  {(bill.status === 'Draft' || bill.status === 'Pending Approval') && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => onPostBill(bill)}
                      title="Post Bill"
                    >
                      <i className="bi bi-check-circle"></i> Post
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BillList;
