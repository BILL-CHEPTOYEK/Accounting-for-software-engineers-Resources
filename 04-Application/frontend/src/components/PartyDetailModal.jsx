// /04-Application/backend/frontend/src/components/PartyDetailModal.jsx

import React, { useState, useEffect } from 'react';
import { invoiceApi, billApi } from '../services/api';

function PartyDetailModal({ show, onClose, party }) {
  const [associatedInvoices, setAssociatedInvoices] = useState([]);
  const [associatedBills, setAssociatedBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bootstrap modal classes control visibility
  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  // Fetch associated invoices and bills when party changes
  useEffect(() => {
    if (party && show) {
      fetchAssociatedDocuments();
    }
  }, [party, show]);

  const fetchAssociatedDocuments = async () => {
    if (!party) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [invoicesRes, billsRes] = await Promise.all([
        invoiceApi.getAllInvoices(),
        billApi.getAllBills(),
      ]);
      
      // Filter invoices and bills for this specific party
      const partyInvoices = invoicesRes.data.filter(invoice => invoice.party_id === party.party_id);
      const partyBills = billsRes.data.filter(bill => bill.party_id === party.party_id);
      
      setAssociatedInvoices(partyInvoices);
      setAssociatedBills(partyBills);
    } catch (err) {
      console.error('Failed to fetch associated documents:', err);
      setError('Failed to load associated documents');
    } finally {
      setLoading(false);
    }
  };

  if (!party) {
    return null; // Don't render if no party is selected
  }

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-secondary text-white">
            <h5 className="modal-title">Party Details: {party.first_name} {party.last_name}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <dl className="row">
              <dt className="col-sm-4">ID:</dt>
              <dd className="col-sm-8 text-break">{party.party_id}</dd>

              <dt className="col-sm-4">First Name:</dt>
              <dd className="col-sm-8">{party.first_name}</dd>

              <dt className="col-sm-4">Last Name:</dt>
              <dd className="col-sm-8">{party.last_name}</dd>

              <dt className="col-sm-4">Party Type:</dt>
              <dd className="col-sm-8">
                <span className={`badge ${party.party_type === 'Customer' ? 'bg-info' : 'bg-secondary'}`}>
                  {party.party_type}
                </span>
              </dd>

              <dt className="col-sm-4">Email:</dt>
              <dd className="col-sm-8">{party.contact_info?.email || 'N/A'}</dd>

              <dt className="col-sm-4">Phone:</dt>
              <dd className="col-sm-8">{party.contact_info?.phone || 'N/A'}</dd>

              <dt className="col-sm-4">Active:</dt>
              <dd className="col-sm-8">{party.is_active ? 'Yes' : 'No'}</dd>

              <dt className="col-sm-4">Created At:</dt>
              <dd className="col-sm-8">{new Date(party.created_at).toLocaleString()}</dd>

              <dt className="col-sm-4">Last Updated:</dt>
              <dd className="col-sm-8">{new Date(party.updated_at).toLocaleString()}</dd>
            </dl>

            {/* Associated Invoices and Bills Section */}
            <div className="row mt-4">
              {party.party_type === 'Customer' && (
                <div className="col-12">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-receipt me-2"></i>Associated Invoices ({associatedInvoices.length})
                  </h6>
                  {loading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading invoices...</span>
                    </div>
                  ) : error ? (
                    <div className="alert alert-warning small">{error}</div>
                  ) : associatedInvoices.length === 0 ? (
                    <p className="text-muted small">No invoices found for this customer.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-striped">
                        <thead className="table-primary">
                          <tr>
                            <th>Invoice #</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {associatedInvoices.map(invoice => (
                            <tr key={invoice.invoice_id}>
                              <td>{invoice.document_no}</td>
                              <td>{invoice.type}</td>
                              <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {party.party_type === 'Supplier' && (
                <div className="col-12">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-file-earmark-text me-2"></i>Associated Bills ({associatedBills.length})
                  </h6>
                  {loading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading bills...</span>
                    </div>
                  ) : error ? (
                    <div className="alert alert-warning small">{error}</div>
                  ) : associatedBills.length === 0 ? (
                    <p className="text-muted small">No bills found for this supplier.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-striped">
                        <thead className="table-warning">
                          <tr>
                            <th>Bill #</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {associatedBills.map(bill => (
                            <tr key={bill.bill_id}>
                              <td>{bill.document_no}</td>
                              <td>{new Date(bill.issue_date).toLocaleDateString()}</td>
                              <td>{new Date(bill.due_date).toLocaleDateString()}</td>
                              <td>${parseFloat(bill.total_amount).toFixed(2)}</td>
                              <td>
                                <span className={`badge ${
                                  bill.status === 'Draft' ? 'bg-secondary' :
                                  bill.status === 'Received' ? 'bg-info' :
                                  bill.status === 'Paid' ? 'bg-success' :
                                  bill.status === 'Cancelled' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {bill.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
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

export default PartyDetailModal;
