// /04-Application/backend/frontend/src/pages/InvoicePage.jsx

import React, { useState, useEffect } from 'react';
import { invoiceApi, partyApi } from '../services/api'; // Import partyApi to fetch parties
import InvoiceList from '../components/InvoiceList';
import InvoiceFormModal from '../components/InvoiceFormModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [parties, setParties] = useState([]); // State to hold parties for dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null); // For editing or viewing

  const [showDetailModal, setShowDetailModal] = useState(false);

  // Function to fetch all invoices and parties
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invoicesRes, partiesRes] = await Promise.all([
        invoiceApi.getAllInvoices(),
        partyApi.getAllParties(), // Fetch parties for the form dropdown
      ]);
      setInvoices(invoicesRes.data);
      setParties(partiesRes.data);
    } catch (err) {
      console.error('Failed to fetch invoice or party data:', err);
      setError('Failed to load data. Please check your network and backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddInvoice = () => {
    setCurrentInvoice(null); // Clear data for 'add' mode
    setShowAddEditModal(true);
  };

  const handleEditInvoice = (invoice) => {
    setCurrentInvoice(invoice); // Set data for 'edit' mode
    setShowAddEditModal(true);
  };

  const handleViewDetails = (invoice) => {
    setCurrentInvoice(invoice); // Set data for 'details' mode
    setShowDetailModal(true);
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (currentInvoice) {
        await invoiceApi.updateInvoice(currentInvoice.invoice_id, invoiceData);
      } else {
        await invoiceApi.createInvoice(invoiceData);
      }
      setShowAddEditModal(false);
      fetchData(); // Re-fetch all data to refresh lists
    } catch (err) {
      console.error('Error saving invoice:', err);
      alert('Failed to save invoice. Please check input and try again. (Backend error likely: ' + (err.response?.data?.error || err.message) + ')');
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-receipt-cutoff me-2 text-danger"></i> Invoices & Bills</span>
        <button className="btn btn-warning text-white shadow-sm" onClick={handleAddInvoice}>
          <i className="bi bi-plus-circle me-2"></i> Create New Invoice
        </button>
      </h2>

      {/* Invoice List Table */}
      <InvoiceList
        invoices={invoices}
        loading={loading}
        error={error}
        onEdit={handleEditInvoice}
        onViewDetails={handleViewDetails}
      />

      {/* Add/Edit Invoice Modal */}
      <InvoiceFormModal
        show={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        onSubmit={handleSaveInvoice}
        invoice={currentInvoice}
        parties={parties} // Pass parties to the form for dropdown
      />

      {/* View Invoice Details Modal */}
      <InvoiceDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        invoice={currentInvoice}
        parties={parties} // Pass parties to help display party name
      />
    </div>
  );
}

export default InvoicePage;
