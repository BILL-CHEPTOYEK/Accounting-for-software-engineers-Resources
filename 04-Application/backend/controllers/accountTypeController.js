// /04-Application/backend/controllers/accountTypeController.js

const db = require('../models');
const AccountType = db.AccountType;

// Get all account types
exports.getAllAccountTypes = async (req, res) => {
  try {
    const accountTypes = await AccountType.findAll();
    res.status(200).json(accountTypes);
  } catch (error) {
    console.error('Error in getAllAccountTypes:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single account type by ID
exports.getAccountTypeById = async (req, res) => {
  try {
    const accountType = await AccountType.findByPk(req.params.account_type_id);
    if (accountType) {
      res.status(200).json(accountType);
    } else {
      res.status(404).json({ error: 'Account Type not found' });
    }
  } catch (error) {
    console.error('Error in getAccountTypeById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a new account type
exports.createAccountType = async (req, res) => {
  try {
    // Basic validation: ensure required fields are present
    const { name, category, normal_balance } = req.body;
    if (!name || !category || !normal_balance) {
      return res.status(400).json({ error: 'Name, category, and normal_balance are required.' });
    }

    const newAccountType = await AccountType.create(req.body);
    res.status(201).json(newAccountType);
  } catch (error) {
    console.error('Error in createAccountType:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Account Type name must be unique.' });
    }
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update an account type by ID
exports.updateAccountType = async (req, res) => {
  try {
    const [updated] = await AccountType.update(req.body, {
      where: { account_type_id: req.params.account_type_id }
    });
    if (updated) {
      const updatedAccountType = await AccountType.findByPk(req.params.account_type_id);
      res.status(200).json(updatedAccountType);
    } else {
      res.status(404).json({ error: 'Account Type not found' });
    }
  } catch (error) {
    console.error('Error in updateAccountType:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Account Type name must be unique.' });
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete an account type by ID
exports.deleteAccountType = async (req, res) => {
  try {
    const deleted = await AccountType.destroy({
      where: { account_type_id: req.params.account_type_id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Account Type not found' });
    }
  } catch (error) {
    console.error('Error in deleteAccountType:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
