// /04-Application/backend/frontend/src/components/PartyDetailModal.jsx

import React from 'react';

function PartyDetailModal({ show, onClose, party }) {
  // Bootstrap modal classes control visibility
  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  if (!party) {
    return null; // Don't render if no party is selected
  }

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered" role="document">
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

            <h6 className="mt-4 mb-3 text-primary">Associated Invoices (Future Enhancement)</h6>
            <p className="text-muted small">
              This section will display a list of invoices associated with this party.
              This requires backend API modifications to include related invoices when fetching party details,
              or a separate API call from the frontend.
            </p>
            {/* Future: Table or list of invoices can go here */}
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
