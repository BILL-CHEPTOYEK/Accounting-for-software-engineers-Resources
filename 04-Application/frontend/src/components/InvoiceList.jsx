// /04-Application/backend/frontend/src/components/InvoiceList.jsx

import React from 'react';

function InvoiceList({ invoices, loading, error, onEdit, onViewDetails }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading invoices...</p>
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

  if (invoices.length === 0) {
    return (
      <div className="alert alert-info text-center" role="alert">
        No invoices found. Click "Create New Invoice" to get started!
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
        <thead className="bg-danger text-white"> {/* Using bg-danger for invoices */}
          <tr>
            <th scope="col">#</th>
            <th scope="col">Document No.</th>
            <th scope="col">Type</th>
            <th scope="col">Party ID</th> {/* Will show Party ID for now */}
            <th scope="col">Issue Date</th>
            <th scope="col">Due Date</th>
            <th scope="col" className="text-end">Amount</th>
            <th scope="col">Status</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, index) => (
            <tr key={invoice.invoice_id}>
              <th scope="row">{index + 1}</th>
              <td>{invoice.document_no}</td>
              <td>
                <span className={`badge ${
                  invoice.type === 'Commercial' ? 'bg-primary' :
                  invoice.type === 'Pro forma' ? 'bg-info' :
                  'bg-secondary'
                }`}>
                  {invoice.type}
                </span>
              </td>
              <td className="text-break">{invoice.party_id}</td>
              <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
              <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
              <td className="text-end">${parseFloat(invoice.total_amount).toFixed(2)}</td>
              <td>
                <span className={`badge ${
                  invoice.status === 'Paid' ? 'bg-success' :
                  invoice.status === 'Sent' ? 'bg-primary' :
                  invoice.status === 'Received' ? 'bg-info' :
                  invoice.status === 'Cancelled' ? 'bg-danger' :
                  'bg-secondary'
                }`}>
                  {invoice.status}
                </span>
              </td>
              <td className="text-center">
                {/* Actions Buttons: Edit and Details (No Delete) */}
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(invoice)}
                  title="Edit Invoice"
                >
                  <i className="bi bi-pencil"></i> Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => onViewDetails(invoice)}
                  title="View Details"
                >
                  <i className="bi bi-eye"></i> Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceList;
