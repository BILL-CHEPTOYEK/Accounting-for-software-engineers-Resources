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
    <div className="table-responsive">
      <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
        <thead className="bg-danger text-white">
          <tr>
            <th scope="col">Document No.</th>
            <th scope="col">Type</th>
            <th scope="col">Party</th>
            <th scope="col">Issue Date</th>
            <th scope="col">Due Date</th>
            <th scope="col">Total Amount</th>
            <th scope="col">Status</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
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
                  invoice.status === 'Sent' ? 'bg-primary' :
                  invoice.status === 'Paid' ? 'bg-success' :
                  invoice.status === 'Cancelled' ? 'bg-danger' :
                  invoice.status === 'Posted_Cash_Sale' ? 'bg-success' : // Green for posted cash
                  invoice.status === 'Posted_Credit_Sale' ? 'bg-info' : '' // Blue for posted credit
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
