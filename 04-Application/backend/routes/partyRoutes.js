// /04-Application/backend/routes/partyRoutes.js

const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');

// Route to get all parties
router.get('/', partyController.getAllParties);

// Route to get a single party by ID
router.get('/:party_id', partyController.getPartyById);

// Route to create a new party
router.post('/', partyController.createParty);

// Route to update a party by ID (using PUT for full updates)
router.put('/:party_id', partyController.updateParty);

// Route to delete a party by ID
router.delete('/:party_id', partyController.deleteParty);

module.exports = router;
