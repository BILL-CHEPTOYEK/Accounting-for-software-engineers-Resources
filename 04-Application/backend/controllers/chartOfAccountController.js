// /04-Application/backend/controllers/chartOfAccountController.js

const db = require('../models');
const ChartOfAccount = db.ChartOfAccount;
const AccountType = db.AccountType; // Needed for foreign key validation

// Get all accounts
exports.getAllChartOfAccounts = async (req, res) => {
  try {
    const accounts = await ChartOfAccount.findAll({
      include: [{ model: AccountType, as: 'accountType' }] // Include associated AccountType
    });
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error in getAllChartOfAccounts:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single account by ID
exports.getChartOfAccountById = async (req, res) => {
  try {
    const account = await ChartOfAccount.findByPk(req.params.account_id, {
      include: [{ model: AccountType, as: 'accountType' }]
    });
    if (account) {
      res.status(200).json(account);
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  } catch (error) {
    console.error('Error in getChartOfAccountById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a new account
exports.createChartOfAccount = async (req, res) => {
  try {
    const { name, account_type_id, account_no, parent_id } = req.body;

    // Basic validation
    if (!name || !account_type_id || !account_no) {
      return res.status(400).json({ error: 'Name, account_type_id, and account_no are required.' });
    }

    // Validate account_type_id exists
    const existingAccountType = await AccountType.findByPk(account_type_id);
    if (!existingAccountType) {
      return res.status(400).json({ error: 'Invalid account_type_id provided.' });
    }

    // Convert empty string parent_id to null for Sequelize/DB
    const accountData = {
      ...req.body,
      parent_id: parent_id === '' ? null : parent_id // Convert empty string to null
    };

    // Validate parent_id exists if provided (and not null)
    if (accountData.parent_id) {
      const existingParentAccount = await ChartOfAccount.findByPk(accountData.parent_id);
      if (!existingParentAccount) {
        return res.status(400).json({ error: 'Invalid parent_id provided.' });
      }
    }

    const newAccount = await ChartOfAccount.create(accountData);
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error in createChartOfAccount:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Account Number must be unique.' });
    }
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update an account by ID
exports.updateChartOfAccount = async (req, res) => {
  try {
    const { account_type_id, parent_id } = req.body;

    // Validate account_type_id exists if provided
    if (account_type_id) {
      const existingAccountType = await AccountType.findByPk(account_type_id);
      if (!existingAccountType) {
        return res.status(400).json({ error: 'Invalid account_type_id provided.' });
      }
    }

    // Convert empty string parent_id to null for Sequelize/DB
    const accountData = {
      ...req.body,
      parent_id: parent_id === '' ? null : parent_id // Convert empty string to null
    };

    // Validate parent_id exists if provided (and not null)
    if (accountData.parent_id) {
      const existingParentAccount = await ChartOfAccount.findByPk(accountData.parent_id);
      if (!existingParentAccount) {
        return res.status(400).json({ error: 'Invalid parent_id provided.' });
      }
    }

    const [updated] = await ChartOfAccount.update(accountData, {
      where: { account_id: req.params.account_id }
    });
    if (updated) {
      const updatedAccount = await ChartOfAccount.findByPk(req.params.account_id, {
        include: [{ model: AccountType, as: 'accountType' }]
      });
      res.status(200).json(updatedAccount);
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  } catch (error) {
    console.error('Error in updateChartOfAccount:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Account Number must be unique.' });
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete an account by ID
exports.deleteChartOfAccount = async (req, res) => {
  try {
    const deleted = await ChartOfAccount.destroy({
      where: { account_id: req.params.account_id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  } catch (error) {
    console.error('Error in deleteChartOfAccount:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
