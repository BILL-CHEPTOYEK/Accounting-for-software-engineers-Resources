// /04-Application/backend/frontend/src/components/InvoiceList.jsx

import React from 'react';

function InvoiceList({ invoices, loading, error, onEdit, onViewDetails, onPostInvoice }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-info">Loading invoices...</p>
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
        No invoices found. Click "Create New Invoice" to add one.
      </div>
    );
  }

  return (
    <div className="table-responsive rounded-4 border">
      <table className="table table-hover mb-0">
        <thead className="table-danger">
          <tr>
            <th className="py-3 px-4 fw-semibold">Document No.</th>
            <th className="py-3 px-4 fw-semibold">Type</th>
            <th className="py-3 px-4 fw-semibold">Party</th>
            <th className="py-3 px-4 fw-semibold">Issue Date</th>
            <th className="py-3 px-4 fw-semibold">Due Date</th>
            <th className="py-3 px-4 fw-semibold text-end">Total Amount</th>
            <th className="py-3 px-4 fw-semibold">Status</th>
            <th className="py-3 px-4 fw-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: '#fafafa' }}>
          {invoices.map((invoice) => (
            <tr key={invoice.invoice_id}>
              <td>{invoice.document_no}</td>
              <td>{invoice.type}</td>
              <td>{invoice.party ? invoice.party.name : 'N/A'}</td>
              <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
              <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
              <td>${parseFloat(invoice.total_amount).toFixed(2)}</td>
              <td>
                <span className={`badge ${
                  invoice.status === 'Draft' ? 'bg-secondary' :
                  invoice.status === 'Pending' ? 'bg-warning' :
                  invoice.status === 'Sent' ? 'bg-primary' :
                  invoice.status === 'Partially Paid' ? 'bg-info' :
                  invoice.status === 'Paid' ? 'bg-success' :
                  invoice.status === 'Overdue' ? 'bg-danger' :
                  invoice.status === 'Cancelled' ? 'bg-danger' :
                  invoice.status === 'Void' ? 'bg-dark' : 'bg-secondary'
                }`}>
                  {invoice.status}
                </span>
              </td>
              <td className="text-center">
                <div className="d-flex justify-content-center flex-wrap gap-2"> {/* Use flex-wrap for smaller screens */}
                  {invoice.status === 'Draft' && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(invoice)}
                      title="Edit Invoice"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onViewDetails(invoice)}
                    title="View Details"
                  >
                    <i className="bi bi-eye"></i> View
                  </button>
                  {invoice.status === 'Draft' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => onPostInvoice(invoice)}
                      title="Post Invoice"
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

export default InvoiceList;
