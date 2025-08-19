// /04-Application/backend/frontend/src/pages/PartyPage.jsx

import React, { useState, useEffect } from 'react';
import { partyApi } from '../services/api';
import PartyList from '../components/PartyList'; // Component to display the table
import PartyFormModal from '../components/PartyFormModal'; // Modal for adding/editing parties
import PartyDetailModal from '../components/PartyDetailModal'; // Modal for viewing party details

function PartyPage() {
  const [parties, setParties] = useState([]); // State to hold the list of parties
  const [loading, setLoading] = useState(true); // State for loading status
  const [error, setError] = useState(null); // State for error messages

  const [showAddEditModal, setShowAddEditModal] = useState(false); // Controls add/edit modal visibility
  const [currentParty, setCurrentParty] = useState(null); // Holds party data for editing or viewing details

  const [showDetailModal, setShowDetailModal] = useState(false); // Controls detail modal visibility

  // Function to fetch all parties from the backend
  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await partyApi.getAllParties();
      setParties(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to fetch parties:', err);
      setError('Failed to load parties. Please check your network connection and backend server.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to fetch parties when the component mounts
  useEffect(() => {
    fetchParties();
  }, []);

  // Handler for opening the Add Party modal
  const handleAddParty = () => {
    setCurrentParty(null); // Clear any existing party data
    setShowAddEditModal(true);
  };

  // Handler for opening the Edit Party modal
  const handleEditParty = (party) => {
    setCurrentParty(party); // Set the party data to populate the for
    setShowAddEditModal(true);
  };

  // Handler for opening the View Details modal
  const handleViewDetails = (party) => {
    setCurrentParty(party); // Set the party data for detail view
    setShowDetailModal(true);
  };

  // Handler for saving a party (from the add/edit modal)
  const handleSaveParty = async (partyData) => {
    try {
      if (currentParty) {
        // If currentParty exists, it's an update operation
        await partyApi.updateParty(currentParty.party_id, partyData);
      } else {
        // Otherwise, it's a create operation
        await partyApi.createParty(partyData);
      }
      setShowAddEditModal(false); // Close the modal
      fetchParties(); // Re-fetch parties to update the list
    } catch (err) {
      console.error('Error saving party:', err);
      // You could add more specific error handling here
      alert('Failed to save party. Please check input and try again.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-people-fill me-2 text-info"></i> Parties (Customers & Suppliers)</span>
        {/* Add Party Button - aligned to the right */}
        <button className="btn btn-success shadow-sm" onClick={handleAddParty}>
          <i className="bi bi-plus-circle me-2"></i> Add New Party
        </button>
      </h2>

      {/* Party List Table */}
      <PartyList
        parties={parties}
        loading={loading}
        error={error}
        onEdit={handleEditParty}
        onViewDetails={handleViewDetails}
      />

      {/* Add/Edit Party Modal */}
      <PartyFormModal
        show={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        onSubmit={handleSaveParty}
        party={currentParty} // Pass currentParty for editing
      />

      {/* View Party Details Modal */}
      <PartyDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        party={currentParty} // Pass currentParty for viewing details
      />
    </div>
  );
}

export default PartyPage;
