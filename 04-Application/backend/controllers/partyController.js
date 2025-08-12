const { Party } = require('../models');

// Get all parties
exports.getAllParties = async (req, res) => {
  try {
    const parties = await Party.findAll();
    res.status(200).json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single party by ID
exports.getPartyById = async (req, res) => {
  try {
    const party = await Party.findByPk(req.params.party_id);
    if (party) {
      res.status(200).json(party);
    } else {
      res.status(404).json({ error: 'Party not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new party
exports.createParty = async (req, res) => {
  try {
    const newParty = await Party.create(req.body);
    res.status(201).json(newParty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a party by ID
exports.updateParty = async (req, res) => {
  try {
    const [updated] = await Party.update(req.body, {
      where: { party_id: req.params.party_id }
    });
    if (updated) {
      const updatedParty = await Party.findByPk(req.params.party_id);
      res.status(200).json(updatedParty);
    } else {
      res.status(404).json({ error: 'Party not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a party by ID
exports.deleteParty = async (req, res) => {
  try {
    const deleted = await Party.destroy({
      where: { party_id: req.params.party_id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Party not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};