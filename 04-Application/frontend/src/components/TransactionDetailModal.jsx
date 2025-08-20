// /04-Application/backend/frontend/src/components/TransactionDetailModal.jsx

import React, { useState, useEffect } from 'react';
import { invoiceApi, billApi } from '../services/api';

function TransactionDetailModal({ show, onClose, selectedTransactionNo, allTransactions, accounts, users, branches }) {
  const [relatedParty, setRelatedParty] = useState(null);
  const [relatedDocument, setRelatedDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  // Fetch related party information when transaction details are loaded
  useEffect(() => {
    if (show && selectedTransactionNo && allTransactions.length > 0) {
      fetchRelatedPartyInfo();
    } else if (!show) {
      // Reset state when modal is closed
      setRelatedParty(null);
      setRelatedDocument(null);
      setLoading(false);
    }
  }, [show, selectedTransactionNo, allTransactions]);

  const fetchRelatedPartyInfo = async () => {
    const entryLines = allTransactions.filter(tx => tx.transaction_no === selectedTransactionNo);
    if (entryLines.length === 0) return;

    try {
      setLoading(true);
      setRelatedParty(null);
      setRelatedDocument(null);
      
      // Look for reference numbers that might indicate invoices or bills
      for (const line of entryLines) {
        if (line.reference_no) {
          // Check for invoice references
          if (line.reference_no.toUpperCase().includes('INV') || 
              line.reference_no.toUpperCase().includes('INVOICE') ||
              (line.description && line.description.toUpperCase().includes('INVOICE'))) {
            try {
              const invoicesRes = await invoiceApi.getAllInvoices();
              const relatedInvoice = invoicesRes.data.find(inv => 
                line.reference_no.includes(inv.document_no) || 
                line.reference_no.includes(inv.invoice_id) ||
                (line.description && line.description.includes(inv.document_no))
              );
              
              if (relatedInvoice && relatedInvoice.party) {
                setRelatedParty(relatedInvoice.party);
                setRelatedDocument({ type: 'Invoice', document: relatedInvoice });
                break;
              }
            } catch (err) {
              console.log('Could not fetch invoice details');
            }
          }
          
          // Check for bill references  
          if (line.reference_no.toUpperCase().includes('BIL') || 
              line.reference_no.toUpperCase().includes('BILL') ||
              (line.description && line.description.toUpperCase().includes('BILL'))) {
            try {
              const billsRes = await billApi.getAllBills();
              const relatedBill = billsRes.data.find(bill => 
                line.reference_no.includes(bill.document_no) || 
                line.reference_no.includes(bill.bill_id) ||
                (line.description && line.description.includes(bill.document_no))
              );
              
              if (relatedBill && relatedBill.party) {
                setRelatedParty(relatedBill.party);
                setRelatedDocument({ type: 'Bill', document: relatedBill });
                break;
              }
            } catch (err) {
              console.log('Could not fetch bill details');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching related party info:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show || !selectedTransactionNo || !allTransactions.length) {
    return null; // Don't render if not visible or no transaction selected/data available
  }

  // Filter for all lines belonging to the selected transaction_no
  const entryLines = allTransactions.filter(tx => tx.transaction_no === selectedTransactionNo)
                                  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort for consistent order

  if (entryLines.length === 0) {
    return (
      <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-secondary text-white">
              <h5 className="modal-title">Journal Entry Details</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="text-center text-danger">No details found for this Journal Entry number.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get common details from the first line of the journal entry
  const firstLine = entryLines[0];
  const addedByUser = users.find(u => u.user_id === firstLine.addedby);
  const branch = branches.find(b => b.branch_id === firstLine.branch_id);

  const totalDebits = entryLines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredits = entryLines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered modal-xl" role="document"> {/* Changed to modal-xl for more space */}
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">Journal Entry Details: {selectedTransactionNo}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body p-4"> {/* Added padding */}
            
            {/* Compact Header Information in Two Columns */}
            <div className="row mb-3">
              <div className="col-md-6">
                <h6 className="text-primary mb-2">Transaction Information</h6>
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-semibold" style={{width: '40%'}}>Transaction No.:</td>
                      <td>{firstLine.transaction_no}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Date:</td>
                      <td>{new Date(firstLine.date).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Type:</td>
                      <td>{firstLine.transaction_type}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Status:</td>
                      <td>{firstLine.is_posted ? 
                        <span className="badge bg-success">Posted</span> : 
                        <span className="badge bg-warning">Draft</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-md-6">
                <h6 className="text-primary mb-2">Entry Details</h6>
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-semibold" style={{width: '40%'}}>Branch:</td>
                      <td>{branch ? branch.name : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Added By:</td>
                      <td>{addedByUser ? `${addedByUser.first_name} ${addedByUser.last_name}` : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Total Debits:</td>
                      <td className="text-danger fw-bold">${totalDebits.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Total Credits:</td>
                      <td className="text-success fw-bold">${totalCredits.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description */}
            <div className="mb-3">
              <h6 className="text-primary mb-2">Description</h6>
              <p className="bg-light p-2 rounded">{firstLine.description || 'N/A'}</p>
            </div>

            {/* Related Party Information - Compact */}
            <div className="row mb-3">
              <div className="col-12">
                <h6 className="text-primary mb-2">
                  <i className="bi bi-person-circle me-2"></i>Related Party Information
                </h6>
                {loading ? (
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="text-muted">Loading party details...</span>
                  </div>
                ) : relatedParty ? (
                  <div className="row">
                    <div className="col-md-6">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          <tr>
                            <td className="fw-semibold" style={{width: '40%'}}>Party:</td>
                            <td>
                              <strong>{relatedParty.first_name} {relatedParty.last_name}</strong>
                              <span className={`badge ms-2 ${relatedParty.party_type === 'Customer' ? 'bg-info' : 'bg-warning'}`}>
                                {relatedParty.party_type}
                              </span>
                            </td>
                          </tr>
                          {relatedParty.contact_info?.email && (
                            <tr>
                              <td className="fw-semibold">Email:</td>
                              <td>{relatedParty.contact_info.email}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          {relatedParty.contact_info?.phone && (
                            <tr>
                              <td className="fw-semibold" style={{width: '40%'}}>Phone:</td>
                              <td>{relatedParty.contact_info.phone}</td>
                            </tr>
                          )}
                          {relatedDocument && (
                            <tr>
                              <td className="fw-semibold">Document:</td>
                              <td>
                                <span className={`badge ${relatedDocument.type === 'Invoice' ? 'bg-success' : 'bg-warning'}`}>
                                  {relatedDocument.type}
                                </span>
                                <span className="ms-2">{relatedDocument.document.document_no}</span>
                                <span className="text-muted ms-2">
                                  (${parseFloat(relatedDocument.document.total_amount).toFixed(2)})
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info py-2 mb-0">
                    <small>No related party found - This appears to be a general journal entry.</small>
                  </div>
                )}
              </div>
            </div>            <h6 className="text-primary mb-3">Individual Transaction Lines</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Account</th>
                    <th className="text-end">Debit</th>
                    <th className="text-end">Credit</th>
                    <th>Line Description</th>
                  </tr>
                </thead>
                <tbody>
                  {entryLines.map(line => {
                    const account = accounts.find(acc => acc.account_id === line.account_id);
                    return (
                      <tr key={line.transaction_id}>
                        <td>{account ? account.name : 'N/A'}</td>
                        <td className="text-end text-danger">{line.debit > 0 ? `$${parseFloat(line.debit).toFixed(2)}` : '-'}</td>
                        <td className="text-end text-success">{line.credit > 0 ? `$${parseFloat(line.credit).toFixed(2)}` : '-'}</td>
                        <td>{line.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

export default TransactionDetailModal;
