// /04-Application/backend/frontend/src/components/InvoiceDetailModal.jsx

import React from 'react';

function InvoiceDetailModal({ show, onClose, invoice, parties }) {
  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  if (!invoice) {
    return null; // Don't render if no invoice is selected
  }

  // Find the party details using the party_id from the invoice
  const party = parties.find(p => p.party_id === invoice.party_id);
  const partyName = party ? `${party.first_name} ${party.last_name} (${party.party_type})` : 'Party Not Found';

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-info text-white"> {/* Using info for detail header */}
            <h5 className="modal-title">Invoice Details: {invoice.document_no}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <dl className="row">
              <dt className="col-sm-4">Invoice ID:</dt>
              <dd className="col-sm-8 text-break">{invoice.invoice_id}</dd>

              <dt className="col-sm-4">Document No.:</dt>
              <dd className="col-sm-8">{invoice.document_no}</dd>

              <dt className="col-sm-4">Party:</dt>
              <dd className="col-sm-8">{partyName}</dd>

              <dt className="col-sm-4">Type:</dt>
              <dd className="col-sm-8">
                <span className={`badge ${
                  invoice.type === 'Commercial' ? 'bg-primary' :
                  invoice.type === 'Pro forma' ? 'bg-info' :
                  'bg-secondary'
                }`}>
                  {invoice.type}
                </span>
              </dd>

              <dt className="col-sm-4">Issue Date:</dt>
              <dd className="col-sm-8">{new Date(invoice.issue_date).toLocaleDateString()}</dd>

              <dt className="col-sm-4">Due Date:</dt>
              <dd className="col-sm-8">{new Date(invoice.due_date).toLocaleDateString()}</dd>

              <dt className="col-sm-4">Total Amount:</dt>
              <dd className="col-sm-8 fw-bold text-success">${parseFloat(invoice.total_amount).toFixed(2)}</dd>

              <dt className="col-sm-4">Status:</dt>
              <dd className="col-sm-8">
                <span className={`badge ${
                  invoice.status === 'Paid' ? 'bg-success' :
                  invoice.status === 'Sent' ? 'bg-primary' :
                  invoice.status === 'Received' ? 'bg-info' :
                  invoice.status === 'Cancelled' ? 'bg-danger' :
                  'bg-secondary'
                }`}>
                  {invoice.status}
                </span>
              </dd>

              <dt className="col-sm-4">Created At:</dt>
              <dd className="col-sm-8">{new Date(invoice.created_at).toLocaleString()}</dd>

              <dt className="col-sm-4">Last Updated:</dt>
              <dd className="col-sm-8">{new Date(invoice.updated_at).toLocaleString()}</dd>
            </dl>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetailModal;
