// /04-Application/backend/controllers/branchController.js

const db = require('../models');
const Branch = db.Branch;

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll();
    res.status(200).json(branches);
  } catch (error) {
    console.error('Error in getAllBranches:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single branch by ID
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.branch_id);
    if (branch) {
      res.status(200).json(branch);
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  } catch (error) {
    console.error('Error in getBranchById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    // Basic validation: ensure required fields are present
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    const newBranch = await Branch.create(req.body);
    res.status(201).json(newBranch);
  } catch (error) {
    console.error('Error in createBranch:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Branch name must be unique.' });
    }
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update a branch by ID
exports.updateBranch = async (req, res) => {
  try {
    const [updated] = await Branch.update(req.body, {
      where: { branch_id: req.params.branch_id }
    });
    if (updated) {
      const updatedBranch = await Branch.findByPk(req.params.branch_id);
      res.status(200).json(updatedBranch);
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  } catch (error) {
    console.error('Error in updateBranch:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Branch name must be unique.' });
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete a branch by ID
exports.deleteBranch = async (req, res) => {
  try {
    const deleted = await Branch.destroy({
      where: { branch_id: req.params.branch_id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  } catch (error) {
    console.error('Error in deleteBranch:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
