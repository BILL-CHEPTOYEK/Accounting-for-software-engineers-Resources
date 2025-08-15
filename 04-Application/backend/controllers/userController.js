// /04-Application/backend/controllers/userController.js

const db = require('../models');
const User = db.User;
const Branch = db.Branch; 
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Branch, as: 'branch' }] 
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.user_id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Branch, as: 'branch' }] // Include associated Branch data
    });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a new user (Registration)
exports.createUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, branch_id } = req.body; 

    // Basic validation
    if (!email || !password || !branch_id) { // Ensure branch_id is also checked
      return res.status(400).json({ error: 'Email, password, and branch are required.' });
    }

    // Validate if branch_id exists
    const existingBranch = await Branch.findByPk(branch_id);
    if (!existingBranch) {
      return res.status(400).json({ error: 'Invalid branch_id provided.' });
    }
    
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      role,
      branch_id 
    });

    // Exclude password hash from the response
    const userResponse = newUser.toJSON();
    delete userResponse.password_hash;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error in createUser:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email must be unique.' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: 'Invalid branch ID provided.' });
    }
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  try {
    const { password, branch_id } = req.body; // Destructure branch_id to handle separately
    const updateData = { ...req.body };

    // Validate if branch_id exists if provided
    if (branch_id) {
        const existingBranch = await Branch.findByPk(branch_id);
        if (!existingBranch) {
            return res.status(400).json({ error: 'Invalid branch_id provided.' });
        }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
      delete updateData.password; 
    }

    const [updated] = await User.update(updateData, {
      where: { user_id: req.params.user_id }
    });
    if (updated) {
      const updatedUser = await User.findByPk(req.params.user_id, {
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Branch, as: 'branch' }] 
      });
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error in updateUser:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email must be unique.' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: 'Invalid branch ID provided.' });
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { user_id: req.params.user_id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // jwt later
    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    res.status(200).json({ message: 'Login successful', user: userResponse });

  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
