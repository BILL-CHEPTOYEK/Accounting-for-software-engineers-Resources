// /04-Application/backend/frontend/src/components/BillDetailModal.jsx

import React from 'react';

function BillDetailModal({ show, onClose, bill, parties, accounts }) {
  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalDialogClass = show ? 'modal-dialog modal-dialog-centered modal-lg' : 'modal-dialog modal-dialog-centered';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  if (!bill) {
    return null; // Don't render if no bill is selected
  }

  // Find the party (supplier) details
  const supplier = parties.find(p => p.party_id === bill.party_id);
  const supplierName = supplier ? `${supplier.first_name} ${supplier.last_name}` : 'Supplier Not Found';

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className={modalDialogClass} role="document">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">Bill Details: {bill.document_no}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {/* Bill Header Details */}
            <h6 className="text-info mb-3">General Information</h6>
            <dl className="row mb-4 border-bottom pb-3">
              <dt className="col-sm-4">Bill ID:</dt>
              <dd className="col-sm-8 text-break">{bill.bill_id}</dd>

              <dt className="col-sm-4">Document No.:</dt>
              <dd className="col-sm-8">{bill.document_no}</dd>

              <dt className="col-sm-4">Supplier:</dt>
              <dd className="col-sm-8">{supplierName}</dd>

              <dt className="col-sm-4">Issue Date:</dt>
              <dd className="col-sm-8">{new Date(bill.issue_date).toLocaleDateString()}</dd>

              <dt className="col-sm-4">Due Date:</dt>
              <dd className="col-sm-8">{new Date(bill.due_date).toLocaleDateString()}</dd>

              <dt className="col-sm-4">Status:</dt>
              <dd className="col-sm-8">
                <span className={`badge ${
                  bill.status === 'Draft' ? 'bg-secondary' :
                  bill.status === 'Pending Approval' ? 'bg-warning' :
                  bill.status === 'Approved' ? 'bg-info' :
                  bill.status === 'Paid' ? 'bg-success' :
                  bill.status === 'Cancelled' ? 'bg-danger' :
                  ''
                }`}>
                  {bill.status}
                </span>
              </dd>

              <dt className="col-sm-4">Created At:</dt>
              <dd className="col-sm-8">{new Date(bill.created_at).toLocaleString()}</dd>

              <dt className="col-sm-4">Last Updated:</dt>
              <dd className="col-sm-8">{new Date(bill.updated_at).toLocaleString()}</dd>
            </dl>

            {/* Bill Line Items Display */}
            <h6 className="text-info mb-3">Line Items</h6>
            {bill.lineItems && bill.lineItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>Account</th> {/* New column for account */}
                      <th className="text-end">Qty</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.lineItems.map((item, index) => {
                      const account = accounts.find(acc => acc.account_id === item.account_id);
                      const accountName = account ? `${account.account_no} - ${account.name}` : 'Account Not Found';
                      return (
                        <tr key={item.bill_line_id || index}>
                          <td>{index + 1}</td>
                          <td>{item.description}</td>
                          <td>{accountName}</td> {/* Display account name */}
                          <td className="text-end">{parseFloat(item.quantity).toFixed(2)}</td>
                          <td className="text-end">${parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="text-end fw-bold">${parseFloat(item.line_total_amount).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted fst-italic">No line items for this bill.</p>
            )}

            {/* Total Amount Summary */}
            <div className="text-end mt-4">
              <h4 className="mb-0">Total Bill Amount: <span className="fw-bold text-success">${parseFloat(bill.total_amount).toFixed(2)}</span></h4>
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

export default BillDetailModal;
